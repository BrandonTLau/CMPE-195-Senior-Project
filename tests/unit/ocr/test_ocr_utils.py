from pathlib import Path

import cv2
import numpy as np

from ocr_backend import ocr_utils

def _write_sample_image(path: Path, width: int = 1800, height: int = 900):
    img = np.full((height, width, 3), 255, dtype=np.uint8)
    cv2.putText(img, 'Hello OCR', (40, 120), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 4)
    cv2.imwrite(str(path), img)

def test_normalize_image_max_side_resizes_large_image(tmp_path, monkeypatch):
    monkeypatch.setattr(ocr_utils, 'OUTPUT_DIR', tmp_path)
    src = tmp_path / 'large.png'
    _write_sample_image(src, width=2200, height=1100)

    out = ocr_utils.normalize_image_max_side(src, max_side=1000)
    assert out.exists()
    img = cv2.imread(str(out))
    assert max(img.shape[:2]) == 1000

def test_preprocess_for_handwriting_creates_output(tmp_path, monkeypatch):
    monkeypatch.setattr(ocr_utils, 'OUTPUT_DIR', tmp_path)
    src = tmp_path / 'notes.png'
    _write_sample_image(src, width=400, height=200)

    out = ocr_utils.preprocess_for_handwriting(src)
    assert out.exists()
    processed = cv2.imread(str(out), cv2.IMREAD_GRAYSCALE)
    assert processed is not None


def test_merge_items_into_lines_groups_by_row_and_gap():
    items = [
        {'text': 'Cell', 'box': [10, 10, 50, 25]},
        {'text': 'Biology', 'box': [60, 12, 130, 26]},
        {'text': 'ATP', 'box': [10, 60, 40, 75]},
        {'text': 'Cycle', 'box': [90, 60, 140, 75]},
    ]

    merged = ocr_utils.merge_items_into_lines(items, y_tol=10, gap_for_tab=30)
    assert merged.splitlines()[0] == 'Cell Biology'
    assert '\tCycle' in merged

def test_group_items_into_blocks_creates_two_text_blocks():
    items = [
        {'text': 'Light reactions', 'score': 0.98, 'box': [10, 10, 180, 35]},
        {'text': 'occur in thylakoids', 'score': 0.97, 'box': [12, 40, 190, 65]},
        {'text': 'Calvin cycle', 'score': 0.95, 'box': [12, 130, 180, 155]},
        {'text': 'happens in stroma', 'score': 0.96, 'box': [14, 160, 190, 185]},
    ]

    blocks = ocr_utils.group_items_into_blocks(items)
    assert len(blocks) == 2
    assert 'Light reactions' in blocks[0]['text']
    assert 'Calvin cycle' in blocks[1]['text']

def test_merge_overlapping_blocks_merges_intersections():
    blocks = [
        {'id': 'block-1', 'box': [10, 10, 100, 50], 'text': 'A', 'score': 0.9, 'item_indices': [0]},
        {'id': 'block-2', 'box': [95, 12, 180, 52], 'text': 'B', 'score': 0.8, 'item_indices': [1]},
    ]

    merged = ocr_utils.merge_overlapping_blocks(blocks)
    assert len(merged) == 1
    assert merged[0]['id'] == 'block-1'
