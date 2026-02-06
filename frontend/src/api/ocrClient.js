export async function runOcr(file) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/ocr", {
    method: "POST",
    body: form,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
  }

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
