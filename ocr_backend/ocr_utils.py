import os
from pathlib import Path

import cv2
import numpy as np

try:
    from paddleocr import PaddleOCR
except Exception:  # pragma: no cover - allows test imports without model deps
    PaddleOCR = None

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "output"
OCR_CFG_PATH = BASE_DIR / "PaddleOCR.yaml"

_ocr = None


def get_ocr_engine():
    global _ocr
    if _ocr is None:
        if os.getenv("OCR_SKIP_MODEL_LOAD") == "1":
            raise RuntimeError("OCR model loading disabled by OCR_SKIP_MODEL_LOAD=1")
        if PaddleOCR is None:
            raise RuntimeError("PaddleOCR is not installed.")
        _ocr = PaddleOCR(paddlex_config=str(OCR_CFG_PATH))
    return _ocr


def preprocess_for_handwriting(input_path: Path) -> Path:
    img = cv2.imread(str(input_path))
    if img is None:
        raise ValueError(f"Could not read image: {input_path}")

    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    g = cv2.resize(g, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    g = cv2.GaussianBlur(g, (3, 3), 0)
    th = cv2.adaptiveThreshold(
        g, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 7
    )

    out_path = OUTPUT_DIR / f"{input_path.stem}_clean.png"
    cv2.imwrite(str(out_path), th)
    return out_path


def normalize_image_max_side(input_path: Path, max_side: int = 1600) -> Path:
    img = cv2.imread(str(input_path))
    if img is None:
        raise ValueError(f"Could not read image: {input_path}")

    h, w = img.shape[:2]
    m = max(h, w)
    if m > max_side:
        scale = max_side / m
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    out_path = OUTPUT_DIR / f"{input_path.stem}_norm.jpg"
    cv2.imwrite(str(out_path), img)
    return out_path


def rects_overlap(a, b, pad: int = 2) -> bool:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    return not (
        ax2 + pad < bx1 or
        bx2 + pad < ax1 or
        ay2 + pad < by1 or
        by2 + pad < ay1
    )


def merge_items_into_lines(items: list[dict], y_tol: int = 14, gap_for_tab: int = 40) -> str:
    tokens = []
    for it in items:
        box = it.get("box")
        text = (it.get("text") or "").strip()
        if not box or len(box) != 4 or not text:
            continue
        x1, y1, x2, y2 = box
        yc = (y1 + y2) / 2.0
        tokens.append((yc, x1, x2, text))

    tokens.sort(key=lambda t: (t[0], t[1]))

    lines = []
    current = []
    current_y = None

    for yc, x1, x2, text in tokens:
        if current_y is None or abs(yc - current_y) <= y_tol:
            current.append((x1, x2, text))
            current_y = yc if current_y is None else (current_y * 0.7 + yc * 0.3)
        else:
            current.sort(key=lambda t: t[0])
            lines.append(current)
            current = [(x1, x2, text)]
            current_y = yc

    if current:
        current.sort(key=lambda t: t[0])
        lines.append(current)

    out_lines = []
    for line in lines:
        parts = []
        prev_x2 = None
        for x1, x2, text in line:
            if prev_x2 is None:
                parts.append(text)
            else:
                gap = x1 - prev_x2
                parts.append(("\t" if gap >= gap_for_tab else " ") + text)
            prev_x2 = x2
        out_lines.append("".join(parts))

    return "\n".join(out_lines).strip()


def _merge_box(boxes: list[list[int]]) -> list[int]:
    xs1 = [b[0] for b in boxes]
    ys1 = [b[1] for b in boxes]
    xs2 = [b[2] for b in boxes]
    ys2 = [b[3] for b in boxes]
    return [min(xs1), min(ys1), max(xs2), max(ys2)]


def _make_block(entries: list[dict], block_idx: int) -> dict:
    entries = sorted(entries, key=lambda e: (e["box"][1], e["box"][0]))
    box = _merge_box([e["box"] for e in entries])
    text = "\n".join(e["text"] for e in entries if e["text"].strip()).strip()
    scores = [e["score"] for e in entries if e["score"] is not None]
    avg_score = sum(scores) / len(scores) if scores else None
    return {
        "id": f"block-{block_idx}",
        "box": box,
        "text": text,
        "score": avg_score,
        "item_indices": [e["idx"] for e in entries],
    }


def merge_overlapping_blocks(blocks: list[dict], x_pad: int = 4, y_pad: int = 3) -> list[dict]:
    if not blocks:
        return []

    def overlaps(a: list[int], b: list[int]) -> bool:
        ax1, ay1, ax2, ay2 = a
        bx1, by1, bx2, by2 = b
        return not (
            ax2 + x_pad < bx1 or
            bx2 + x_pad < ax1 or
            ay2 + y_pad < by1 or
            by2 + y_pad < ay1
        )

    changed = True
    current = blocks[:]

    while changed:
        changed = False
        merged = []
        used = [False] * len(current)

        for i in range(len(current)):
            if used[i]:
                continue

            group = [current[i]]
            used[i] = True

            group_changed = True
            while group_changed:
                group_changed = False
                group_box = _merge_box([g["box"] for g in group])

                for j in range(len(current)):
                    if used[j]:
                        continue
                    if overlaps(group_box, current[j]["box"]):
                        group.append(current[j])
                        used[j] = True
                        group_changed = True

            if len(group) == 1:
                merged.append(group[0])
            else:
                merged.append(
                    _make_block(
                        [
                            {
                                "idx": item_idx,
                                "text": text,
                                "score": score,
                                "box": box,
                            }
                            for block in group
                            for item_idx, text, score, box in zip(
                                block["item_indices"],
                                block["text"].split("\n"),
                                [block["score"]] * len(block["item_indices"]),
                                [block["box"]] * len(block["item_indices"]),
                            )
                        ],
                        len(merged) + 1,
                    )
                )
                changed = True

        current = merged

    for i, block in enumerate(current, start=1):
        block["id"] = f"block-{i}"

    return current


def group_items_into_blocks(
    items: list[dict],
    max_line_gap: int = 16,
    same_edge_tol: int = 55,
    overlap_ratio_min: float = 0.40,
) -> list[dict]:
    entries = []
    for idx, it in enumerate(items):
        box = it.get("box")
        text = (it.get("text") or "").strip()
        if not box or len(box) != 4 or not text:
            continue

        x1, y1, x2, y2 = [int(v) for v in box]
        if x2 <= x1 or y2 <= y1:
            continue

        entries.append({
            "idx": idx,
            "text": text,
            "score": it.get("score"),
            "box": [x1, y1, x2, y2],
            "w": x2 - x1,
            "h": y2 - y1,
        })

    if not entries:
        return []

    entries.sort(key=lambda e: (e["box"][1], e["box"][0]))

    blocks_raw = []
    current = [entries[0]]

    for entry in entries[1:]:
        prev = current[-1]
        block_box = _merge_box([e["box"] for e in current])

        x1, y1, x2, y2 = entry["box"]
        bx1, by1, bx2, by2 = block_box
        prev_x1, prev_y1, prev_x2, prev_y2 = prev["box"]

        line_gap = y1 - prev_y2
        x_overlap = max(0, min(x2, bx2) - max(x1, bx1))
        min_width = max(1, min(x2 - x1, bx2 - bx1))
        overlap_ratio = x_overlap / min_width

        similar_left_edge = abs(x1 - prev_x1) <= same_edge_tol
        similar_right_edge = abs(x2 - prev_x2) <= same_edge_tol
        vertical_close = 0 <= line_gap <= max_line_gap
        substantial_overlap = overlap_ratio >= overlap_ratio_min

        if vertical_close and substantial_overlap and (similar_left_edge or similar_right_edge):
            current.append(entry)
        else:
            blocks_raw.append(current)
            current = [entry]

    if current:
        blocks_raw.append(current)

    blocks = [_make_block(block, i + 1) for i, block in enumerate(blocks_raw)]
    blocks = merge_overlapping_blocks(blocks)
    return blocks


def build_overlay_image(image_path: Path, blocks: list[dict], out_path: Path) -> None:
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")

    white = np.full_like(img, 255)
    img = cv2.addWeighted(img, 0.12, white, 0.88, 0)

    for block in blocks:
        box = block.get("box")
        if not box or len(box) != 4:
            continue

        x1, y1, x2, y2 = [int(v) for v in box]
        if x2 <= x1 or y2 <= y1:
            continue

        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 160, 0), 2)

    cv2.imwrite(str(out_path), img)
