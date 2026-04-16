# =============================================================================
# OCR Backend — Unified Engine (PaddleOCR + Chandra)
#
# Usage:
#   POST /ocr_api/ocr      ?engine=paddle   (default)
#   POST /ocr_api/ocr      ?engine=chandra
#   POST /ocr_api/ocr_v5   ?engine=paddle   (default)
#   POST /ocr_api/ocr_v5   ?engine=chandra
#
# Environment variables (all optional):
#   CHANDRA_METHOD             hf (default) | other Chandra methods
#   CHANDRA_INCLUDE_IMAGES     0 (default) | 1
#   CHANDRA_MAX_OUTPUT_TOKENS  (unset by default)
#   CHANDRA_TIMEOUT_SECONDS    600 (default)
# =============================================================================

import json
import os
import re
import subprocess
import uuid
from pathlib import Path

import cv2
import numpy as np
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
# Chandra configuration (from environment variables)
# -----------------------------------------------------------------------------

CHANDRA_METHOD = os.getenv("CHANDRA_METHOD", "hf").strip().lower() or "hf"
CHANDRA_INCLUDE_IMAGES = os.getenv("CHANDRA_INCLUDE_IMAGES", "0").strip().lower() in {
    "1", "true", "yes", "on",
}
CHANDRA_MAX_OUTPUT_TOKENS = os.getenv("CHANDRA_MAX_OUTPUT_TOKENS", "")


# =============================================================================
# PaddleOCR helpers
# =============================================================================

def preprocess_for_handwriting(input_path: Path) -> Path:
    """Grayscale + upscale + adaptive threshold — improves handwriting OCR."""
    img = cv2.imread(str(input_path))
    if img is None:
        raise ValueError(f"Could not read image: {input_path}")

    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    g = cv2.resize(g, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    g = cv2.GaussianBlur(g, (3, 3), 0)
    th = cv2.adaptiveThreshold(
        g, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 7
    )

    out_path = OUTPUT_DIR / f"{input_path.stem}_clean.png"
    cv2.imwrite(str(out_path), th)
    return out_path


def normalize_image_max_side(input_path: Path, max_side: int = 1600) -> Path:
    """Resize image so the longest side does not exceed max_side pixels."""
    img = cv2.imread(str(input_path))
    if img is None:
        raise ValueError(f"Could not read image: {input_path}")

    h, w = img.shape[:2]
    if max(h, w) > max_side:
        scale = max_side / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    out_path = OUTPUT_DIR / f"{input_path.stem}_norm.jpg"
    cv2.imwrite(str(out_path), img)
    return out_path


def merge_items_into_lines(items: list[dict], y_tol: int = 14, gap_for_tab: int = 40) -> str:
    """Reconstruct reading order from bounding boxes into plain text lines."""
    tokens = []
    for it in items:
        box = it.get("box")
        text = (it.get("text") or "").strip()
        if not box or len(box) != 4 or not text:
            continue
        x1, y1, x2, y2 = box
        yc = (y1 + y2) / 2.0
        tokens.append((yc, x1, x2, text))

    tokens.sort(key=lambda t: (t[0], t[1]))

    lines: list[list] = []
    current: list = []
    current_y = None

    for yc, x1, x2, text in tokens:
        if current_y is None or abs(yc - current_y) <= y_tol:
            current.append((x1, x2, text))
            current_y = yc if current_y is None else (current_y * 0.7 + yc * 0.3)
        else:
            lines.append(sorted(current, key=lambda t: t[0]))
            current = [(x1, x2, text)]
            current_y = yc

    if current:
        lines.append(sorted(current, key=lambda t: t[0]))

    out_lines = []
    for line in lines:
        parts = []
        prev_x2 = None
        for x1, x2, text in line:
            if prev_x2 is None:
                parts.append(text)
            else:
                gap = x1 - prev_x2
                parts.append(("\t" if gap >= gap_for_tab else " ") + text)
            prev_x2 = x2
        out_lines.append("".join(parts))

    return "\n".join(out_lines).strip()


def _merge_box(boxes: list[list[int]]) -> list[int]:
    return [
        min(b[0] for b in boxes),
        min(b[1] for b in boxes),
        max(b[2] for b in boxes),
        max(b[3] for b in boxes),
    ]


def _make_block(entries: list[dict], block_idx: int) -> dict:
    entries = sorted(entries, key=lambda e: (e["box"][1], e["box"][0]))
    box = _merge_box([e["box"] for e in entries])
    text = "\n".join(e["text"] for e in entries if e["text"].strip()).strip()
    scores = [e["score"] for e in entries if e["score"] is not None]
    avg_score = sum(scores) / len(scores) if scores else None
    return {
        "id": f"block-{block_idx}",
        "box": box,
        "text": text,
        "score": avg_score,
        "item_indices": [e["idx"] for e in entries],
    }


def merge_overlapping_blocks(blocks: list[dict], x_pad: int = 4, y_pad: int = 3) -> list[dict]:
    if not blocks:
        return []

    def overlaps(a: list[int], b: list[int]) -> bool:
        ax1, ay1, ax2, ay2 = a
        bx1, by1, bx2, by2 = b
        return not (ax2 + x_pad < bx1 or bx2 + x_pad < ax1 or ay2 + y_pad < by1 or by2 + y_pad < ay1)

    changed = True
    current = blocks[:]

    while changed:
        changed = False
        merged = []
        used = [False] * len(current)

        for i in range(len(current)):
            if used[i]:
                continue
            group = [current[i]]
            used[i] = True
            group_changed = True

            while group_changed:
                group_changed = False
                group_box = _merge_box([g["box"] for g in group])
                for j in range(len(current)):
                    if used[j]:
                        continue
                    if overlaps(group_box, current[j]["box"]):
                        group.append(current[j])
                        used[j] = True
                        group_changed = True

            if len(group) == 1:
                merged.append(group[0])
            else:
                merged.append(
                    _make_block(
                        [
                            {"idx": item_idx, "text": text, "score": score, "box": box}
                            for block in group
                            for item_idx, text, score, box in zip(
                                block["item_indices"],
                                block["text"].split("\n"),
                                [block["score"]] * len(block["item_indices"]),
                                [block["box"]] * len(block["item_indices"]),
                            )
                        ],
                        len(merged) + 1,
                    )
                )
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
        box = it.get("box")
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
    current = [entries[0]]

    for entry in entries[1:]:
        prev = current[-1]
        block_box = _merge_box([e["box"] for e in current])
        x1, y1, x2, y2 = entry["box"]
        bx1, by1, bx2, by2 = block_box
        prev_x1, _, prev_x2, prev_y2 = prev["box"]

        line_gap = y1 - prev_y2
        x_overlap = max(0, min(x2, bx2) - max(x1, bx1))
        min_width = max(1, min(x2 - x1, bx2 - bx1))
        overlap_ratio = x_overlap / min_width

        similar_left_edge = abs(x1 - prev_x1) <= same_edge_tol
        similar_right_edge = abs(x2 - prev_x2) <= same_edge_tol
        vertical_close = 0 <= line_gap <= max_line_gap
        substantial_overlap = overlap_ratio >= overlap_ratio_min

        if vertical_close and substantial_overlap and (similar_left_edge or similar_right_edge):
            current.append(entry)
        else:
            blocks_raw.append(current)
            current = [entry]

    if current:
        blocks_raw.append(current)

    blocks = [_make_block(block, i + 1) for i, block in enumerate(blocks_raw)]
    blocks = merge_overlapping_blocks(blocks)
    return blocks


def build_overlay_image(image_path: Path, blocks: list[dict], out_path: Path) -> None:
    """Draw bounding boxes on a faded version of the original image."""
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")

    white = np.full_like(img, 255)
    img = cv2.addWeighted(img, 0.12, white, 0.88, 0)

    for block in blocks:
        box = block.get("box")
        if not box or len(box) != 4:
            continue
        x1, y1, x2, y2 = [int(v) for v in box]
        if x2 <= x1 or y2 <= y1:
            continue
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 160, 0), 2)

    cv2.imwrite(str(out_path), img)


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


def run_chandra(input_path: Path) -> tuple[str, dict, Path | None, Path | None]:
    """Call the Chandra CLI and return (markdown, metadata, markdown_path, html_path)."""
    request_output_dir = OUTPUT_DIR / f"chandra_{uuid.uuid4().hex}"
    request_output_dir.mkdir(parents=True, exist_ok=True)

    cmd = ["chandra", str(input_path), str(request_output_dir), "--method", CHANDRA_METHOD]

    if not CHANDRA_INCLUDE_IMAGES:
        cmd.append("--no-images")

    if CHANDRA_MAX_OUTPUT_TOKENS:
        cmd.extend(["--max-output-tokens", CHANDRA_MAX_OUTPUT_TOKENS])

    try:
        completed = subprocess.run(
            cmd,
            check=False,
            capture_output=True,
            text=True,
            timeout=int(os.getenv("CHANDRA_TIMEOUT_SECONDS", "600")),
        )
    except FileNotFoundError as exc:
        raise RuntimeError(
            'Chandra CLI was not found. Install it with: pip install "chandra-ocr[hf]"'
        ) from exc
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError("Chandra OCR timed out.") from exc

    if completed.returncode != 0:
        stderr = (completed.stderr or "").strip()
        stdout = (completed.stdout or "").strip()
        details = stderr or stdout or f"exit code {completed.returncode}"
        raise RuntimeError(f"Chandra OCR failed: {details}")

    markdown_files = sorted(request_output_dir.rglob("*.md"))
    metadata_files = sorted(request_output_dir.rglob("*_metadata.json"))
    html_files = sorted(request_output_dir.rglob("*.html"))

    if not markdown_files:
        raise RuntimeError("Chandra OCR completed but did not produce a markdown file.")

    markdown_path = markdown_files[0]
    markdown = markdown_path.read_text(encoding="utf-8", errors="replace")

    metadata: dict = {}
    if metadata_files:
        try:
            metadata = json.loads(metadata_files[0].read_text(encoding="utf-8", errors="replace"))
        except Exception:
            metadata = {}

    html_path = html_files[0] if html_files else None
    return markdown, metadata, markdown_path, html_path


# =============================================================================
# Endpoints
# =============================================================================

@app.get("/ocr_api/health")
def health():
    """Health check — reports both engines."""
    return {
        "ok": True,
        "engines": {
            "paddle": "ready",
            "chandra": {
                "method": CHANDRA_METHOD,
                "include_images": CHANDRA_INCLUDE_IMAGES,
            },
        },
    }


@app.post("/ocr_api/ocr")
@app.post("/ocr_api/ocr_v5")
async def run_ocr(
    file: UploadFile = File(...),
    engine: str = Query(default="paddle", description="OCR engine to use: 'paddle' or 'chandra'"),
):
    """
    Run OCR on an uploaded image or PDF.

    - engine=paddle  (default) — uses PaddleOCR / PP-OCRv5
    - engine=chandra           — uses Chandra OCR CLI
    """
    engine = engine.strip().lower()
    if engine not in ("paddle", "chandra"):
        return {"error": f"Unknown engine '{engine}'. Choose 'paddle' or 'chandra'."}

    # ------------------------------------------------------------------
    # Save the uploaded file
    # ------------------------------------------------------------------
    ext = Path(file.filename or "document").suffix.lower() or ".jpg"
    file_id = uuid.uuid4().hex
    raw_path = UPLOADS_DIR / f"{file_id}{ext}"
    raw_path.write_bytes(await file.read())

    # ------------------------------------------------------------------
    # PaddleOCR path
    # ------------------------------------------------------------------
    if engine == "paddle":
        if raw_path.suffix.lower() == ".pdf":
            return {"error": "PDF uploads are not supported by PaddleOCR. Please upload an image, or switch to engine=chandra."}

        norm_path = normalize_image_max_side(raw_path, max_side=1600)

        page = ocr.predict(
            str(norm_path),
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
        )[0]

        lines = page.get("rec_texts", [])
        scores = page.get("rec_scores", [])
        boxes = page.get("rec_boxes", None)

        items = []
        for i, text in enumerate(lines):
            score = float(scores[i]) if i < len(scores) else None
            box = None
            if boxes is not None and i < len(boxes):
                box = [int(x) for x in boxes[i].tolist()]
            items.append({"text": text, "score": score, "box": box})

        blocks = group_items_into_blocks(items)

        merged_text = "\n\n".join(block["text"] for block in blocks).strip()
        if not merged_text:
            merged_text = merge_items_into_lines(items)

        overlay_name = f"overlay_{file_id}.jpg"
        overlay_path = OUTPUT_DIR / overlay_name
        build_overlay_image(norm_path, blocks, overlay_path)

        norm_img = cv2.imread(str(norm_path))
        image_size = [int(norm_img.shape[1]), int(norm_img.shape[0])] if norm_img is not None else [0, 0]

        norm_name = Path(norm_path).name

        return {
            "filename": file.filename,
            "engine": "paddle",
            "text": "\n".join(lines),
            "merged_text": merged_text,
            "markdown": "",
            "items": items,
            "blocks": blocks,
            "image_url": f"/ocr_static/{norm_name}",
            "image_size": image_size,
            "overlay_url": f"/ocr_static/{overlay_name}",
            "html_url": "",
            "markdown_url": "",
            "metadata": {},
            "debug": {
                "mode": "paddle_pp-ocrv5",
                "raw_path": str(raw_path),
                "used_path": str(norm_path),
            },
        }

    # ------------------------------------------------------------------
    # Chandra path
    # ------------------------------------------------------------------
    else:
        markdown, metadata, markdown_path, html_path = run_chandra(raw_path)
        plain_text = markdown_to_text(markdown)

        markdown_url = (
            f"/ocr_static/{markdown_path.relative_to(OUTPUT_DIR).as_posix()}"
            if markdown_path and markdown_path.exists()
            else ""
        )
        html_url = (
            f"/ocr_static/{html_path.relative_to(OUTPUT_DIR).as_posix()}"
            if html_path and html_path.exists()
            else ""
        )

        page_count = metadata.get("pages") if isinstance(metadata, dict) else None
        if isinstance(page_count, list):
            page_count = len(page_count)

        return {
            "filename": file.filename,
            "engine": "chandra",
            "text": plain_text,
            "merged_text": markdown,
            "markdown": markdown,
            "items": [],
            "blocks": [],
            "image_url": "",
            "image_size": [0, 0],
            "overlay_url": "",
            "html_url": html_url,
            "markdown_url": markdown_url,
            "metadata": metadata,
            "debug": {
                "mode": "chandra_markdown_cli",
                "raw_path": str(raw_path),
                "markdown_path": str(markdown_path) if markdown_path else "",
                "method": CHANDRA_METHOD,
                "page_count": page_count,
            },
        }
