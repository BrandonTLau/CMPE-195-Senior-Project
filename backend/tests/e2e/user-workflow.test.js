const path = require('path');
const fs = require('fs');
const request = require('supertest');
const buildApp = require('../../app');
const { connect, disconnect, clearDatabase } = require('../helpers/testDb');

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

describe('End-to-end user workflow', () => {
  let app;
  let pdfPath;

  beforeAll(async () => {
    await connect();
    app = buildApp();
    if (!fs.existsSync(FIXTURES_DIR)) fs.mkdirSync(FIXTURES_DIR, { recursive: true });
    pdfPath = path.join(FIXTURES_DIR, 'e2e.pdf');
    if (!fs.existsSync(pdfPath)) {
      fs.writeFileSync(pdfPath, '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');
    }
  });

  afterAll(async () => {
    await disconnect();
    if (fs.existsSync(UPLOADS_DIR)) {
      fs.rmSync(UPLOADS_DIR, { recursive: true, force: true });
    }
  });

  beforeEach(async () => { await clearDatabase(); });

  test('complete student workflow: register, login, upload, organize, edit, trash, delete', async () => {
    const registerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Jane Student', email: 'jane.e2e@example.com', password: 'securepass123',
    });
    expect(registerRes.status).toBe(201);
    const token = registerRes.body.token;

    const uploadRes = await request(app)
      .post('/api/files/upload').set('x-auth-token', token).attach('file', pdfPath);
    expect(uploadRes.status).toBe(201);
    const fileId = uploadRes.body._id;

    const folderRes = await request(app)
      .post('/api/folders').set('x-auth-token', token).send({ name: 'Biology 101' });
    const folderId = folderRes.body.id;

    const moveRes = await request(app)
      .patch(`/api/files/${fileId}/meta`).set('x-auth-token', token).send({ folderId });
    expect(moveRes.body.folderId).toBe(folderId);

    const titleRes = await request(app)
      .patch(`/api/files/${fileId}/meta`).set('x-auth-token', token)
      .send({ title: 'Cell Biology Notes', tags: ['biology', 'cells'] });
    expect(titleRes.body.title).toBe('Cell Biology Notes');

    const favRes = await request(app)
      .patch(`/api/files/${fileId}/meta`).set('x-auth-token', token).send({ isFavorite: true });
    expect(favRes.body.isFavorite).toBe(true);

    const editRes = await request(app)
      .put(`/api/files/${fileId}/edit/transcription`).set('x-auth-token', token)
      .send({ previousText: '', newText: 'Mitochondria are the powerhouse of the cell.' });
    expect(editRes.status).toBe(200);

    const trashRes = await request(app)
      .patch(`/api/files/${fileId}/meta`).set('x-auth-token', token).send({ isDeleted: true });
    expect(trashRes.body.isDeleted).toBe(true);

    const mainListAfterTrash = await request(app).get('/api/files').set('x-auth-token', token);
    expect(mainListAfterTrash.body).toHaveLength(0);

    const trashListRes = await request(app).get('/api/files/trash').set('x-auth-token', token);
    expect(trashListRes.body).toHaveLength(1);

    const restoreRes = await request(app)
      .patch(`/api/files/${fileId}/meta`).set('x-auth-token', token).send({ isDeleted: false });
    expect(restoreRes.body.isDeleted).toBe(false);

    const delRes = await request(app).delete(`/api/files/${fileId}`).set('x-auth-token', token);
    expect(delRes.status).toBe(200);
  });

  test('data isolation: two users cannot see each other\'s files', async () => {
    const userA = await request(app).post('/api/auth/register')
      .send({ fullName: 'Alice', email: 'alice.iso@example.com', password: 'alicepass1' });
    const userB = await request(app).post('/api/auth/register')
      .send({ fullName: 'Bob', email: 'bob.iso@example.com', password: 'bobpass123' });

    await request(app).post('/api/files/upload')
      .set('x-auth-token', userA.body.token).attach('file', pdfPath);
    await request(app).post('/api/files/upload')
      .set('x-auth-token', userB.body.token).attach('file', pdfPath);

    const aList = await request(app).get('/api/files').set('x-auth-token', userA.body.token);
    const bList = await request(app).get('/api/files').set('x-auth-token', userB.body.token);

    expect(aList.body).toHaveLength(1);
    expect(bList.body).toHaveLength(1);
    expect(aList.body[0]._id).not.toBe(bList.body[0]._id);
  });

  test('mock credentials flow works end-to-end', async () => {
    const login = await request(app).post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(login.status).toBe(200);
    const token = login.body.token;

    const upload = await request(app)
      .post('/api/files/upload').set('x-auth-token', token).attach('file', pdfPath);
    expect(upload.status).toBe(201);
  });
});