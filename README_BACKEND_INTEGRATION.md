# Frontend + Minimal OCR backend

This repo now contains:
- `frontend/` (Vite + React UI)
- `backend/` (FastAPI + PaddleOCR + preprocessing)

## Run locally (Windows)

### 1) Backend (Python)
From the repo root:

1. HIGHLY RECOMMENDED STEP: Create venv (Python 3.12 is required):
   - `py -3.12 -m venv .venv`
   - `.venv\Scripts\activate`
2. Install PaddlePaddle CPU:
   - `python -m pip install paddlepaddle==3.2.0 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/`
3. Install backend deps:
   - `python -m pip install -r backend\requirements.txt`
4. Start backend:
   - `uvicorn backend.app:app --reload --port 8000`

Check:
- http://localhost:8000/api/health

### 2) Frontend
In a second terminal:

1. `cd frontend`
2. `npm install`
3. `npm run dev`

Open the printed URL.