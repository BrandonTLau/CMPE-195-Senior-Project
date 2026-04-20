const request = require('supertest');
const bcrypt = require('bcryptjs');
const buildApp = require('../../app');
const User = require('../../models/User');
const { connect, disconnect, clearDatabase } = require('../helpers/testDb');

describe('Auth API integration', () => {
  let app;

  beforeAll(async () => {
    await connect();
    app = buildApp();
  });
  afterAll(async () => { await disconnect(); });
  afterEach(async () => { await clearDatabase(); });

  describe('POST /api/auth/register', () => {
    test('creates a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'New User',
          email: 'newuser@example.com',
          password: 'securepass123',
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        email: 'newuser@example.com',
        fullName: 'New User',
      });
    });

    test('hashes the password before storing', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Secure',
          email: 'hashed@example.com',
          password: 'plainpassword',
        });
      const stored = await User.findOne({ email: 'hashed@example.com' });
      expect(stored.password).not.toBe('plainpassword');
      expect(await bcrypt.compare('plainpassword', stored.password)).toBe(true);
    });

    test('normalizes email to lowercase', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'MIXED@Example.COM',
          password: 'password123',
        });
      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('mixed@example.com');
    });

    test('rejects registration with missing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: 'password123' });
      expect(res.status).toBe(400);
      expect(res.body.msg).toMatch(/email.*password/i);
    });

    test('rejects registration with missing password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'missing@example.com' });
      expect(res.status).toBe(400);
    });

    test('rejects empty request body', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});
      expect(res.status).toBe(400);
    });

    test('rejects duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'dup@example.com',
          password: 'password123',
        });
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'dup@example.com',
          password: 'anotherpass',
        });
      expect(res.status).toBe(400);
      expect(res.body.msg).toMatch(/already exists/i);
    });

    test('rejects duplicate email regardless of case', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'case@example.com',
          password: 'password123',
        });
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'CASE@Example.com',
          password: 'password456',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const salt = await bcrypt.genSalt(10);
      await new User({
        fullName: 'Real User',
        email: 'real@example.com',
        password: await bcrypt.hash('realpass123', salt),
      }).save();
    });

    test('logs in with mock credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@example.com');
    });

    test('auto-creates mock user if not present', async () => {
      await User.deleteMany({ email: 'test@example.com' });
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      expect(res.status).toBe(200);
      const stored = await User.findOne({ email: 'test@example.com' });
      expect(stored).not.toBeNull();
    });

    test('logs in with real user credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'real@example.com',
          password: 'realpass123',
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('real@example.com');
    });

    test('updates lastLogin timestamp on successful login', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'real@example.com',
          password: 'realpass123',
        });
      const stored = await User.findOne({ email: 'real@example.com' });
      expect(stored.lastLogin).toBeInstanceOf(Date);
    });

    test('rejects login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'real@example.com',
          password: 'wrongpassword',
        });
      expect(res.status).toBe(400);
      expect(res.body.msg).toMatch(/invalid/i);
    });

    test('rejects login for nonexistent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ghost@example.com',
          password: 'whatever123',
        });
      expect(res.status).toBe(400);
    });

    test('rejects login with missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'pass' });
      expect(res.status).toBe(400);
    });

    test('rejects login with missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'real@example.com' });
      expect(res.status).toBe(400);
    });

    test('accepts mixed-case email on login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'REAL@Example.com',
          password: 'realpass123',
        });
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/auth/me', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Profile User',
          email: 'profile@example.com',
          password: 'password123',
        });
      token = res.body.token;
      userId = res.body.user.id;
    });

    test('returns user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('x-auth-token', token);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe('profile@example.com');
      expect(res.body).not.toHaveProperty('password');
    });

    test('rejects request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    test('rejects request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('x-auth-token', 'garbage');
      expect(res.status).toBe(401);
    });
  });
});
