import uuid
from pathlib import Path

import cv2
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from paddleocr import PaddleOCR

app = FastAPI(title="OCR Backend (PaddleOCR + preprocessing)")

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

# Load OCR once at startup
# Test out different configurations here. Balance accuracy and speed.
ocr = PaddleOCR(
    lang="en",
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
)

def preprocess_for_handwriting(input_path: Path) -> Path:
    """
    grayscale -> upscale -> blur -> adaptive threshold
    """
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

@app.get("/api/health")
def health():
    return {"ok": True}

@app.post("/api/ocr")
async def run_ocr(file: UploadFile = File(...)):
    filename_lower = (file.filename or '').lower()
    if filename_lower.endswith('.pdf'):
        return {
            'error': 'PDF uploads are not supported yet. Please upload an image.',
        }
    # Save upload
    ext = Path(file.filename).suffix.lower() or ".jpg"
    file_id = uuid.uuid4().hex
    raw_path = UPLOADS_DIR / f"{file_id}{ext}"
    raw_path.write_bytes(await file.read())

    # Preprocess
    clean_path = preprocess_for_handwriting(raw_path)

    # OCR
    out = ocr.predict(str(clean_path))
    page = out[0]

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
            "raw_path": str(raw_path),
            "clean_path": str(clean_path),
        },
    }