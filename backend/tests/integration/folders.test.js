const request = require('supertest');
const buildApp = require('../../app');
const User = require('../../models/User');
const UploadedFile = require('../../models/UploadedFile');
const { connect, disconnect, clearDatabase } = require('../helpers/testDb');
const { makeUserWithToken } = require('../helpers/makeUser');

describe('Folders API integration', () => {
  let app;
  let token;
  let user;

  beforeAll(async () => {
    await connect();
    app = buildApp();
  });
  afterAll(async () => { await disconnect(); });

  beforeEach(async () => {
    await clearDatabase();
    const result = await makeUserWithToken({ email: 'folders@example.com' });
    user = result.user;
    token = result.token;
  });

  describe('GET /api/folders', () => {
    test('returns empty array for new user', async () => {
      const res = await request(app).get('/api/folders').set('x-auth-token', token);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('returns user folders', async () => {
      await User.findByIdAndUpdate(user._id, {
        folders: [
          { id: 'f1', name: 'Math' },
          { id: 'f2', name: 'Science' },
        ],
      });
      const res = await request(app).get('/api/folders').set('x-auth-token', token);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    test('rejects unauthenticated request', async () => {
      const res = await request(app).get('/api/folders');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/folders', () => {
    test('creates a new folder with generated id', async () => {
      const res = await request(app)
        .post('/api/folders').set('x-auth-token', token).send({ name: 'History' });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('History');
      expect(res.body.id).toBeDefined();
    });

    test('trims folder name whitespace', async () => {
      const res = await request(app)
        .post('/api/folders').set('x-auth-token', token).send({ name: '   Trimmed   ' });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Trimmed');
    });

    test('rejects empty name', async () => {
      const res = await request(app)
        .post('/api/folders').set('x-auth-token', token).send({ name: '' });
      expect(res.status).toBe(400);
    });

    test('rejects whitespace-only name', async () => {
      const res = await request(app)
        .post('/api/folders').set('x-auth-token', token).send({ name: '   ' });
      expect(res.status).toBe(400);
    });

    test('rejects missing name field', async () => {
      const res = await request(app).post('/api/folders').set('x-auth-token', token).send({});
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/folders/:id', () => {
    let folderId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/folders').set('x-auth-token', token).send({ name: 'ToDelete' });
      folderId = res.body.id;
    });

    test('deletes the folder', async () => {
      const res = await request(app)
        .delete(`/api/folders/${folderId}`).set('x-auth-token', token);
      expect(res.status).toBe(200);
      const updated = await User.findById(user._id);
      expect(updated.folders).toHaveLength(0);
    });

    test('unassigns files that were in the deleted folder', async () => {
      const file = await new UploadedFile({
        uploadId: 'in-folder', userID: user._id, originalName: 'in.pdf',
        fileType: 'pdf', mimeType: 'application/pdf', fileSize: 100,
        fileLocation: 'p/in.pdf', folderPath: 'p', folderId: folderId,
      }).save();
      await request(app).delete(`/api/folders/${folderId}`).set('x-auth-token', token);
      const reloaded = await UploadedFile.findById(file._id);
      expect(reloaded.folderId).toBeNull();
    });
  });
});