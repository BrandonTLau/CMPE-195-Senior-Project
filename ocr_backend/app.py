from fastapi.staticfiles import StaticFiles
import numpy as np

import uuid
from pathlib import Path

import cv2
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from paddleocr import PaddleOCR

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
ocr = PaddleOCR(paddlex_config=str(OCR_CFG_PATH))


def preprocess_for_handwriting(input_path: Path) -> Path:
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
    img = cv2.imread(str(input_path))
    if img is None:
        raise ValueError(f"Could not read image: {input_path}")

    h, w = img.shape[:2]
    m = max(h, w)
    if m > max_side:
        scale = max_side / m
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    out_path = OUTPUT_DIR / f"{input_path.stem}_norm.jpg"
    cv2.imwrite(str(out_path), img)
    return out_path

def build_overlay_image(image_path: Path, items: list[dict], out_path: Path) -> None:
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")

    white = np.full_like(img, 255)
    img = cv2.addWeighted(img, 0.15, white, 0.85, 0)

    font = cv2.FONT_HERSHEY_SIMPLEX

    for it in items:
        box = it.get("box")
        text = (it.get("text") or "").strip()
        if not box or len(box) != 4:
            continue

        x1, y1, x2, y2 = box
        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
        if x2 <= x1 or y2 <= y1:
            continue

        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 160, 0), 2)

        if not text:
            continue

        box_w = x2 - x1
        box_h = y2 - y1

        max_text_w = max(1, box_w - 8)
        max_text_h = max(1, box_h - 8)

        font_scale = 1.0
        thickness = 2

        for _ in range(30):
            (tw, th), base = cv2.getTextSize(text, font, font_scale, thickness)
            if tw <= max_text_w and (th + base) <= max_text_h:
                break
            font_scale *= 0.9
            if font_scale < 0.35:
                break

        thickness = max(1, int(round(font_scale * 2)))

        (tw, th), base = cv2.getTextSize(text, font, font_scale, thickness)

        cx = x1 + box_w // 2
        cy = y1 + box_h // 2

        tx = int(cx - tw / 2)
        ty = int(cy + th / 2)

        bg_x1 = max(x1 + 2, tx - 4)
        bg_y1 = max(y1 + 2, ty - th - base - 4)
        bg_x2 = min(x2 - 2, tx + tw + 4)
        bg_y2 = min(y2 - 2, ty + base + 4)

        overlay = img.copy()
        cv2.rectangle(overlay, (bg_x1, bg_y1), (bg_x2, bg_y2), (0, 0, 0), -1)
        img = cv2.addWeighted(overlay, 0.55, img, 0.45, 0)

        tx = max(x1 + 3, min(tx, x2 - tw - 3))
        ty = max(y1 + th + 3, min(ty, y2 - 3))

        cv2.putText(img, text, (tx, ty), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)

    cv2.imwrite(str(out_path), img)


def merge_items_into_lines(items: list[dict], y_tol: int = 14, gap_for_tab: int = 40) -> str:
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

    lines = []
    current = []
    current_y = None

    for yc, x1, x2, text in tokens:
        if current_y is None or abs(yc - current_y) <= y_tol:
            current.append((x1, x2, text))
            current_y = yc if current_y is None else (current_y * 0.7 + yc * 0.3)
        else:
            current.sort(key=lambda t: t[0])
            lines.append(current)
            current = [(x1, x2, text)]
            current_y = yc

    if current:
        current.sort(key=lambda t: t[0])
        lines.append(current)

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

    page = ocr.predict(str(clean_path))[0]
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

    # added for use preprocessing input
    processed_path = preprocess_for_handwriting(raw_path)

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

    merged_text = merge_items_into_lines(items)

    overlay_name = f"overlay_{file_id}.jpg"
    overlay_path = OUTPUT_DIR / overlay_name
    build_overlay_image(Path(norm_path), items, overlay_path)

    overlay_url = f"/ocr_static/{overlay_name}"

    return {
        "filename": file.filename,
        "text": "\n".join(lines),
        "merged_text": merged_text,
        "items": items,
        "overlay_url": overlay_url,
        "debug": {
            "mode": "pp-ocrv5_demo_like",
            "raw_path": str(raw_path),
            "used_path": str(norm_path),
        },
    }
