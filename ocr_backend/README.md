# OCR Backend (PaddleOCR / PP-OCRv5)

This is a local Python service that runs OCR on note images and returns:
- `text` (raw OCR)
- `merged_text` (more readable layout)
- `items` (per-line text, score, bounding box)
- `overlay_url` (image with boxes/text drawn, served by the backend)

## Requirements
- Python 3.12 (64-bit)
- Internet on first run (models download once, then cached)

## Setup (PowerShell)

### 1) Go to the repo root
```powershell
cd C:\path\to\your\repo
```
### 2) Create a venv
```powershell
py -3.12 -m venv .venv
```
### 3) Activate venv
```powershell
.\.venv\Scripts\Activate.ps1
```
### 4) Install dependencies
```powershell
python -m pip install -U pip setuptools wheel
python -m pip install paddlepaddle==3.2.0 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/
python -m pip install -r backend\requirements.txt
```
### 5) Start the server
```powershell
python -m uvicorn backend.app:app --port 8000
```
### 6) Check health
http://localhost:8000/api/health

## Test OCR

```powershell
curl.exe -F "file=@test.jpg" http://localhost:8000/api/ocr_v5
```