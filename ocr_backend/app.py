# =============================================================================
# OCR Backend — Unified Engine (PaddleOCR + Chandra via Datalab Hosted API)
#
# Usage:
#   POST /ocr_api/ocr      ?engine=paddle   (default)
#   POST /ocr_api/ocr      ?engine=chandra
#   POST /ocr_api/ocr_v5   ?engine=paddle   (default)
#   POST /ocr_api/ocr_v5   ?engine=chandra
#
# Required environment variables:
#   CHANDRA_API_KEY            Your Datalab API key (from datalab.to/app/keys)
#
# Optional environment variables:
#   CHANDRA_MODE               fast (default) | balanced | accurate
#   CHANDRA_POLL_INTERVAL      2 (seconds, default)
#   CHANDRA_TIMEOUT_SECONDS    120 (default)
#   OCR_SKIP_MODEL_LOAD        1 = skip PaddleOCR loading (for tests)
# =============================================================================

import os
import re
import shutil
import time
import uuid
from pathlib import Path

import cv2
import requests
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from paddleocr import PaddleOCR

from .ocr_utils import (
    build_overlay_image,
    group_items_into_blocks,
    merge_items_into_lines,
    normalize_image_max_side,
    preprocess_for_handwriting,
)

# -----------------------------------------------------------------------------
# App setup
# -----------------------------------------------------------------------------

app = FastAPI(title="OCR Backend (PaddleOCR + Chandra)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR    = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
OUTPUT_DIR  = BASE_DIR / "output"
UPLOADS_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)
app.mount("/ocr_static", StaticFiles(directory=str(OUTPUT_DIR)), name="ocr_static")

# -----------------------------------------------------------------------------
# PaddleOCR — lazy loading (same as teammate's structure)
# -----------------------------------------------------------------------------

OCR_CFG_PATH  = BASE_DIR / "PaddleOCR.yaml"
_ocr_instance = None


def get_ocr():
    global _ocr_instance
    if os.getenv("OCR_SKIP_MODEL_LOAD") == "1":
        raise RuntimeError("OCR model loading disabled for tests.")
    if _ocr_instance is None:
        _ocr_instance = PaddleOCR(paddlex_config=str(OCR_CFG_PATH))
    return _ocr_instance


# -----------------------------------------------------------------------------
# Chandra / Datalab configuration
# -----------------------------------------------------------------------------

DATALAB_API_KEY         = os.getenv("CHANDRA_API_KEY", "").strip()
DATALAB_ENDPOINT        = "https://www.datalab.to/api/v1/convert"
CHANDRA_MODE            = os.getenv("CHANDRA_MODE", "fast").strip().lower()
CHANDRA_POLL_INTERVAL   = float(os.getenv("CHANDRA_POLL_INTERVAL", "2"))
CHANDRA_TIMEOUT_SECONDS = float(os.getenv("CHANDRA_TIMEOUT_SECONDS", "120"))


# =============================================================================
# Chandra helpers
# =============================================================================

def markdown_to_text(markdown: str) -> str:
    """Strip Markdown formatting and return plain text."""
    text = str(markdown or "")
    text = text.replace("\r\n", "\n")
    text = re.sub(r"```[\s\S]*?```", lambda m: m.group(0).replace("```", ""), text)
    text = re.sub(r"!\[[^\]]*\]\([^\)]*\)", " ", text)
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
    text = re.sub(r"^\s{0,3}#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*[-*+]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*\d+\.\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"[*_`>#]", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def run_chandra_api(input_path: Path) -> dict:
    """
    Call the Datalab hosted Chandra API.
    Returns a dict with keys: markdown, metadata, page_count, quality_score
    Raises RuntimeError on failure.
    """
    if not DATALAB_API_KEY:
        raise RuntimeError(
            "CHANDRA_API_KEY is not set. "
            "Add it to your .env file. Get your key at https://www.datalab.to/app/keys"
        )

    headers = {"X-API-Key": DATALAB_API_KEY}

    # Step 1: Submit file for processing
    with open(input_path, "rb") as f:
        mime     = "application/pdf" if input_path.suffix.lower() == ".pdf" else "image/jpeg"
        response = requests.post(
            DATALAB_ENDPOINT,
            headers=headers,
            files={"file": (input_path.name, f, mime)},
            data={
                "output_format":            "markdown",
                "mode":                     CHANDRA_MODE,
                "disable_image_extraction": "true",
            },
            timeout=30,
        )

    if not response.ok:
        raise RuntimeError(
            f"Datalab API submission failed ({response.status_code}): {response.text}"
        )

    data = response.json()
    if not data.get("success"):
        raise RuntimeError(f"Datalab API rejected the request: {data}")

    check_url = data.get("request_check_url")
    if not check_url:
        raise RuntimeError("Datalab API did not return a check URL.")

    # Step 2: Poll until processing is complete
    deadline = time.time() + CHANDRA_TIMEOUT_SECONDS
    while time.time() < deadline:
        poll   = requests.get(check_url, headers=headers, timeout=30)
        result = poll.json()
        status = result.get("status", "")

        if status == "complete":
            return {
                "markdown":   result.get("markdown", ""),
                "metadata":   result.get("metadata", {}),
                "page_count": result.get("page_count"),
                # parse_quality_score is 0-5, convert to 0-1 to match paddle format
                "quality_score": round(result["parse_quality_score"] / 5, 4)
                if result.get("parse_quality_score") is not None else None,
            }

        if status == "failed":
            raise RuntimeError(
                f"Datalab processing failed: {result.get('error', 'unknown error')}"
            )

        time.sleep(CHANDRA_POLL_INTERVAL)

    raise RuntimeError(
        f"Datalab API timed out after {CHANDRA_TIMEOUT_SECONDS}s. "
        "Try increasing CHANDRA_TIMEOUT_SECONDS or switching to CHANDRA_MODE=fast."
    )


# =============================================================================
# Endpoints
# =============================================================================

@app.get("/ocr_api/health")
def health():
    """Health check — reports both engines."""
    return {
        "ok": True,
        "engines": {
            "paddle":  "ready",
            "chandra": {
                "provider":    "datalab.to hosted API",
                "mode":        CHANDRA_MODE,
                "api_key_set": bool(DATALAB_API_KEY),
            },
        },
    }


@app.post("/ocr_api/ocr")
async def run_ocr(
    file: UploadFile = File(...),
    engine: str = Query(
        default="paddle",
        description="OCR engine: 'paddle' (local) or 'chandra' (Datalab cloud API)",
    ),
):
    engine = engine.strip().lower()
    if engine not in ("paddle", "chandra"):
        return {"error": f"Unknown engine '{engine}'. Choose 'paddle' or 'chandra'."}

    filename_lower = (file.filename or "").lower()

    # Save uploaded file
    ext      = Path(file.filename or "document").suffix.lower() or ".jpg"
    file_id  = uuid.uuid4().hex
    raw_path = UPLOADS_DIR / f"{file_id}{ext}"
    raw_path.write_bytes(await file.read())

    # Copy original to output dir so frontend can display it
    original_name = f"original_{file_id}{ext}"
    shutil.copy2(raw_path, OUTPUT_DIR / original_name)
    original_url  = f"/ocr_static/{original_name}"

    # ------------------------------------------------------------------
    # PaddleOCR path
    # ------------------------------------------------------------------
    if engine == "paddle":
        if filename_lower.endswith(".pdf"):
            return {
                "error": (
                    "PDF uploads are not supported by PaddleOCR. "
                    "Upload an image, or use engine=chandra."
                )
            }

        clean_path = preprocess_for_handwriting(raw_path)

        try:
            ocr_client = get_ocr()
        except RuntimeError as e:
            raise HTTPException(status_code=503, detail=str(e))

        page   = ocr_client.predict(str(clean_path))[0]
        lines  = page.get("rec_texts", [])
        scores = page.get("rec_scores", [])
        boxes  = page.get("rec_boxes", None)

        items = []
        for i, text in enumerate(lines):
            score = float(scores[i]) if i < len(scores) else None
            box   = None
            if boxes is not None and i < len(boxes):
                box = [int(x) for x in boxes[i].tolist()]
            items.append({"text": text, "score": score, "box": box})

        return {
            "filename":     file.filename,
            "engine":       "paddle",
            "text":         "\n".join(lines),
            "items":        items,
            "original_url": original_url,
            "debug": {
                "mode":     "ocr_preprocessed",
                "raw_path": str(raw_path),
                "used_path": str(clean_path),
            },
        }

    # ------------------------------------------------------------------
    # Chandra / Datalab hosted API path
    # ------------------------------------------------------------------
    else:
        try:
            result = run_chandra_api(raw_path)
        except RuntimeError as exc:
            return {"error": str(exc)}

        markdown   = result["markdown"]
        plain_text = markdown_to_text(markdown)
        metadata   = result.get("metadata") or {}

        return {
            "filename":     file.filename,
            "engine":       "chandra",
            "text":         plain_text,
            "merged_text":  markdown,
            "markdown":     markdown,
            "items":        [],
            "blocks":       [],
            "original_url": original_url,
            "image_url":    "",
            "image_size":   [0, 0],
            "overlay_url":  "",
            "html_url":     "",
            "markdown_url": "",
            "metadata":     metadata,
            "confidence":   result.get("quality_score"),
            "debug": {
                "mode":         "chandra_datalab_hosted_api",
                "raw_path":     str(raw_path),
                "chandra_mode": CHANDRA_MODE,
                "page_count":   result.get("page_count"),
            },
        }


@app.post("/ocr_api/ocr_v5")
async def run_ocr_v5(
    file: UploadFile = File(...),
    engine: str = Query(
        default="paddle",
        description="OCR engine: 'paddle' (local) or 'chandra' (Datalab cloud API)",
    ),
):
    engine = engine.strip().lower()
    if engine not in ("paddle", "chandra"):
        return {"error": f"Unknown engine '{engine}'. Choose 'paddle' or 'chandra'."}

    filename_lower = (file.filename or "").lower()

    # Save uploaded file
    ext      = Path(file.filename or "document").suffix.lower() or ".jpg"
    file_id  = uuid.uuid4().hex
    raw_path = UPLOADS_DIR / f"v5_{file_id}{ext}"
    raw_path.write_bytes(await file.read())

    # Copy original to output dir so frontend can display it
    original_name = f"original_{file_id}{ext}"
    shutil.copy2(raw_path, OUTPUT_DIR / original_name)
    original_url  = f"/ocr_static/{original_name}"

    # ------------------------------------------------------------------
    # PaddleOCR path
    # ------------------------------------------------------------------
    if engine == "paddle":
        if filename_lower.endswith(".pdf"):
            return {
                "error": (
                    "PDF uploads are not supported by PaddleOCR. "
                    "Upload an image, or use engine=chandra."
                )
            }

        norm_path = normalize_image_max_side(raw_path, max_side=1600)

        try:
            ocr_client = get_ocr()
        except RuntimeError as e:
            raise HTTPException(status_code=503, detail=str(e))

        page   = ocr_client.predict(
            str(norm_path),
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
        )[0]

        lines  = page.get("rec_texts", [])
        scores = page.get("rec_scores", [])
        boxes  = page.get("rec_boxes", None)

        items = []
        for i, text in enumerate(lines):
            score = float(scores[i]) if i < len(scores) else None
            box   = None
            if boxes is not None and i < len(boxes):
                box = [int(x) for x in boxes[i].tolist()]
            items.append({"text": text, "score": score, "box": box})

        blocks = group_items_into_blocks(items)

        merged_text = "\n\n".join(block["text"] for block in blocks).strip()
        if not merged_text:
            merged_text = merge_items_into_lines(items)

        overlay_name = f"overlay_{file_id}.jpg"
        overlay_path = OUTPUT_DIR / overlay_name
        build_overlay_image(Path(norm_path), blocks, overlay_path)

        norm_img   = cv2.imread(str(norm_path))
        image_size = (
            [int(norm_img.shape[1]), int(norm_img.shape[0])]
            if norm_img is not None else [0, 0]
        )

        return {
            "filename":     file.filename,
            "engine":       "paddle",
            "text":         "\n".join(lines),
            "merged_text":  merged_text,
            "items":        items,
            "blocks":       blocks,
            "original_url": original_url,
            "image_url":    f"/ocr_static/{Path(norm_path).name}",
            "image_size":   image_size,
            "overlay_url":  f"/ocr_static/{overlay_name}",
            "debug": {
                "mode":     "pp-ocrv5_block_linked",
                "raw_path": str(raw_path),
                "used_path": str(norm_path),
            },
        }

    # ------------------------------------------------------------------
    # Chandra / Datalab hosted API path
    # ------------------------------------------------------------------
    else:
        try:
            result = run_chandra_api(raw_path)
        except RuntimeError as exc:
            return {"error": str(exc)}

        markdown   = result["markdown"]
        plain_text = markdown_to_text(markdown)
        metadata   = result.get("metadata") or {}

        return {
            "filename":     file.filename,
            "engine":       "chandra",
            "text":         plain_text,
            "merged_text":  markdown,
            "markdown":     markdown,
            "items":        [],
            "blocks":       [],
            "original_url": original_url,
            "image_url":    "",
            "image_size":   [0, 0],
            "overlay_url":  "",
            "html_url":     "",
            "markdown_url": "",
            "metadata":     metadata,
            "confidence":   result.get("quality_score"),
            "debug": {
                "mode":         "chandra_datalab_hosted_api",
                "raw_path":     str(raw_path),
                "chandra_mode": CHANDRA_MODE,
                "page_count":   result.get("page_count"),
            },
        }
