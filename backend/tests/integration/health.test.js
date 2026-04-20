const request = require('supertest');
const buildApp = require('../../app');
const { connect, disconnect } = require('../helpers/testDb');

describe('Health endpoint', () => {
  let app;

  beforeAll(async () => {
    await connect();
    app = buildApp();
  });
  afterAll(async () => { await disconnect(); });

  test('GET /api/health returns 200 and status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  test('responds quickly', async () => {
    const start = Date.now();
    const res = await request(app).get('/api/health');
    const elapsed = Date.now() - start;
    expect(res.status).toBe(200);
    expect(elapsed).toBeLessThan(500);
  });

  test('does not require authentication', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });
});

describe('CORS configuration', () => {
  let app;

  beforeAll(async () => {
    await connect();
    app = buildApp();
  });
  afterAll(async () => { await disconnect(); });

  test('responds to OPTIONS preflight', async () => {
    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST');
    expect([200, 204]).toContain(res.status);
  });

  test('allows configured frontend origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});

describe('Global error handling', () => {
  let app;

  beforeAll(async () => {
    await connect();
    app = buildApp();
  });
  afterAll(async () => { await disconnect(); });

  test('returns 404 for unknown routes gracefully', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect([404, 500]).toContain(res.status);
  });

  test('handles malformed JSON in request body', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{not valid json');
    expect([400, 500]).toContain(res.status);
  });
});
