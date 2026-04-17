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
# =============================================================================

import os
import re
import shutil
import time
import uuid
from pathlib import Path

import cv2
import numpy as np
import requests
from fastapi import FastAPI, File, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from paddleocr import PaddleOCR

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

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "output"
UPLOADS_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)
app.mount("/ocr_static", StaticFiles(directory=str(OUTPUT_DIR)), name="ocr_static")

# -----------------------------------------------------------------------------
# PaddleOCR initialisation
# -----------------------------------------------------------------------------

OCR_CFG_PATH = BASE_DIR / "PaddleOCR.yaml"
ocr = PaddleOCR(paddlex_config=str(OCR_CFG_PATH))

# -----------------------------------------------------------------------------
# Chandra / Datalab configuration
# -----------------------------------------------------------------------------

DATALAB_API_KEY         = os.getenv("CHANDRA_API_KEY", "").strip()
DATALAB_ENDPOINT        = "https://www.datalab.to/api/v1/convert"
CHANDRA_MODE            = os.getenv("CHANDRA_MODE", "fast").strip().lower()
CHANDRA_POLL_INTERVAL   = float(os.getenv("CHANDRA_POLL_INTERVAL", "2"))
CHANDRA_TIMEOUT_SECONDS = float(os.getenv("CHANDRA_TIMEOUT_SECONDS", "120"))


# =============================================================================
# PaddleOCR helpers
# =============================================================================

def is_clean_image(img: np.ndarray) -> bool:
    """
    Detect if an image is already clean (white/light background, dark text).
    If more than 60% of pixels are bright (>200), skip aggressive preprocessing.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    bright_ratio = np.sum(gray > 200) / gray.size
    return bright_ratio >= 0.6


def remove_shadow(gray: np.ndarray) -> np.ndarray:
    """
    Remove uneven lighting and shadows using morphological background estimation.
    """
    kernel     = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 25))
    background = cv2.dilate(gray, kernel)
    background = cv2.GaussianBlur(background, (21, 21), 0)
    norm       = cv2.divide(gray.astype(np.float32), background.astype(np.float32))
    return np.clip(norm * 255, 0, 255).astype(np.uint8)


def auto_perspective_correction(img: np.ndarray) -> np.ndarray:
    """
    Detect the largest rectangular contour (assumed to be the paper) and apply
    a perspective warp to straighten it.
    Only applies if a clear quadrilateral covering 20-90% of image area is found.
    Returns original image unchanged if no suitable rectangle is detected.
    """
    orig_h, orig_w = img.shape[:2]
    gray    = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges   = cv2.Canny(blurred, 50, 150)
    edges   = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=1)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours     = sorted(contours, key=cv2.contourArea, reverse=True)

    paper_contour = None
    for cnt in contours[:5]:
        peri   = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        area   = cv2.contourArea(approx)
        # Must be a quadrilateral covering 20-90% of the image
        if len(approx) == 4 and orig_h * orig_w * 0.20 < area < orig_h * orig_w * 0.90:
            paper_contour = approx
            break

    if paper_contour is None:
        return img

    pts   = paper_contour.reshape(4, 2).astype(np.float32)
    rect  = np.zeros((4, 2), dtype=np.float32)
    s     = pts.sum(axis=1)
    diff  = np.diff(pts, axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]

    out_w = int(max(np.linalg.norm(rect[1] - rect[0]), np.linalg.norm(rect[2] - rect[3])))
    out_h = int(max(np.linalg.norm(rect[3] - rect[0]), np.linalg.norm(rect[2] - rect[1])))

    if out_w < 50 or out_h < 50:
        return img

    dst = np.array([[0, 0], [out_w-1, 0], [out_w-1, out_h-1], [0, out_h-1]], dtype=np.float32)
    M   = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(img, M, (out_w, out_h))


def preprocess_for_handwriting(input_path: Path) -> Path:
    """
    Smart preprocessing pipeline:

    CLEAN image (white background, >60% bright pixels):
      → Only upscale 2x for better OCR accuracy, no other changes

    DIRTY image (dark/shadowy/angled photo):
      1. Auto perspective correction
      2. Shadow removal
      3. Upscale 2x
      4. Bilateral denoise
      5. Adaptive threshold
      6. Morphological cleanup
    """
    img = cv2.imread(str(input_path))
    if img is None:
        raise ValueError(f"Could not read image: {input_path}")

    out_path = OUTPUT_DIR / f"{input_path.stem}_clean.png"

    if is_clean_image(img):
        # Already clean — only upscale, skip all aggressive processing
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        cv2.imwrite(str(out_path), gray)
        return out_path

    # Needs full preprocessing
    img  = auto_perspective_correction(img)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = remove_shadow(gray)
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    gray = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)

    binary = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        51, 11
    )
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

    cv2.imwrite(str(out_path), binary)
    return out_path


def compute_confidence(items: list[dict], total_lines: int) -> float | None:
    """
    Compute a realistic confidence score that prevents survivor bias:
    - avg_score: average score of kept items
    - kept_ratio: how many lines survived the filter vs total detected
    - real_confidence = avg_score x kept_ratio

    Example: 15 items kept from 20 detected, avg score 0.85
    → 0.85 x 0.75 = 0.64 (not 0.85)
    """
    if not items or total_lines == 0:
        return None
    all_scores  = [it["score"] for it in items if it["score"] is not None]
    avg_score   = sum(all_scores) / len(all_scores) if all_scores else 0
    kept_ratio  = len(items) / total_lines
    return round(avg_score * kept_ratio, 4)


def merge_items_into_lines(items: list[dict], y_tol: int = 14, gap_for_tab: int = 40) -> str:
    """Reconstruct reading order from bounding boxes into plain text lines."""
    tokens = []
    for it in items:
        box  = it.get("box")
        text = (it.get("text") or "").strip()
        if not box or len(box) != 4 or not text:
            continue
        x1, y1, x2, y2 = box
        tokens.append(((y1 + y2) / 2.0, x1, x2, text))

    tokens.sort(key=lambda t: (t[0], t[1]))
    lines: list[list] = []
    current: list     = []
    current_y         = None

    for yc, x1, x2, text in tokens:
        if current_y is None or abs(yc - current_y) <= y_tol:
            current.append((x1, x2, text))
            current_y = yc if current_y is None else (current_y * 0.7 + yc * 0.3)
        else:
            lines.append(sorted(current, key=lambda t: t[0]))
            current   = [(x1, x2, text)]
            current_y = yc

    if current:
        lines.append(sorted(current, key=lambda t: t[0]))

    out_lines = []
    for line in lines:
        parts   = []
        prev_x2 = None
        for x1, x2, text in line:
            if prev_x2 is None:
                parts.append(text)
            else:
                parts.append(("\t" if x1 - prev_x2 >= gap_for_tab else " ") + text)
            prev_x2 = x2
        out_lines.append("".join(parts))

    return "\n".join(out_lines).strip()


def _merge_box(boxes: list[list[int]]) -> list[int]:
    return [
        min(b[0] for b in boxes), min(b[1] for b in boxes),
        max(b[2] for b in boxes), max(b[3] for b in boxes),
    ]


def _make_block(entries: list[dict], block_idx: int) -> dict:
    entries = sorted(entries, key=lambda e: (e["box"][1], e["box"][0]))
    box     = _merge_box([e["box"] for e in entries])
    text    = "\n".join(e["text"] for e in entries if e["text"].strip()).strip()
    scores  = [e["score"] for e in entries if e["score"] is not None]
    return {
        "id":           f"block-{block_idx}",
        "box":          box,
        "text":         text,
        "score":        sum(scores) / len(scores) if scores else None,
        "item_indices": [e["idx"] for e in entries],
    }


def merge_overlapping_blocks(blocks: list[dict], x_pad: int = 4, y_pad: int = 3) -> list[dict]:
    if not blocks:
        return []

    def overlaps(a, b):
        ax1, ay1, ax2, ay2 = a
        bx1, by1, bx2, by2 = b
        return not (ax2 + x_pad < bx1 or bx2 + x_pad < ax1 or ay2 + y_pad < by1 or by2 + y_pad < ay1)

    changed = True
    current = blocks[:]

    while changed:
        changed = False
        merged  = []
        used    = [False] * len(current)

        for i in range(len(current)):
            if used[i]:
                continue
            group         = [current[i]]
            used[i]       = True
            group_changed = True

            while group_changed:
                group_changed = False
                group_box     = _merge_box([g["box"] for g in group])
                for j in range(len(current)):
                    if used[j]:
                        continue
                    if overlaps(group_box, current[j]["box"]):
                        group.append(current[j])
                        used[j]       = True
                        group_changed = True

            if len(group) == 1:
                merged.append(group[0])
            else:
                merged.append(_make_block(
                    [
                        {"idx": item_idx, "text": text, "score": score, "box": box}
                        for block in group
                        for item_idx, text, score, box in zip(
                            block["item_indices"],
                            block["text"].split("\n"),
                            [block["score"]] * len(block["item_indices"]),
                            [block["box"]]   * len(block["item_indices"]),
                        )
                    ],
                    len(merged) + 1,
                ))
                changed = True

        current = merged

    for i, block in enumerate(current, start=1):
        block["id"] = f"block-{i}"

    return current


def group_items_into_blocks(
    items: list[dict],
    max_line_gap: int = 16,
    same_edge_tol: int = 55,
    overlap_ratio_min: float = 0.40,
) -> list[dict]:
    entries = []
    for idx, it in enumerate(items):
        box  = it.get("box")
        text = (it.get("text") or "").strip()
        if not box or len(box) != 4 or not text:
            continue
        x1, y1, x2, y2 = [int(v) for v in box]
        if x2 <= x1 or y2 <= y1:
            continue
        entries.append({"idx": idx, "text": text, "score": it.get("score"), "box": [x1, y1, x2, y2]})

    if not entries:
        return []

    entries.sort(key=lambda e: (e["box"][1], e["box"][0]))
    blocks_raw = []
    current    = [entries[0]]

    for entry in entries[1:]:
        prev      = current[-1]
        block_box = _merge_box([e["box"] for e in current])
        x1, y1, x2, y2     = entry["box"]
        bx1, by1, bx2, by2 = block_box
        prev_x1, _, prev_x2, prev_y2 = prev["box"]

        line_gap      = y1 - prev_y2
        x_overlap     = max(0, min(x2, bx2) - max(x1, bx1))
        overlap_ratio = x_overlap / max(1, min(x2 - x1, bx2 - bx1))

        if (0 <= line_gap <= max_line_gap
                and overlap_ratio >= overlap_ratio_min
                and (abs(x1 - prev_x1) <= same_edge_tol or abs(x2 - prev_x2) <= same_edge_tol)):
            current.append(entry)
        else:
            blocks_raw.append(current)
            current = [entry]

    if current:
        blocks_raw.append(current)

    blocks = [_make_block(b, i + 1) for i, b in enumerate(blocks_raw)]
    return merge_overlapping_blocks(blocks)


def build_overlay_image(image_path: Path, blocks: list[dict], out_path: Path) -> None:
    """Draw bounding boxes on a faded version of the processed image."""
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")

    white = np.full_like(img, 255)
    img   = cv2.addWeighted(img, 0.12, white, 0.88, 0)

    for block in blocks:
        box = block.get("box")
        if not box or len(box) != 4:
            continue
        x1, y1, x2, y2 = [int(v) for v in box]
        if x2 > x1 and y2 > y1:
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 160, 0), 2)

    cv2.imwrite(str(out_path), img)


# =============================================================================
# Chandra / Datalab hosted API helper
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
        raise RuntimeError(f"Datalab API submission failed ({response.status_code}): {response.text}")

    data = response.json()
    if not data.get("success"):
        raise RuntimeError(f"Datalab API rejected the request: {data}")

    check_url = data.get("request_check_url")
    if not check_url:
        raise RuntimeError("Datalab API did not return a check URL.")

    deadline = time.time() + CHANDRA_TIMEOUT_SECONDS
    while time.time() < deadline:
        poll   = requests.get(check_url, headers=headers, timeout=30)
        result = poll.json()
        status = result.get("status", "")

        if status == "complete":
            return {
                "markdown":      result.get("markdown", ""),
                "metadata":      result.get("metadata", {}),
                "page_count":    result.get("page_count"),
                "quality_score": result.get("parse_quality_score"),
            }

        if status == "failed":
            raise RuntimeError(f"Datalab processing failed: {result.get('error', 'unknown error')}")

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
    """Health check — reports both engines and API key status."""
    return {
        "ok": True,
        "engines": {
            "paddle": "ready",
            "chandra": {
                "provider":    "datalab.to hosted API",
                "mode":        CHANDRA_MODE,
                "api_key_set": bool(DATALAB_API_KEY),
            },
        },
    }


@app.post("/ocr_api/ocr")
@app.post("/ocr_api/ocr_v5")
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

    # Save uploaded file
    ext      = Path(file.filename or "document").suffix.lower() or ".jpg"
    file_id  = uuid.uuid4().hex
    raw_path = UPLOADS_DIR / f"{file_id}{ext}"
    raw_path.write_bytes(await file.read())

    # Copy original to output dir so frontend can display it
    original_name = f"original_{file_id}{ext}"
    original_path = OUTPUT_DIR / original_name
    shutil.copy2(raw_path, original_path)
    original_url  = f"/ocr_static/{original_name}"

    # ------------------------------------------------------------------
    # PaddleOCR path
    # ------------------------------------------------------------------
    if engine == "paddle":
        if raw_path.suffix.lower() == ".pdf":
            return {
                "error": (
                    "PDF uploads are not supported by PaddleOCR. "
                    "Upload an image, or use engine=chandra."
                )
            }

        # Read original to check if clean before preprocessing
        orig_img  = cv2.imread(str(raw_path))
        was_clean = is_clean_image(orig_img) if orig_img is not None else False

        # Smart preprocessing — skips aggressive steps for clean images
        clean_path = preprocess_for_handwriting(raw_path)

        page   = ocr.predict(
            str(clean_path),
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
        )[0]

        lines  = page.get("rec_texts", [])
        scores = page.get("rec_scores", [])
        boxes  = page.get("rec_boxes", None)
        total_lines = len(lines)

        # Filter out low-confidence results (score < 0.6)
        items = []
        for i, text in enumerate(lines):
            score = float(scores[i]) if i < len(scores) else None
            if score is not None and score < 0.6:
                continue
            box = None
            if boxes is not None and i < len(boxes):
                box = [int(x) for x in boxes[i].tolist()]
            items.append({"text": text, "score": score, "box": box})

        blocks = group_items_into_blocks(items)

        merged_text = "\n\n".join(b["text"] for b in blocks).strip()
        if not merged_text:
            merged_text = merge_items_into_lines(items)

        overlay_name = f"overlay_{file_id}.jpg"
        overlay_path = OUTPUT_DIR / overlay_name
        build_overlay_image(clean_path, blocks, overlay_path)

        clean_img  = cv2.imread(str(clean_path))
        image_size = (
            [int(clean_img.shape[1]), int(clean_img.shape[0])]
            if clean_img is not None else [0, 0]
        )

        # Realistic confidence: avg score x kept ratio (prevents survivor bias)
        confidence = compute_confidence(items, total_lines)

        return {
            "filename":          file.filename,
            "engine":            "paddle",
            "text":              "\n".join(it["text"] for it in items),
            "merged_text":       merged_text,
            "markdown":          "",
            "items":             items,
            "blocks":            blocks,
            "original_url":      original_url,        # original uploaded image
            "image_url":         f"/ocr_static/{Path(clean_path).name}",  # processed image
            "image_size":        image_size,
            "overlay_url":       f"/ocr_static/{overlay_name}",
            "html_url":          "",
            "markdown_url":      "",
            "metadata":          {},
            "confidence":        confidence,
            "debug": {
                "mode":                "paddle_pp-ocrv5",
                "was_clean_image":     was_clean,
                "preprocessing":       "upscale_only" if was_clean else "full_pipeline",
                "raw_path":            str(raw_path),
                "used_path":           str(clean_path),
                "items_total":         total_lines,
                "items_after_filter":  len(items),
                "kept_ratio":          round(len(items) / total_lines, 4) if total_lines else 0,
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
        page_count = result.get("page_count")

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
                "mode":        "chandra_datalab_hosted_api",
                "raw_path":    str(raw_path),
                "chandra_mode": CHANDRA_MODE,
                "page_count":  page_count,
            },
        }
