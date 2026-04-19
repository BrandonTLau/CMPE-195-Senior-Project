import os
import base64
import tempfile
import traceback
from pathlib import Path

from flask import Flask, request, jsonify
from PIL import Image
import numpy as np
from paddleocr import PaddleOCR

app = Flask(__name__)

ocr_engine = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)

ALLOWED_IMAGE_TYPES = {'.jpg', '.jpeg', '.png', '.heic', '.heif'}
ALLOWED_PDF_TYPES   = {'.pdf'}


def process_ocr_result(result):
    if not result or not result[0]:
        return {'text': '', 'lines': [], 'averageConfidence': 0.0}

    lines      = []
    full_text  = []
    confidences = []

    for page in result:
        if not page:
            continue
        for line in page:
            bbox, (text, confidence) = line
            lines.append({
                'text':       text,
                'confidence': round(float(confidence), 4),
                'bbox':       bbox,
            })
            full_text.append(text)
            confidences.append(float(confidence))

    avg_conf = round(sum(confidences) / len(confidences), 4) if confidences else 0.0

    return {
        'text':              '\n'.join(full_text),
        'lines':             lines,
        'averageConfidence': avg_conf,
    }


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'engine': 'paddleocr'})


@app.route('/ocr/image', methods=['POST'])
def ocr_image():
    data = request.get_json(silent=True) or {}

    file_path = data.get('filePath')
    b64_data  = data.get('base64')

    try:
        if file_path:
            if not os.path.exists(file_path):
                return jsonify({'error': f'File not found: {file_path}'}), 404
            result = ocr_engine.ocr(file_path, cls=True)

        elif b64_data:
            img_bytes = base64.b64decode(b64_data)
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                tmp.write(img_bytes)
                tmp_path = tmp.name
            result = ocr_engine.ocr(tmp_path, cls=True)
            os.unlink(tmp_path)

        else:
            if 'file' not in request.files:
                return jsonify({'error': 'Provide filePath, base64, or multipart file'}), 400
            f = request.files['file']
            ext = Path(f.filename).suffix.lower()
            if ext not in ALLOWED_IMAGE_TYPES:
                return jsonify({'error': f'Unsupported image type: {ext}'}), 400
            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
                f.save(tmp.name)
                tmp_path = tmp.name
            result = ocr_engine.ocr(tmp_path, cls=True)
            os.unlink(tmp_path)

        parsed = process_ocr_result(result)
        return jsonify({'success': True, **parsed})

    except Exception:
        traceback.print_exc()
        return jsonify({'error': 'OCR processing failed', 'detail': traceback.format_exc()}), 500


@app.route('/ocr/pdf', methods=['POST'])
def ocr_pdf():
    try:
        from pdf2image import convert_from_path, convert_from_bytes
    except ImportError:
        return jsonify({'error': 'pdf2image not installed'}), 500

    data      = request.get_json(silent=True) or {}
    file_path = data.get('filePath')

    try:
        if file_path:
            if not os.path.exists(file_path):
                return jsonify({'error': f'File not found: {file_path}'}), 404
            pages = convert_from_path(file_path, dpi=200)
        elif 'file' in request.files:
            f     = request.files['file']
            pages = convert_from_bytes(f.read(), dpi=200)
        else:
            return jsonify({'error': 'Provide filePath or multipart file'}), 400

        all_text   = []
        all_lines  = []
        all_confs  = []

        for page_num, page_img in enumerate(pages, start=1):
            img_array = np.array(page_img)
            result    = ocr_engine.ocr(img_array, cls=True)
            parsed    = process_ocr_result(result)
            all_text.append(f'--- Page {page_num} ---\n{parsed["text"]}')
            for line in parsed['lines']:
                line['page'] = page_num
                all_lines.append(line)
            all_confs.extend([l['confidence'] for l in parsed['lines']])

        avg_conf = round(sum(all_confs) / len(all_confs), 4) if all_confs else 0.0
        return jsonify({
            'success':           True,
            'text':              '\n\n'.join(all_text),
            'lines':             all_lines,
            'averageConfidence': avg_conf,
            'pageCount':         len(pages),
        })

    except Exception:
        traceback.print_exc()
        return jsonify({'error': 'PDF OCR processing failed', 'detail': traceback.format_exc()}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8100, debug=False)