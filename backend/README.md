# OCR backend (PaddleOCR + preprocessing)

Minimal backend API for simple OCR configuration.

## Quick start (Windows)

### 1) Install Python 3.12 (64-bit)

### 2) Create and activate a virtual environment
From the repo root:

    py -3.12 -m venv .venv
    .venv\Scripts\activate

Upgrade pip:

    python -m pip install -U pip setuptools wheel

### 3) Install PaddlePaddle (CPU) if not installed in this venv yet

    python -m pip install paddlepaddle==3.2.0 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/

### 4) Install backend requirements
    python -m pip install -r backend\requirements.txt

### 5) Run the server
    uvicorn backend.app:app --reload --port 8000

### 6) Test it
- http://localhost:8000/api/health

OCR test:
    curl -F "file=@test.jpg" http://localhost:8000/api/ocr