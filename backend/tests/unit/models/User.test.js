const mongoose = require('mongoose');
const User = require('../../../models/User');
const { connect, disconnect, clearDatabase } = require('../../helpers/testDb');

describe('User model', () => {
  beforeAll(async () => { await connect(); });
  afterAll(async () => { await disconnect(); });
  afterEach(async () => { await clearDatabase(); });

  describe('schema validation', () => {
    test('requires email', async () => {
      const user = new User({ password: 'hashed' });
      await expect(user.save()).rejects.toThrow();
    });

    test('requires password', async () => {
      const user = new User({ email: 'test@example.com' });
      await expect(user.save()).rejects.toThrow();
    });

    test('saves valid user with all required fields', async () => {
      const user = await new User({
        email: 'valid@example.com',
        password: 'hashed_password',
      }).save();
      expect(user._id).toBeDefined();
      expect(user.email).toBe('valid@example.com');
    });
  });

  describe('defaults', () => {
    test('defaults role to user', async () => {
      const user = await new User({
        email: 'default@example.com',
        password: 'hashed',
      }).save();
      expect(user.role).toBe('user');
    });

    test('defaults isActive to true', async () => {
      const user = await new User({
        email: 'active@example.com',
        password: 'hashed',
      }).save();
      expect(user.isActive).toBe(true);
    });

    test('defaults fullName to empty string', async () => {
      const user = await new User({
        email: 'noname@example.com',
        password: 'hashed',
      }).save();
      expect(user.fullName).toBe('');
    });

    test('sets dateJoined automatically', async () => {
      const before = Date.now();
      const user = await new User({
        email: 'dated@example.com',
        password: 'hashed',
      }).save();
      expect(user.dateJoined).toBeInstanceOf(Date);
      expect(user.dateJoined.getTime()).toBeGreaterThanOrEqual(before - 1000);
    });

    test('initializes empty fileUploads array', async () => {
      const user = await new User({
        email: 'files@example.com',
        password: 'hashed',
      }).save();
      expect(Array.isArray(user.fileUploads)).toBe(true);
      expect(user.fileUploads).toHaveLength(0);
    });

    test('initializes empty folders array', async () => {
      const user = await new User({
        email: 'folders@example.com',
        password: 'hashed',
      }).save();
      expect(Array.isArray(user.folders)).toBe(true);
      expect(user.folders).toHaveLength(0);
    });
  });

  describe('normalization', () => {
    test('lowercases email automatically', async () => {
      const user = await new User({
        email: 'MixedCase@Example.COM',
        password: 'hashed',
      }).save();
      expect(user.email).toBe('mixedcase@example.com');
    });

    test('trims whitespace from email', async () => {
      const user = await new User({
        email: '  spaced@example.com  ',
        password: 'hashed',
      }).save();
      expect(user.email).toBe('spaced@example.com');
    });

    test('trims whitespace from fullName', async () => {
      const user = await new User({
        fullName: '   John Doe   ',
        email: 'john@example.com',
        password: 'hashed',
      }).save();
      expect(user.fullName).toBe('John Doe');
    });
  });

  describe('uniqueness', () => {
    test('enforces unique email', async () => {
      await new User({
        email: 'unique@example.com',
        password: 'pw1',
      }).save();
      await expect(new User({
        email: 'unique@example.com',
        password: 'pw2',
      }).save()).rejects.toThrow();
    });

    test('treats emails as unique after lowercasing', async () => {
      await new User({
        email: 'Case@Example.com',
        password: 'pw1',
      }).save();
      await expect(new User({
        email: 'CASE@EXAMPLE.COM',
        password: 'pw2',
      }).save()).rejects.toThrow();
    });
  });

  describe('role enum', () => {
    test('accepts user role', async () => {
      const user = await new User({
        email: 'regular@example.com',
        password: 'hashed',
        role: 'user',
      }).save();
      expect(user.role).toBe('user');
    });

    test('accepts admin role', async () => {
      const user = await new User({
        email: 'admin@example.com',
        password: 'hashed',
        role: 'admin',
      }).save();
      expect(user.role).toBe('admin');
    });

    test('accepts guest role', async () => {
      const user = await new User({
        email: 'guest@example.com',
        password: 'hashed',
        role: 'guest',
      }).save();
      expect(user.role).toBe('guest');
    });

    test('rejects invalid role', async () => {
      const user = new User({
        email: 'bad@example.com',
        password: 'hashed',
        role: 'superuser',
      });
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('folders subdocument', () => {
    test('stores folder objects with id and name', async () => {
      const user = await new User({
        email: 'withfolders@example.com',
        password: 'hashed',
        folders: [
          { id: 'folder-1', name: 'Math' },
          { id: 'folder-2', name: 'Science' },
        ],
      }).save();
      expect(user.folders).toHaveLength(2);
      expect(user.folders[0].id).toBe('folder-1');
      expect(user.folders[0].name).toBe('Math');
    });

    test('requires folder id and name', async () => {
      const user = new User({
        email: 'badfolders@example.com',
        password: 'hashed',
        folders: [{ id: 'only-id' }],
      });
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('timestamps', () => {
    test('sets createdAt and updatedAt', async () => {
      const user = await new User({
        email: 'timed@example.com',
        password: 'hashed',
      }).save();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });
});
