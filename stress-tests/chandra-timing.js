/**
 * NoteScan — Real Chandra OCR Timing Script
 *
 * Phase 2 of the two-phase load testing approach.
 * Tests actual Chandra (Datalab) OCR latency with real API calls.
 *
 * IMPORTANT:
 *   - This uses real API credits — keep VUs and duration low
 *   - Estimated credit usage: ~50-100 requests total
 *   - Set your CHANDRA_API_KEY before running
 *
 * RUN:
 *   k6 run chandra-timing.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ─── Custom Metrics ───────────────────────────────────────────────────────────
const ocrImageDuration = new Trend('ocr_image_duration');
const ocrPdfDuration   = new Trend('ocr_pdf_duration');
const ocrFailures      = new Counter('ocr_failures');
const errorRate        = new Rate('errors');

// ─── Config ──────────────────────────────────────────────────────────────────
const OCR_URL = __ENV.OCR_URL || 'http://localhost:8000';

// Load test files
const TEST_IMAGE = open('./test-note.jpg', 'b');
const TEST_PDF   = open('./test-note2.pdf', 'b');

// ─── Options ─────────────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // Image timing — 3 VUs, 3 minutes
    image_timing: {
      executor: 'constant-vus',
      vus: 3,
      duration: '3m',
      tags: { file_type: 'image' },
      exec: 'testImageOcr',
    },

    // PDF timing — 3 VUs, 3 minutes
    pdf_timing: {
      executor: 'constant-vus',
      vus: 3,
      duration: '3m',
      tags: { file_type: 'pdf' },
      exec: 'testPdfOcr',
      startTime: '3m30s', // start after image test finishes
    },
  },

  thresholds: {
    http_req_failed: ['rate<0.10'],
    errors:          ['rate<0.10'],
    // Chandra can be slow — these are intentionally lenient
    ocr_image_duration: ['p(95)<60000'],
    ocr_pdf_duration:   ['p(95)<90000'],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function runOcr(fileData, filename, mimeType, durationMetric) {
  const payload = {
    file: http.file(fileData, filename, mimeType),
  };

  const res = http.post(
    `${OCR_URL}/ocr_api/ocr?engine=chandra`,
    payload,
    {
      tags: { endpoint: 'ocr_real_chandra', file_type: mimeType },
      timeout: '180s', // Chandra can take a while on complex documents
    }
  );

  durationMetric.add(res.timings.duration);

  const ok = check(res, {
    'ocr: status 200':    (r) => r.status === 200,
    'ocr: has text':      (r) => {
      try { return !!r.json('text') && r.json('text').length > 0; } catch { return false; }
    },
    'ocr: no error':      (r) => {
      try { return !r.json('error'); } catch { return false; }
    },
    'ocr: has confidence': (r) => {
      try { return r.json('confidence') !== null; } catch { return false; }
    },
  });

  if (!ok) {
    ocrFailures.add(1);
    errorRate.add(1);
    // Log what came back so we can debug failures
    console.error(`OCR failed for ${filename}: status=${res.status} body=${res.body?.substring(0, 200)}`);
  } else {
    errorRate.add(0);
    try {
      const confidence = res.json('confidence');
      const textLength = res.json('text')?.length || 0;
      console.log(`OCR success: ${filename} | confidence=${confidence} | chars=${textLength} | duration=${res.timings.duration}ms`);
    } catch { /* ignore parse errors on logging */ }
  }

  return res;
}

// ─── Scenario Functions ───────────────────────────────────────────────────────

export function testImageOcr() {
  group('chandra-image-ocr', () => {
    runOcr(TEST_IMAGE, 'test-note.jpg', 'image/jpeg', ocrImageDuration);
  });
  // Sleep between requests — Chandra needs breathing room
  sleep(Math.random() * 5 + 5);
}

export function testPdfOcr() {
  group('chandra-pdf-ocr', () => {
    runOcr(TEST_PDF, 'test-note2.pdf', 'application/pdf', ocrPdfDuration);
  });
  sleep(Math.random() * 5 + 5);
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export function handleSummary(data) {
  return {
    'chandra-timing-summary.json': JSON.stringify(data, null, 2),
    stdout: textReport(data),
  };
}

function textReport(data) {
  const m = data.metrics;

  const line = (label, metric) => {
    if (!metric) return `${label.padEnd(35)} N/A`;
    const v   = metric.values || {};
    const avg = v.avg      != null ? v.avg.toFixed(0)      + 'ms' : '—';
    const min = v.min      != null ? v.min.toFixed(0)      + 'ms' : '—';
    const max = v.max      != null ? v.max.toFixed(0)      + 'ms' : '—';
    const p95 = v['p(95)'] != null ? v['p(95)'].toFixed(0) + 'ms' : '—';
    return `${label.padEnd(35)} avg=${avg.padStart(8)}  min=${min.padStart(8)}  max=${max.padStart(8)}  p95=${p95.padStart(8)}`;
  };

  const counter = (label, metric) => {
    if (!metric) return `${label.padEnd(35)} N/A`;
    return `${label.padEnd(35)} ${metric.values.count}`;
  };

  const rate = (label, metric) => {
    if (!metric) return `${label.padEnd(35)} N/A`;
    return `${label.padEnd(35)} ${(metric.values.rate * 100).toFixed(2)}%`;
  };

  return `
================================================
   NoteScan — Real Chandra OCR Timing Results
================================================
   Engine: Chandra (Datalab hosted API)
   Mode:   fast (set via CHANDRA_MODE env var)
   VUs:    3 concurrent per file type

--- OCR Latency by File Type ---
${line('Image (jpg) duration',  m.ocr_image_duration)}
${line('PDF duration',          m.ocr_pdf_duration)}

--- Reliability ---
${counter('OCR failures',      m.ocr_failures)}
${rate('Error rate',           m.errors)}
${rate('HTTP failure rate',    m.http_req_failed)}
${counter('Total OCR requests', m.http_reqs)}

================================================
   These numbers represent REAL Chandra latency.
   Add to mock load test pipeline duration for
   accurate full system performance estimate.
================================================
`;
}
