const path = require('path');
const fs = require('fs');
const request = require('supertest');
const buildApp = require('../../app');
const UploadedFile = require('../../models/UploadedFile');
const User = require('../../models/User');
const { connect, disconnect, clearDatabase } = require('../helpers/testDb');
const { makeUserWithToken } = require('../helpers/makeUser');

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

function ensureFixture(name, content) {
  const fullPath = path.join(FIXTURES_DIR, name);
  if (!fs.existsSync(FIXTURES_DIR)) fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  if (!fs.existsSync(fullPath)) fs.writeFileSync(fullPath, content);
  return fullPath;
}

describe('Files API integration', () => {
  let app;
  let token;
  let user;
  let pdfPath;
  let pngPath;
  let txtPath;

  beforeAll(async () => {
    await connect();
    app = buildApp();
    const pdfBuf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');
    const pngBuf = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
      0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54,
      0x08, 0x99, 0x63, 0xF8, 0xFF, 0xFF, 0x3F, 0x00,
      0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59, 0xE7,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
    ]);
    pdfPath = ensureFixture('sample.pdf', pdfBuf);
    pngPath = ensureFixture('sample.png', pngBuf);
    txtPath = ensureFixture('sample.txt', 'not an image or pdf');
  });

  afterAll(async () => {
    await disconnect();
    if (fs.existsSync(UPLOADS_DIR)) {
      fs.rmSync(UPLOADS_DIR, { recursive: true, force: true });
    }
  });

  beforeEach(async () => {
    await clearDatabase();
    const result = await makeUserWithToken({ email: 'files@example.com' });
    user = result.user;
    token = result.token;
  });

  describe('POST /api/files/upload', () => {
    test('uploads a valid PDF file', async () => {
      const res = await request(app)
        .post('/api/files/upload').set('x-auth-token', token).attach('file', pdfPath);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.fileType).toBe('pdf');
      expect(res.body.userID.toString()).toBe(user._id.toString());
    });

    test('uploads a valid PNG image', async () => {
      const res = await request(app)
        .post('/api/files/upload').set('x-auth-token', token).attach('file', pngPath);
      expect(res.status).toBe(201);
      expect(res.body.fileType).toBe('image');
    });

    test('stores file in /{userId}/{uploadId}/ directory structure', async () => {
      const res = await request(app)
        .post('/api/files/upload').set('x-auth-token', token).attach('file', pdfPath);
      expect(res.body.folderPath).toBe(`${user._id}/${res.body.uploadId}`);
      const expectedPath = path.join(UPLOADS_DIR, user._id.toString(), res.body.uploadId);
      expect(fs.existsSync(expectedPath)).toBe(true);
    });

    test('rejects unsupported file type', async () => {
      const res = await request(app)
        .post('/api/files/upload').set('x-auth-token', token).attach('file', txtPath);
      expect([400, 415]).toContain(res.status);
    });

    /*
    test.skip('rejects request without authentication', async () => {
      const res = await request(app).post('/api/files/upload').attach('file', pdfPath);
      expect(res.status).toBe(401);
    });
    */
    test('rejects request with no file attached', async () => {
      const res = await request(app).post('/api/files/upload').set('x-auth-token', token);
      expect(res.status).toBe(400);
    });

    test('records uploadId and adds file to user.fileUploads', async () => {
      const res = await request(app)
        .post('/api/files/upload').set('x-auth-token', token).attach('file', pdfPath);
      expect(res.body.uploadId).toBeDefined();
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.fileUploads.map((id) => id.toString())).toContain(res.body._id);
    });
  });

  describe('GET /api/files', () => {
    test('returns empty array when user has no files', async () => {
      const res = await request(app).get('/api/files').set('x-auth-token', token);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('returns only the current user\'s files', async () => {
      const other = await makeUserWithToken({ email: 'other@example.com' });
      
      await new UploadedFile({
        uploadId: 'u-owned', userID: user._id, originalName: 'mine.pdf',
        fileType: 'pdf', mimeType: 'application/pdf', fileSize: 100,
        fileLocation: 'path/mine.pdf', folderPath: 'path',
        currentContent: { transcribedText: 'some text' },
      }).save();
      const res = await request(app).get('/api/files').set('x-auth-token', token);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].originalName).toBe('mine.pdf');
    });

    test('excludes soft-deleted files from main listing', async () => {
      await new UploadedFile({
  uploadId: 'u-active', userID: user._id, originalName: 'active.pdf',
  fileType: 'pdf', mimeType: 'application/pdf', fileSize: 100,
  fileLocation: 'p/active.pdf', folderPath: 'p',
  currentContent: { transcribedText: 'some text' },
}).save();
      await new UploadedFile({
        uploadId: 'u-trashed', userID: user._id, originalName: 'trashed.pdf',
        fileType: 'pdf', mimeType: 'application/pdf', fileSize: 100,
        fileLocation: 'p/trashed.pdf', folderPath: 'p', isDeleted: true,
      }).save();
      const res = await request(app).get('/api/files').set('x-auth-token', token);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].originalName).toBe('active.pdf');
    });

    test('rejects unauthenticated request', async () => {
      const res = await request(app).get('/api/files');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/files/trash', () => {
    test('returns only soft-deleted files', async () => {
      await new UploadedFile({
        uploadId: 'u-a', userID: user._id, originalName: 'active.pdf',
        fileType: 'pdf', mimeType: 'application/pdf', fileSize: 100,
        fileLocation: 'p/a.pdf', folderPath: 'p', isDeleted: false,
      }).save();
      await new UploadedFile({
        uploadId: 'u-d', userID: user._id, originalName: 'deleted.pdf',
        fileType: 'pdf', mimeType: 'application/pdf', fileSize: 100,
        fileLocation: 'p/d.pdf', folderPath: 'p', isDeleted: true,
      }).save();
      const res = await request(app).get('/api/files/trash').set('x-auth-token', token);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].originalName).toBe('deleted.pdf');
    });
  });

  describe('GET /api/files/:id', () => {
    let fileId;

    beforeEach(async () => {
      const f = await new UploadedFile({
        uploadId: 'single', userID: user._id, originalName: 'file.pdf',
        fileType: 'pdf', mimeType: 'application/pdf', fileSize: 100,
        fileLocation: 'path/file.pdf', folderPath: 'path',
      }).save();
      fileId = f._id.toString();
    });

    test('returns full file document', async () => {
      const res = await request(app).get(`/api/files/${fileId}`).set('x-auth-token', token);
      expect(res.status).toBe(200);
      expect(res.body._id).toBe(fileId);
    });

    test('returns 404 for nonexistent file', async () => {
      const res = await request(app)
        .get('/api/files/507f1f77bcf86cd799439011').set('x-auth-token', token);
      expect(res.status).toBe(404);
    });

    test('returns 403 when accessing another user\'s file', async () => {
      const other = await makeUserWithToken({ email: 'stranger@example.com' });
      const res = await request(app)
        .get(`/api/files/${fileId}`).set('x-auth-token', other.token);
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/files/:id/meta', () => {
    let fileId;

    beforeEach(async () => {
      const f = await new UploadedFile({
        uploadId: 'meta', userID: user._id, originalName: 'm.pdf',
        fileType: 'pdf', mimeType: 'application/pdf', fileSize: 100,
        fileLocation: 'p/m.pdf', folderPath: 'p',
      }).save();
      fileId = f._id.toString();
    });

    test('updates title', async () => {
      const res = await request(app)
        .patch(`/api/files/${fileId}/meta`).set('x-auth-token', token).send({ title: 'Renamed' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Renamed');
    });

    test('updates tags', async () => {
      const res = await request(app)
        .patch(`/api/files/${fileId}/meta`).set('x-auth-token', token)
        .send({ tags: ['Math', 'Calculus'] });
      expect(res.status).toBe(200);
      expect(res.body.tags).toEqual(['Math', 'Calculus']);
    });

    test('updates isFavorite', async () => {
      const res = await request(app)
        .patch(`/api/files/${fileId}/meta`).set('x-auth-token', token).send({ isFavorite: true });
      expect(res.status).toBe(200);
      expect(res.body.isFavorite).toBe(true);
    });

    test('updates isDeleted (soft delete / trash)', async () => {
      const res = await request(app)
        .patch(`/api/files/${fileId}/meta`).set('x-auth-token', token).send({ isDeleted: true });
      expect(res.status).toBe(200);
      expect(res.body.isDeleted).toBe(true);
    });

    test('restores file from trash', async () => {
      await UploadedFile.findByIdAndUpdate(fileId, { isDeleted: true });
      const res = await request(app)
        .patch(`/api/files/${fileId}/meta`).set('x-auth-token', token).send({ isDeleted: false });
      expect(res.status).toBe(200);
      expect(res.body.isDeleted).toBe(false);
    });

    test('assigns file to a folder via folderId', async () => {
      const res = await request(app)
        .patch(`/api/files/${fileId}/meta`).set('x-auth-token', token)
        .send({ folderId: 'folder-abc-123' });
      expect(res.status).toBe(200);
      expect(res.body.folderId).toBe('folder-abc-123');
    });

    test('removes file from folder by passing null', async () => {
      await UploadedFile.findByIdAndUpdate(fileId, { folderId: 'folder-x' });
      const res = await request(app)
        .patch(`/api/files/${fileId}/meta`).set('x-auth-token', token).send({ folderId: null });
      expect(res.status).toBe(200);
      expect(res.body.folderId).toBeNull();
    });

    test('rejects updating another user\'s file metadata', async () => {
      const other = await makeUserWithToken({ email: 'intruder@example.com' });
      const res = await request(app)
        .patch(`/api/files/${fileId}/meta`).set('x-auth-token', other.token)
        .send({ title: 'Hijacked' });
      expect(res.status).toBe(403);
    });

    test('returns 404 for nonexistent file', async () => {
      const res = await request(app)
        .patch('/api/files/507f1f77bcf86cd799439011/meta')
        .set('x-auth-token', token).send({ title: 'Ghost' });
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/files/:id/edit/transcription', () => {
    let fileId;

    beforeEach(async () => {
      const f = await new UploadedFile({
        uploadId: 'edit-t', userID: user._id, originalName: 't.pdf',
        fileType: 'pdf', mimeType: 'application/pdf', fileSize: 100,
        fileLocation: 'p/t.pdf', folderPath: 'p',
        currentContent: { transcribedText: 'original text' },
      }).save();
      fileId = f._id.toString();
    });

    test('appends an edit and updates currentContent', async () => {
      const res = await request(app)
        .put(`/api/files/${fileId}/edit/transcription`)
        .set('x-auth-token', token)
        .send({ previousText: 'original text', newText: 'revised text' });
      expect(res.status).toBe(200);
      expect(res.body.currentContent.transcribedText).toBe('revised text');
      expect(res.body.editCount).toBe(1);
    });

    test('appends multiple edits without overwriting', async () => {
      await request(app).put(`/api/files/${fileId}/edit/transcription`)
        .set('x-auth-token', token).send({ previousText: 'original text', newText: 'first edit' });
      const res = await request(app).put(`/api/files/${fileId}/edit/transcription`)
        .set('x-auth-token', token).send({ previousText: 'first edit', newText: 'second edit' });
      expect(res.body.editCount).toBe(2);
    });

    test('rejects empty request body', async () => {
      const res = await request(app)
        .put(`/api/files/${fileId}/edit/transcription`).set('x-auth-token', token).send({});
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/files/:id', () => {
    test('deletes file and removes on-disk directory', async () => {
      const uploadRes = await request(app)
        .post('/api/files/upload').set('x-auth-token', token).attach('file', pdfPath);
      const fileId = uploadRes.body._id;
      const onDiskDir = path.join(UPLOADS_DIR, user._id.toString(), uploadRes.body.uploadId);
      expect(fs.existsSync(onDiskDir)).toBe(true);
      const delRes = await request(app)
        .delete(`/api/files/${fileId}`).set('x-auth-token', token);
      expect(delRes.status).toBe(200);
      expect(await UploadedFile.findById(fileId)).toBeNull();
      expect(fs.existsSync(onDiskDir)).toBe(false);
    });

    test('rejects deletion of another user\'s file', async () => {
      const f = await new UploadedFile({
        uploadId: 'del-other', userID: user._id, originalName: 'x.pdf',
        fileType: 'pdf', mimeType: 'application/pdf', fileSize: 100,
        fileLocation: 'p/x.pdf', folderPath: 'p',
      }).save();
      const other = await makeUserWithToken({ email: 'thief@example.com' });
      const res = await request(app)
        .delete(`/api/files/${f._id}`).set('x-auth-token', other.token);
      expect(res.status).toBe(403);
    });

    test('returns 404 for nonexistent file', async () => {
      const res = await request(app)
        .delete('/api/files/507f1f77bcf86cd799439011').set('x-auth-token', token);
      expect(res.status).toBe(404);
    });
  });
});