from pathlib import Path

import cv2
import numpy as np
from fastapi.testclient import TestClient

from ocr_backend.app import app

class _FakeBox:
    def __init__(self, arr):
        self._arr = arr

    def tolist(self):
        return self._arr

class FakeOCREngine:
    def predict(self, *_args, **_kwargs):
        return [{
            'rec_texts': ['Photosynthesis', 'happens in chloroplasts'],
            'rec_scores': [0.99, 0.97],
            'rec_boxes': [
                _FakeBox([10, 10, 200, 40]),
                _FakeBox([12, 50, 250, 82]),
            ],
        }]

def _image_bytes() -> bytes:
    img = np.full((120, 240, 3), 255, dtype=np.uint8)
    cv2.putText(img, 'OCR', (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 3)
    ok, encoded = cv2.imencode('.png', img)
    assert ok
    return encoded.tobytes()


def test_health_endpoint_returns_ok():
    client = TestClient(app)
    res = client.get('/ocr_api/health')
    assert res.status_code == 200
    assert res.json() == {'ok': True}


def test_ocr_v5_returns_expected_payload(monkeypatch):
    monkeypatch.setattr('ocr_backend.app.get_ocr', lambda: FakeOCREngine())
    client = TestClient(app)

    res = client.post(
        '/ocr_api/ocr_v5',
        files={'file': ('notes.png', _image_bytes(), 'image/png')},
    )

    assert res.status_code == 200
    data = res.json()
    assert data['filename'] == 'notes.png'
    assert 'Photosynthesis' in data['text']
    assert 'merged_text' in data
    assert len(data['items']) == 2
    assert len(data['blocks']) >= 1
    assert data['overlay_url'].startswith('/ocr_static/')

def test_pdf_upload_returns_error_message():
    client = TestClient(app)
    res = client.post(
        '/ocr_api/ocr_v5',
        files={'file': ('notes.pdf', b'%PDF-1.7', 'application/pdf')},
    )

    assert res.status_code == 200
    assert 'error' in res.json()
