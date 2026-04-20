from fastapi.staticfiles import StaticFiles

import uuid
from pathlib import Path

import os
from fastapi import FastAPI, UploadFile, File, HTTPException

import cv2
from fastapi.middleware.cors import CORSMiddleware
from paddleocr import PaddleOCR

from .ocr_utils import (
    preprocess_for_handwriting,
    normalize_image_max_side,
    merge_items_into_lines,
    group_items_into_blocks,
    build_overlay_image,
)

app = FastAPI(title="OCR Backend (PaddleOCR)")

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

OCR_CFG_PATH = BASE_DIR / "PaddleOCR.yaml"
_ocr_instance = None

def get_ocr():
    global _ocr_instance
    if os.getenv("OCR_SKIP_MODEL_LOAD") == "1":
        raise RuntimeError("OCR model loading disabled for tests.")
    if _ocr_instance is None:
        _ocr_instance = PaddleOCR(paddlex_config=str(OCR_CFG_PATH))
    return _ocr_instance

@app.get("/ocr_api/health")
def health():
    return {"ok": True}

@app.post("/ocr_api/ocr")
async def run_ocr(file: UploadFile = File(...)):
    filename_lower = (file.filename or "").lower()
    if filename_lower.endswith(".pdf"):
        return {"error": "PDF uploads are not supported yet. Please upload an image."}

    ext = Path(file.filename).suffix.lower() or ".jpg"
    file_id = uuid.uuid4().hex
    raw_path = UPLOADS_DIR / f"{file_id}{ext}"
    raw_path.write_bytes(await file.read())

    clean_path = preprocess_for_handwriting(raw_path)

    try:
        ocr_client = get_ocr()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    page = ocr_client.predict(str(clean_path))[0]
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

    return {
        "filename": file.filename,
        "text": "\n".join(lines),
        "items": items,
        "debug": {
            "mode": "ocr_preprocessed",
            "raw_path": str(raw_path),
            "used_path": str(clean_path),
        },
    }

@app.post("/ocr_api/ocr_v5")
async def run_ocr_v5(file: UploadFile = File(...)):
    filename_lower = (file.filename or "").lower()
    if filename_lower.endswith(".pdf"):
        return {"error": "PDF uploads are not supported yet. Please upload an image."}

    ext = Path(file.filename).suffix.lower() or ".jpg"
    file_id = uuid.uuid4().hex
    raw_path = UPLOADS_DIR / f"v5_{file_id}{ext}"
    raw_path.write_bytes(await file.read())

    norm_path = normalize_image_max_side(raw_path, max_side=1600)

    try:
        ocr_client = get_ocr()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    page = ocr_client.predict(
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
    build_overlay_image(Path(norm_path), blocks, overlay_path)

    norm_name = Path(norm_path).name
    image_url = f"/ocr_static/{norm_name}"
    overlay_url = f"/ocr_static/{overlay_name}"

    norm_img = cv2.imread(str(norm_path))
    if norm_img is not None:
        h, w = norm_img.shape[:2]
        image_size = [int(w), int(h)]
    else:
        image_size = [0, 0]

    return {
        "filename": file.filename,
        "text": "\n".join(lines),
        "merged_text": merged_text,
        "items": items,
        "blocks": blocks,
        "image_url": image_url,
        "image_size": image_size,
        "overlay_url": overlay_url,
        "debug": {
            "mode": "pp-ocrv5_block_linked",
            "raw_path": str(raw_path),
            "used_path": str(norm_path),
        },
    }
