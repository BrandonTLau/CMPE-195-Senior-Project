# OCR Backend (Chandra Markdown OCR)

This local Python service runs Chandra OCR and returns:
- `merged_text` as markdown
- `text` as simplified plain text
- `metadata` from Chandra when available
- empty `blocks` / `overlay_url` when linked image overlays are not produced

The frontend now defaults to a markdown-first editing flow.

## Requirements
- Python 3.12 or another supported Python 3.10+ build
- Enough RAM / GPU capacity for Chandra's Hugging Face backend
- Internet on first run so model weights can download

## Setup (PowerShell)

```powershell
cd C:\path\to\your\repo
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -U pip setuptools wheel
python -m pip install -r .\ocr_backend\requirements.txt
```

Optional environment variables:

```powershell
$env:CHANDRA_METHOD = "hf"
$env:CHANDRA_INCLUDE_IMAGES = "0"
```

Start the server:

```powershell
python -m uvicorn ocr_backend.app:app --host 127.0.0.1 --port 8000
```

Health check:
- http://localhost:8000/ocr_api/health

## Test OCR

```powershell
curl.exe -F "file=@test.jpg" http://localhost:8000/ocr_api/ocr_v5
curl.exe -F "file=@test.pdf" http://localhost:8000/ocr_api/ocr_v5
```
