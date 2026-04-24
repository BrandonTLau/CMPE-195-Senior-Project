const OCR_BASE = import.meta.env.VITE_OCR_URL || 'http://localhost:8000';

export async function runOcr(file, engine = 'paddleocr') {
  const form = new FormData();
  form.append("file", file);

  const engineParam = engine === 'chandra' ? 'chandra' : 'paddle';

  const res = await fetch(`${OCR_BASE}/ocr_api/ocr_v5?engine=${engineParam}`, {
    method: "POST",
    body: form,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {}

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  if (data && data.error) {
    throw new Error(data.error);
  }

  return data;
}