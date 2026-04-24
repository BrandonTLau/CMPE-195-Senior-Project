import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const listDuration = new Trend('list_duration');
const uploadDuration = new Trend('upload_duration');
const authFailures = new Counter('auth_failures');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const MOCK_EMAIL = 'test@example.com';
const MOCK_PASSWORD = 'password123';

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { scenario: 'smoke' },
      exec: 'smokeTest',
    },
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '2m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      tags: { scenario: 'load' },
      exec: 'loadTest',
      startTime: '30s',
    },
    stress: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 200,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '1m', target: 0 },
      ],
      tags: { scenario: 'stress' },
      exec: 'stressTest',
      startTime: '7m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    login_duration: ['p(95)<800'],
    list_duration: ['p(95)<500'],
    errors: ['rate<0.10'],
  },
};

function login(email, password) {
  const start = Date.now();
  const res = http.post(`${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'login' } }
  );
  loginDuration.add(Date.now() - start);
  const ok = check(res, {
    'login: status 200': (r) => r.status === 200,
    'login: has token': (r) => {
      try { return !!r.json('token'); } catch (e) { return false; }
    },
  });
  if (!ok) {
    authFailures.add(1);
    errorRate.add(1);
    return null;
  }
  errorRate.add(0);
  try { return res.json('token'); } catch (e) { return null; }
}

function listFiles(token) {
  const start = Date.now();
  const res = http.get(`${BASE_URL}/api/files`, {
    headers: { 'x-auth-token': token },
    tags: { endpoint: 'list' },
  });
  listDuration.add(Date.now() - start);
  check(res, { 'list: status 200': (r) => r.status === 200 });
  errorRate.add(res.status !== 200);
  return res;
}

function registerUser() {
  const email = `stress_${randomString(10)}@example.com`;
  const password = 'stresspass123';
  const res = http.post(`${BASE_URL}/api/auth/register`,
    JSON.stringify({ fullName: 'Stress User', email, password }),
    { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'register' } }
  );
  check(res, { 'register: 201': (r) => r.status === 201 });
  if (res.status !== 201) errorRate.add(1);
  try { return res.json('token'); } catch (e) { return null; }
}

function healthCheck() {
  const res = http.get(`${BASE_URL}/api/health`, { tags: { endpoint: 'health' } });
  check(res, {
    'health: status 200': (r) => r.status === 200,
    'health: status ok': (r) => {
      try { return r.json('status') === 'ok'; } catch (e) { return false; }
    },
  });
  errorRate.add(res.status !== 200);
}

export function smokeTest() {
  group('smoke', () => {
    healthCheck();
    const token = login(MOCK_EMAIL, MOCK_PASSWORD);
    if (token) listFiles(token);
  });
  sleep(1);
}

export function loadTest() {
  group('standard-load', () => {
    healthCheck();
    const token = login(MOCK_EMAIL, MOCK_PASSWORD);
    if (token) {
      listFiles(token);
      const me = http.get(`${BASE_URL}/api/auth/me`, {
        headers: { 'x-auth-token': token }, tags: { endpoint: 'me' },
      });
      check(me, { 'me: 200': (r) => r.status === 200 });
    }
  });
  sleep(Math.random() * 2 + 0.5);
}

export function stressTest() {
  group('stress', () => {
    const pick = Math.random();
    if (pick < 0.2) {
      registerUser();
    } else if (pick < 0.5) {
      const token = login(MOCK_EMAIL, MOCK_PASSWORD);
      if (token) listFiles(token);
    } else if (pick < 0.8) {
      const token = login(MOCK_EMAIL, MOCK_PASSWORD);
      if (token) {
        listFiles(token);
        http.get(`${BASE_URL}/api/folders`, {
          headers: { 'x-auth-token': token }, tags: { endpoint: 'folders' },
        });
      }
    } else {
      healthCheck();
    }
  });
}

export function handleSummary(data) {
  return {
    'stress-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textReport(data),
  };
}

function textReport(data) {
  const m = data.metrics;
  const line = (name, metric) => {
    if (!metric) return `${name.padEnd(30)} N/A`;
    const v = metric.values || {};
    const avg = v.avg ? v.avg.toFixed(2) + 'ms' : '';
    const p95 = v['p(95)'] ? v['p(95)'].toFixed(2) + 'ms' : '';
    const p99 = v['p(99)'] ? v['p(99)'].toFixed(2) + 'ms' : '';
    return `${name.padEnd(30)} avg=${avg}  p95=${p95}  p99=${p99}`;
  };
  return `
================================
NoteScan Backend Stress Test Summary
================================
${line('http_req_duration', m.http_req_duration)}
${line('login_duration', m.login_duration)}
${line('list_duration', m.list_duration)}

Requests total:     ${m.http_reqs ? m.http_reqs.values.count : 'N/A'}
Failure rate:       ${m.http_req_failed ? (m.http_req_failed.values.rate * 100).toFixed(2) + '%' : 'N/A'}
Error rate:         ${m.errors ? (m.errors.values.rate * 100).toFixed(2) + '%' : 'N/A'}
Auth failures:      ${m.auth_failures ? m.auth_failures.values.count : 'N/A'}
================================
`;
}
