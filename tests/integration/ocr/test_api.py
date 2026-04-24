from pathlib import Path
from unittest.mock import patch

import cv2
import numpy as np
from fastapi.testclient import TestClient

from ocr_backend.app import app


# =============================================================================
# Shared helpers
# =============================================================================

class _FakeBox:
    def __init__(self, arr):
        self._arr = arr

    def tolist(self):
        return self._arr


class FakeOCREngine:
    def predict(self, *_args, **_kwargs):
        return [{
            'rec_texts':  ['Photosynthesis', 'happens in chloroplasts'],
            'rec_scores': [0.99, 0.97],
            'rec_boxes':  [
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


FAKE_CHANDRA_RESULT = {
    "markdown":      "# Biology Notes\nPhotosynthesis converts sunlight to energy.",
    "metadata":      {},
    "page_count":    1,
    "quality_score": 0.9,
}


# =============================================================================
# Existing tests (unchanged)
# =============================================================================

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


# =============================================================================
# New Chandra tests
# =============================================================================

@patch('ocr_backend.app.run_chandra_api')
def test_chandra_engine_returns_text(mock_chandra):
    """Chandra engine should return plain text extracted from markdown."""
    mock_chandra.return_value = FAKE_CHANDRA_RESULT
    client = TestClient(app)

    res = client.post(
        '/ocr_api/ocr_v5?engine=chandra',
        files={'file': ('notes.png', _image_bytes(), 'image/png')},
    )

    assert res.status_code == 200
    data = res.json()
    assert data['engine'] == 'chandra'
    assert isinstance(data['text'], str)
    assert len(data['text']) > 0


@patch('ocr_backend.app.run_chandra_api')
def test_chandra_engine_returns_markdown(mock_chandra):
    """Chandra engine should return the raw markdown field."""
    mock_chandra.return_value = FAKE_CHANDRA_RESULT
    client = TestClient(app)

    res = client.post(
        '/ocr_api/ocr_v5?engine=chandra',
        files={'file': ('notes.png', _image_bytes(), 'image/png')},
    )

    data = res.json()
    assert 'markdown' in data
    assert isinstance(data['markdown'], str)


@patch('ocr_backend.app.run_chandra_api')
def test_chandra_engine_returns_confidence(mock_chandra):
    """Chandra engine should return a confidence score between 0 and 1."""
    mock_chandra.return_value = FAKE_CHANDRA_RESULT
    client = TestClient(app)

    res = client.post(
        '/ocr_api/ocr_v5?engine=chandra',
        files={'file': ('notes.png', _image_bytes(), 'image/png')},
    )

    data = res.json()
    assert 'confidence' in data
    assert data['confidence'] is not None
    assert 0 <= data['confidence'] <= 1


@patch('ocr_backend.app.run_chandra_api')
def test_chandra_engine_returns_original_url(mock_chandra):
    """Chandra engine should return original_url for the frontend to display."""
    mock_chandra.return_value = FAKE_CHANDRA_RESULT
    client = TestClient(app)

    res = client.post(
        '/ocr_api/ocr_v5?engine=chandra',
        files={'file': ('notes.png', _image_bytes(), 'image/png')},
    )

    data = res.json()
    assert 'original_url' in data
    assert data['original_url'].startswith('/ocr_static/')


@patch('ocr_backend.app.run_chandra_api')
def test_chandra_accepts_pdf(mock_chandra):
    """Chandra engine should accept PDF uploads (unlike Paddle)."""
    mock_chandra.return_value = FAKE_CHANDRA_RESULT
    client = TestClient(app)

    res = client.post(
        '/ocr_api/ocr_v5?engine=chandra',
        files={'file': ('notes.pdf', b'%PDF-1.7 fake content', 'application/pdf')},
    )

    assert res.status_code == 200
    data = res.json()
    assert 'error' not in data
    assert data['engine'] == 'chandra'


@patch('ocr_backend.app.run_chandra_api')
def test_chandra_api_error_returns_error_field(mock_chandra):
    """When Chandra API fails, endpoint should return an error field."""
    mock_chandra.side_effect = RuntimeError("CHANDRA_API_KEY is not set.")
    client = TestClient(app)

    res = client.post(
        '/ocr_api/ocr_v5?engine=chandra',
        files={'file': ('notes.png', _image_bytes(), 'image/png')},
    )

    assert res.status_code == 200
    data = res.json()
    assert 'error' in data


def test_unknown_engine_returns_error():
    """Unknown engine value should return a clear error message."""
    client = TestClient(app)

    res = client.post(
        '/ocr_api/ocr_v5?engine=unknown',
        files={'file': ('notes.png', _image_bytes(), 'image/png')},
    )

    assert res.status_code == 200
    data = res.json()
    assert 'error' in data


@patch('ocr_backend.app.run_chandra_api')
def test_chandra_ocr_endpoint_also_works(mock_chandra):
    """/ocr_api/ocr with engine=chandra should also work."""
    mock_chandra.return_value = FAKE_CHANDRA_RESULT
    client = TestClient(app)

    res = client.post(
        '/ocr_api/ocr?engine=chandra',
        files={'file': ('notes.png', _image_bytes(), 'image/png')},
    )

    assert res.status_code == 200
    assert res.json()['engine'] == 'chandra'
