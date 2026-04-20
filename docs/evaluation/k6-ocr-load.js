import http from 'k6/http';
import { check, sleep } from 'k6';
import encoding from 'k6/encoding';

export const options = {
  vus: 3,
  duration: '2m',
};

const BASE_URL = __ENV.OCR_BASE_URL || 'http://127.0.0.1:8000';
const IMAGE_B64 = __ENV.TEST_IMAGE_B64 || '';

export default function () {
  if (!IMAGE_B64) {
    throw new Error('Set TEST_IMAGE_B64 to a base64-encoded PNG or JPG before running this script.');
  }

  const payload = {
    file: http.file(encoding.b64decode(IMAGE_B64, 'rawstd'), 'sample.png', 'image/png'),
  };

  const res = http.post(`${BASE_URL}/ocr_api/ocr_v5`, payload);
  check(res, {
    'ocr returned 200': (r) => r.status === 200,
  });
  sleep(1);
}
