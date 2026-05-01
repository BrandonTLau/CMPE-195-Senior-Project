/**
 * NoteScan Full System Load Test
 *
 * Tests the complete pipeline:
 *   Login → Upload → Mock OCR → Save Transcription → Generate AI → Fetch Result
 *
 * SETUP BEFORE RUNNING:
 *   1. Add mock_endpoint.py code to ocr_backend/app.py
 *   2. Start all services:
 *        Terminal 1: docker compose up -d mongodb && npm run dev  (backend/)
 *        Terminal 2: python -m uvicorn ocr_backend.app:app --port 8000  (repo root)
 *   3. Place a test image at: ./test-assets/test-note.jpg (~100KB, real note image)
 *   4. Ensure seed.js has been run
 *
 * RUN:
 *   k6 run ocr-load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ─── Custom Metrics ───────────────────────────────────────────────────────────
const errorRate              = new Rate('errors');
const loginDuration          = new Trend('login_duration');
const uploadDuration         = new Trend('upload_duration');
const ocrDuration            = new Trend('ocr_duration');
const saveTranscriptDuration = new Trend('save_transcript_duration');
const generateDuration       = new Trend('generate_duration');
const fetchDuration          = new Trend('fetch_duration');
const pipelineDuration       = new Trend('full_pipeline_duration');
const uploadFailures         = new Counter('upload_failures');
const ocrFailures            = new Counter('ocr_failures');
const generateFailures       = new Counter('generate_failures');

// ─── Config ──────────────────────────────────────────────────────────────────
const EXPRESS_URL = __ENV.EXPRESS_URL || 'http://localhost:5000';
const OCR_URL     = __ENV.OCR_URL     || 'http://localhost:8000';

// Pool matches seed.js MOCK_USERS (role: 'user' only — admin excluded)
const TEST_ACCOUNTS = [
  { email: 'test@example.com',     password: 'password123'   },
  { email: 'stevem@example.com',   password: '$teve123321'   },
  { email: 'ppspider@example.com', password: 'man$pid3r'     },
  { email: 'timcook@example.com',  password: 'appleapple123' },
];

// Small test image — must exist before running
const TEST_IMAGE = open('./test-note.jpg', 'b');

function randomAccount() {
  return TEST_ACCOUNTS[Math.floor(Math.random() * TEST_ACCOUNTS.length)];
}

// ─── Scenario Options ─────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // 1 VU — verify the full pipeline works end-to-end before load
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      tags: { scenario: 'smoke' },
      exec: 'fullPipeline',
    },

    // Moderate concurrent users running the full pipeline.
    // Keep VUs low — Generate AI hits OpenAI which has its own rate limits.
    load: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m', target: 5  },
        { duration: '3m', target: 10 },
        { duration: '2m', target: 15 },
        { duration: '1m', target: 0  },
      ],
      tags: { scenario: 'load' },
      exec: 'fullPipeline',
      startTime: '1m',
    },

    // Higher load — find where Express + MongoDB + OpenAI saturates
    stress: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 20 },
        { duration: '2m', target: 30 },
        { duration: '1m', target: 0  },
      ],
      tags: { scenario: 'stress' },
      exec: 'fullPipeline',
      startTime: '9m',
    },
  },

  thresholds: {
    // No failures expected
    http_req_failed: ['rate<0.05'],
    errors:          ['rate<0.10'],

    // Individual step thresholds
    upload_duration:          ['p(95)<5000'],
    ocr_duration:             ['p(95)<2000'],   // mock returns instantly
    save_transcript_duration: ['p(95)<3000'],
    generate_duration:        ['p(95)<60000'],  // OpenAI can be slow
    fetch_duration:           ['p(95)<3000'],

    // End-to-end pipeline
    full_pipeline_duration: ['p(95)<90000'],
  },
};

// ─── Step Functions ───────────────────────────────────────────────────────────

function login(email, password) {
  const res = http.post(
    `${EXPRESS_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'login' } }
  );

  loginDuration.add(res.timings.duration);

  const ok = check(res, {
    'login: status 200': (r) => r.status === 200,
    'login: has token':  (r) => { try { return !!r.json('token'); } catch { return false; } },
  });

  if (!ok) { errorRate.add(1); return null; }
  errorRate.add(0);
  try { return res.json('token'); } catch { return null; }
}

function uploadFile(token) {
  const payload = {
    file: http.file(TEST_IMAGE, 'test-note.jpg', 'image/jpeg'),
  };

  const res = http.post(`${EXPRESS_URL}/api/files/upload`, payload, {
    headers: { 'x-auth-token': token },
    tags: { endpoint: 'upload' },
    timeout: '30s',
  });

  uploadDuration.add(res.timings.duration);

  const ok = check(res, {
    'upload: status 201': (r) => r.status === 201,
    'upload: has _id':    (r) => { try { return !!r.json('_id'); } catch { return false; } },
  });

  if (!ok) { uploadFailures.add(1); errorRate.add(1); return null; }
  errorRate.add(0);
  try { return res.json('_id'); } catch { return null; }
}

function mockOcr() {
  // Sends file to the mock endpoint — skips Datalab API, returns instantly.
  // In production this would be POST /ocr_api/ocr?engine=chandra
  const payload = {
    file: http.file(TEST_IMAGE, 'test-note.jpg', 'image/jpeg'),
  };

  const res = http.post(`${OCR_URL}/ocr_api/mock`, payload, {
    tags: { endpoint: 'ocr_mock' },
    timeout: '30s',
  });

  ocrDuration.add(res.timings.duration);

  const ok = check(res, {
    'ocr: status 200':  (r) => r.status === 200,
    'ocr: has text':    (r) => { try { return !!r.json('text'); } catch { return false; } },
    'ocr: engine mock': (r) => { try { return r.json('engine') === 'mock'; } catch { return false; } },
  });

  if (!ok) { ocrFailures.add(1); errorRate.add(1); return null; }
  errorRate.add(0);
  try { return res.json('text'); } catch { return null; }
}

function saveTranscription(token, fileId, text) {
  const res = http.put(
    `${EXPRESS_URL}/api/files/${fileId}/edit/transcription`,
    JSON.stringify({ newText: text, previousText: ' ' }),
    {
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      tags: { endpoint: 'save_transcription' },
    }
  );

  saveTranscriptDuration.add(res.timings.duration);

  const ok = check(res, {
    'save transcript: status 200':    (r) => r.status === 200,
    'save transcript: has content':   (r) => {
      try { return !!r.json('currentContent'); } catch { return false; }
    },
  });

  errorRate.add(ok ? 0 : 1);
  return ok;
}

function generateAI(token, fileId, ocrText) {
  const res = http.post(
    `${EXPRESS_URL}/api/files/${fileId}/generate`,
    JSON.stringify({ contentType: 'all', sourceText: ocrText }),
    {
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      tags: { endpoint: 'generate' },
      timeout: '120s',  // OpenAI can be slow under load
    }
  );

  generateDuration.add(res.timings.duration);

  const ok = check(res, {
    'generate: status 200':  (r) => r.status === 200,
    'generate: has content': (r) => { try { return !!r.json('currentContent'); } catch { return false; } },
    'generate: not failed':  (r) => { try { return r.json('entry')?.status !== 'failed'; } catch { return true; } },
  });

  if (!ok) { generateFailures.add(1); errorRate.add(1); return false; }
  errorRate.add(0);
  return true;
}

function fetchResult(token, fileId) {
  const res = http.get(`${EXPRESS_URL}/api/files/${fileId}`, {
    headers: { 'x-auth-token': token },
    tags: { endpoint: 'fetch_result' },
  });

  fetchDuration.add(res.timings.duration);

  check(res, {
    'fetch: status 200':     (r) => r.status === 200,
    'fetch: has summary':    (r) => { try { return typeof r.json('currentContent.summary') === 'string'; } catch { return false; } },
    'fetch: has flashCards': (r) => { try { return Array.isArray(r.json('currentContent.flashCards')); } catch { return false; } },
  });

  errorRate.add(res.status !== 200 ? 1 : 0);
}

function deleteFile(token, fileId) {
  const res = http.del(`${EXPRESS_URL}/api/files/${fileId}`, null, {
    headers: { 'x-auth-token': token },
    tags: { endpoint: 'delete' },
  });
  check(res, { 'delete: status 200': (r) => r.status === 200 });
  errorRate.add(res.status !== 200 ? 1 : 0);
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────

export function fullPipeline() {
  group('full-system-pipeline', () => {
    const pipelineStart = Date.now();

    // Step 1 — Login
    const { email, password } = randomAccount();
    const token = login(email, password);
    if (!token) return;

    // Step 2 — Upload file to Express
    const fileId = uploadFile(token);
    if (!fileId) return;

    // Step 3 — OCR via mock endpoint (replaces real Chandra call)
    const ocrText = mockOcr();
    if (!ocrText) {
      deleteFile(token, fileId);
      return;
    }

    // Step 4 — Save OCR transcription back to the file record
    const saved = saveTranscription(token, fileId, ocrText);
    if (!saved) {
      deleteFile(token, fileId);
      return;
    }

    // Step 5 — Generate AI summary + flashcards via OpenAI
    const generated = generateAI(token, fileId, ocrText);
    if (!generated) {
      deleteFile(token, fileId);
      return;
    }

    // Step 6 — Fetch full result to verify everything was saved
    fetchResult(token, fileId);

    pipelineDuration.add(Date.now() - pipelineStart);

    // Always clean up — prevent DB/disk bloat across test runs
    deleteFile(token, fileId);
  });

  // Give OpenAI breathing room between iterations
  sleep(Math.random() * 3 + 2);
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export function handleSummary(data) {
  return {
    'system-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textReport(data),
  };
}

function textReport(data) {
  const m = data.metrics;

  const line = (label, metric) => {
    if (!metric) return `${label.padEnd(35)} N/A`;
    const v   = metric.values || {};
    const avg = v.avg      != null ? v.avg.toFixed(0)      + 'ms' : '—';
    const p95 = v['p(95)'] != null ? v['p(95)'].toFixed(0) + 'ms' : '—';
    return `${label.padEnd(35)} avg=${avg.padStart(8)}  p95=${p95.padStart(8)}`;
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
   NoteScan Full System Load Test Summary
================================================
   Pipeline: Login → Upload → OCR → Save → Generate AI → Fetch

--- Step Timings ---
${line('login_duration',            m.login_duration)}
${line('upload_duration',           m.upload_duration)}
${line('ocr_duration (mock)',       m.ocr_duration)}
${line('save_transcript_duration', m.save_transcript_duration)}
${line('generate_duration',        m.generate_duration)}
${line('fetch_duration',           m.fetch_duration)}
${line('full_pipeline_duration',   m.full_pipeline_duration)}
${line('http_req_duration (all)',  m.http_req_duration)}

--- Failure Counts ---
${counter('Upload failures',   m.upload_failures)}
${counter('OCR failures',      m.ocr_failures)}
${counter('Generate failures', m.generate_failures)}

--- Rates ---
${rate('HTTP failure rate',   m.http_req_failed)}
${rate('Error rate (custom)', m.errors)}

--- Volume ---
${counter('Total HTTP requests', m.http_reqs)}

NOTE: OCR step uses mock endpoint — Chandra (Datalab API) excluded
from load testing due to external rate limits and per-request billing.
================================================
`;
}
