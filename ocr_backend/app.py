from fastapi.staticfiles import StaticFiles

import json
import os
import re
import shutil
import subprocess
import uuid
from pathlib import Path

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="OCR Backend (Chandra)")

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

CHANDRA_METHOD = os.getenv("CHANDRA_METHOD", "hf").strip().lower() or "hf"
CHANDRA_INCLUDE_IMAGES = os.getenv("CHANDRA_INCLUDE_IMAGES", "0").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}
CHANDRA_MAX_OUTPUT_TOKENS = os.getenv("CHANDRA_MAX_OUTPUT_TOKENS", "")


def markdown_to_text(markdown: str) -> str:
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
    request_output_dir = OUTPUT_DIR / f"chandra_{uuid.uuid4().hex}"
    request_output_dir.mkdir(parents=True, exist_ok=True)

    cmd = [
        "chandra",
        str(input_path),
        str(request_output_dir),
        "--method",
        CHANDRA_METHOD,
    ]

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
            "Chandra CLI was not found. Install it with `python -m pip install \"chandra-ocr[hf]\"`."
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

    metadata = {}
    if metadata_files:
        try:
            metadata = json.loads(metadata_files[0].read_text(encoding="utf-8", errors="replace"))
        except Exception:
            metadata = {}

    html_path = html_files[0] if html_files else None
    return markdown, metadata, markdown_path, html_path


@app.get("/ocr_api/health")
def health():
    return {
        "ok": True,
        "engine": "chandra",
        "method": CHANDRA_METHOD,
    }


@app.post("/ocr_api/ocr")
@app.post("/ocr_api/ocr_v5")
async def run_ocr(file: UploadFile = File(...)):
    ext = Path(file.filename or "document").suffix.lower() or ".bin"
    file_id = uuid.uuid4().hex
    raw_path = UPLOADS_DIR / f"{file_id}{ext}"
    raw_path.write_bytes(await file.read())

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
