const request = require('supertest');
const buildApp = require('../../app');
const UploadedFile = require('../../models/UploadedFile');
const { connect, disconnect, clearDatabase } = require('../helpers/testDb');
const { makeUserWithToken } = require('../helpers/makeUser');

describe('Files AI and extended edit integration', () => {
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
    const result = await makeUserWithToken({ email: 'ai@example.com' });
    user = result.user;
    token = result.token;
  });

  async function createFileWithTranscript(text = 'Mitochondria are the powerhouse of the cell.') {
    return new UploadedFile({
      uploadId: `ai-${Date.now()}-${Math.random()}`,
      userID: user._id,
      originalName: 'notes.pdf',
      fileType: 'pdf',
      mimeType: 'application/pdf',
      fileSize: 100,
      fileLocation: 'p/notes.pdf',
      folderPath: 'p',
      currentContent: {
        transcribedText: text,
        summary: '',
        studyGuide: '',
        flashCards: [
          { cardId: 'c1', question: 'What is the capital of France?', answer: 'Paris' },
          { cardId: 'c2', question: 'What is H2O?', answer: 'Water' },
        ],
        quiz: [
          { itemId: 'q1', question: 'What is 2+2?', options: ['3', '4', '5'], correctAnswer: '4', explanation: '' },
        ],
      },
    }).save();
  }

  describe('POST /api/files/:id/generate', () => {
    test('generates a summary via the mocked ollama service', async () => {
      const file = await createFileWithTranscript();
      const res = await request(app).post(`/api/files/${file._id}/generate`)
        .set('x-auth-token', token).send({ contentType: 'summary' });
      expect(res.status).toBe(200);
      expect(res.body.currentContent.summary).toMatch(/MOCK SUMMARY/);
      expect(res.body.entry.status).toBe('completed');
    });

    test('generates flashcards via the mocked ollama service', async () => {
      const file = await createFileWithTranscript();
      const res = await request(app).post(`/api/files/${file._id}/generate`)
        .set('x-auth-token', token).send({ contentType: 'flashCards' });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.currentContent.flashCards)).toBe(true);
      expect(res.body.currentContent.flashCards.length).toBeGreaterThan(0);
    });

    test('generates all content types when contentType is "all"', async () => {
      const file = await createFileWithTranscript();
      const res = await request(app).post(`/api/files/${file._id}/generate`)
        .set('x-auth-token', token).send({ contentType: 'all' });
      expect(res.status).toBe(200);
      expect(res.body.currentContent.summary).toMatch(/MOCK SUMMARY/);
      expect(res.body.currentContent.flashCards.length).toBeGreaterThan(0);
    });

    test('uses sourceText from request body when provided', async () => {
      const file = await createFileWithTranscript('original transcript');
      const res = await request(app).post(`/api/files/${file._id}/generate`)
        .set('x-auth-token', token)
        .send({ contentType: 'summary', sourceText: 'custom override text' });
      expect(res.status).toBe(200);
      expect(res.body.currentContent.summary).toMatch(/MOCK SUMMARY/);
    });

    test('rejects invalid contentType', async () => {
      const file = await createFileWithTranscript();
      const res = await request(app).post(`/api/files/${file._id}/generate`)
        .set('x-auth-token', token).send({ contentType: 'invalid_kind' });
      expect(res.status).toBe(400);
      expect(res.body.msg).toMatch(/contentType/i);
    });

    test('rejects generation when no source text is available', async () => {
      const file = await new UploadedFile({
        uploadId: 'empty-src', userID: user._id, originalName: 'empty.pdf',
        fileType: 'pdf', mimeType: 'application/pdf', fileSize: 100,
        fileLocation: 'p/empty.pdf', folderPath: 'p',
        currentContent: { transcribedText: '', summary: '', studyGuide: '', flashCards: [], quiz: [] },
      }).save();
      const res = await request(app).post(`/api/files/${file._id}/generate`)
        .set('x-auth-token', token).send({ contentType: 'summary' });
      expect(res.status).toBe(400);
      expect(res.body.msg).toMatch(/no note text/i);
    });

    test('rejects generation for another user\'s file', async () => {
      const file = await createFileWithTranscript();
      const other = await makeUserWithToken({ email: 'snooper@example.com' });
      const res = await request(app).post(`/api/files/${file._id}/generate`)
        .set('x-auth-token', other.token).send({ contentType: 'summary' });
      expect(res.status).toBe(403);
    });

    test('appends an entry to regenerationLog on success', async () => {
      const file = await createFileWithTranscript();
      await request(app).post(`/api/files/${file._id}/generate`)
        .set('x-auth-token', token).send({ contentType: 'summary' });
      const reloaded = await UploadedFile.findById(file._id);
      expect(reloaded.regenerationLog.length).toBe(1);
      expect(reloaded.regenerationLog[0].status).toBe('completed');
    });
  });

  describe('POST /api/files/:id/regenerate', () => {
    test('regenerates all content when contentType omitted', async () => {
      const file = await createFileWithTranscript();
      const res = await request(app).post(`/api/files/${file._id}/regenerate`)
        .set('x-auth-token', token).send({});
      expect(res.status).toBe(200);
      expect(res.body.currentContent.summary).toBeDefined();
    });

    test('respects explicit contentType when provided to regenerate', async () => {
      const file = await createFileWithTranscript();
      const res = await request(app).post(`/api/files/${file._id}/regenerate`)
        .set('x-auth-token', token).send({ contentType: 'summary' });
      expect(res.status).toBe(200);
      expect(res.body.currentContent.summary).toMatch(/MOCK SUMMARY/);
    });
  });

  describe('PUT /api/files/:id/edit/flashcards (replace array)', () => {
    test('replaces the full flashcard array', async () => {
      const file = await createFileWithTranscript();
      const res = await request(app).put(`/api/files/${file._id}/edit/flashcards`)
        .set('x-auth-token', token).send({
          cards: [
            { cardId: 'new1', question: 'New Q', answer: 'New A' },
          ],
        });
      expect(res.status).toBe(200);
      expect(res.body.currentContent.flashCards).toHaveLength(1);
      expect(res.body.currentContent.flashCards[0].question).toBe('New Q');
    });

    test('filters out cards with empty question or answer', async () => {
      const file = await createFileWithTranscript();
      const res = await request(app).put(`/api/files/${file._id}/edit/flashcards`)
        .set('x-auth-token', token).send({
          cards: [
            { cardId: 'good', question: 'Valid Q', answer: 'Valid A' },
            { cardId: 'empty-q', question: '', answer: 'Answer only' },
            { cardId: 'empty-a', question: 'Question only', answer: '' },
          ],
        });
      expect(res.status).toBe(200);
      expect(res.body.currentContent.flashCards).toHaveLength(1);
    });

    test('rejects non-array cards payload', async () => {
      const file = await createFileWithTranscript();
      const res = await request(app).put(`/api/files/${file._id}/edit/flashcards`)
        .set('x-auth-token', token).send({ cards: 'not an array' });
      expect(res.status).toBe(400);
    });

    test('rejects when accessing another user\'s file', async () => {
      const file = await createFileWithTranscript();
      const other = await makeUserWithToken({ email: 'hacker@example.com' });
      const res = await request(app).put(`/api/files/${file._id}/edit/flashcards`)
        .set('x-auth-token', other.token).send({ cards: [] });
      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/files/:id/edit/flashcard (single card field)', () => {
    test('updates a single flashcard question', async () => {
      const file = await createFileWithTranscript();
      const res = await request(app).put(`/api/files/${file._id}/edit/flashcard`)
        .set('x-auth-token', token).send({
          cardId: 'c1', field: 'question', previousText: 'What is the capital of France?', newText: 'Capital of France?',
        });
      expect(res.status).toBe(200);
      const reloaded = await UploadedFile.findById(file._id);
      const card = reloaded.currentContent.flashCards.find((c) => c.cardId === 'c1');
      expect(card.question).toBe('Capital of France?');
    });

    test('updates a single flashcard answer', async () => {
      const file = await createFileWithTranscript();
      const res = await request(app).put(`/api/files/${file._id}/edit/flashcard`)
        .set('x-auth-token', token).send({
          cardId: 'c1', field: 'answer', previousText: 'Paris', newText: 'Paris, France',
        });
      expect(res.status).toBe(200);
      const reloaded = await UploadedFile.findById(file._id);
      const card = reloaded.currentContent.flashCards.find((c) => c.cardId === 'c1');
      expect(card.answer).toBe('Paris, France');
    });

    test('appends to flashCardEdits history', async () => {
      const file = await createFileWithTranscript();
      await request(app).put(`/api/files/${file._id}/edit/flashcard`)
        .set('x-auth-token', token).send({
          cardId: 'c1', field: 'question', newText: 'Changed Q',
        });
      const reloaded = await UploadedFile.findById(file._id);
      expect(reloaded.editHistory.flashCardEdits).toHaveLength(1);
      expect(reloaded.editHistory.flashCardEdits[0].newText).toBe('Changed Q');
    });

    test('rejects missing cardId', async () => {
      const file = await createFileWithTranscript();
      const res = await request(app).put(`/api/files/${file._id}/edit/flashcard`)
        .set('x-auth-token', token).send({ field: 'question', newText: 'X' });
      expect(res.status).toBe(400);
    });

    test('rejects missing field', async () => {
      const file = await createFileWithTranscript();
      const res = await request(app).put(`/api/files/${file._id}/edit/flashcard`)
        .set('x-auth-token', token).send({ cardId: 'c1', newText: 'X' });
      expect(res.status).toBe(400);
    });

    test('rejects invalid field name', async () => {
      const file = await createFileWithTranscript();
      const res = await request(app).put(`/api/files/${file._id}/edit/flashcard`)
        .set('x-auth-token', token).send({
          cardId: 'c1', field: 'invalid_field', newText: 'X',
        });
      expect(res.status).toBe(400);
      expect(res.body.msg).toMatch(/question or answer/i);
    });
  });

  describe('PUT /api/files/:id/edit/quiz', () => {
    test('updates a quiz item question', async () => {
      const file = await createFileWithTranscript();
      const res = await request(app).put(`/api/files/${file._id}/edit/quiz`)
        .set('x-auth-token', token).send({
          itemId: 'q1', field: 'question', previousText: 'What is 2+2?', newText: 'What is two plus two?',
        });
      expect(res.status).toBe(200);
      const reloaded = await UploadedFile.findById(file._id);
      const item = reloaded.currentContent.quiz.find((q) => q.itemId === 'q1');
      expect(item.question).toBe('What is two plus two?');
    });

    test('updates a quiz item explanation', async () => {
      const file = await createFileWithTranscript();
      const res = await request(app).put(`/api/files/${file._id}/edit/quiz`)
        .set('x-auth-token', token).send({
          itemId: 'q1', field: 'explanation', previousText: '', newText: 'Simple arithmetic',
        });
      expect(res.status).toBe(200);
    });

    test('appends to quizEdits history', async () => {
      const file = await createFileWithTranscript();
      await request(app).put(`/api/files/${file._id}/edit/quiz`)
        .set('x-auth-token', token).send({
          itemId: 'q1', field: 'question', newText: 'Changed',
        });
      const reloaded = await UploadedFile.findById(file._id);
      expect(reloaded.editHistory.quizEdits).toHaveLength(1);
    });

    test('rejects missing itemId', async () => {
      const file = await createFileWithTranscript();
      const res = await request(app).put(`/api/files/${file._id}/edit/quiz`)
        .set('x-auth-token', token).send({ field: 'question', newText: 'X' });
      expect(res.status).toBe(400);
    });

    test('rejects missing newText', async () => {
      const file = await createFileWithTranscript();
      const res = await request(app).put(`/api/files/${file._id}/edit/quiz`)
        .set('x-auth-token', token).send({ itemId: 'q1', field: 'question' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/files/:id/edits', () => {
    test('returns full edit history', async () => {
      const file = await createFileWithTranscript();
      await request(app).put(`/api/files/${file._id}/edit/transcription`)
        .set('x-auth-token', token).send({ previousText: 'old', newText: 'new' });
      const res = await request(app).get(`/api/files/${file._id}/edits`)
        .set('x-auth-token', token);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('transcriptionEdits');
      expect(res.body).toHaveProperty('flashCardEdits');
      expect(res.body).toHaveProperty('quizEdits');
      expect(res.body.transcriptionEdits).toHaveLength(1);
    });

    test('rejects unauthenticated access to edit history', async () => {
      const file = await createFileWithTranscript();
      const res = await request(app).get(`/api/files/${file._id}/edits`);
      expect(res.status).toBe(401);
    });

    test('rejects access to another user\'s edit history', async () => {
      const file = await createFileWithTranscript();
      const other = await makeUserWithToken({ email: 'peeker@example.com' });
      const res = await request(app).get(`/api/files/${file._id}/edits`)
        .set('x-auth-token', other.token);
      expect(res.status).toBe(403);
    });
  });
});