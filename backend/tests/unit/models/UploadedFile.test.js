const UploadedFile = require('../../../models/UploadedFile');
const User = require('../../../models/User');
const { connect, disconnect, clearDatabase } = require('../../helpers/testDb');

describe('UploadedFile model', () => {
  let testUser;

  beforeAll(async () => { await connect(); });
  afterAll(async () => { await disconnect(); });

  beforeEach(async () => {
    await clearDatabase();
    testUser = await new User({
      email: 'owner@example.com',
      password: 'hashed',
    }).save();
  });

  const baseFileData = () => ({
    uploadId: `upload-${Date.now()}`,
    userID: testUser._id,
    originalName: 'notes.pdf',
    fileType: 'pdf',
    mimeType: 'application/pdf',
    fileSize: 123456,
    fileLocation: `uploads/${testUser._id}/upload-1/notes.pdf`,
    folderPath: `${testUser._id}/upload-1`,
  });

  describe('required fields', () => {
    test('requires uploadId', async () => {
      const data = baseFileData();
      delete data.uploadId;
      await expect(new UploadedFile(data).save()).rejects.toThrow();
    });

    test('requires userID', async () => {
      const data = baseFileData();
      delete data.userID;
      await expect(new UploadedFile(data).save()).rejects.toThrow();
    });

    test('requires originalName', async () => {
      const data = baseFileData();
      delete data.originalName;
      await expect(new UploadedFile(data).save()).rejects.toThrow();
    });

    test('requires fileType', async () => {
      const data = baseFileData();
      delete data.fileType;
      await expect(new UploadedFile(data).save()).rejects.toThrow();
    });

    test('requires fileSize', async () => {
      const data = baseFileData();
      delete data.fileSize;
      await expect(new UploadedFile(data).save()).rejects.toThrow();
    });
  });

  describe('uniqueness', () => {
    test('enforces unique uploadId', async () => {
      const data = baseFileData();
      await new UploadedFile(data).save();
      await expect(new UploadedFile({ ...data, originalName: 'other.pdf' }).save())
        .rejects.toThrow();
    });
  });

  describe('defaults', () => {
    test('defaults status to uploaded', async () => {
      const file = await new UploadedFile(baseFileData()).save();
      expect(file.status).toBe('uploaded');
    });

    test('defaults isFavorite to false', async () => {
      const file = await new UploadedFile(baseFileData()).save();
      expect(file.isFavorite).toBe(false);
    });

    test('defaults isDeleted to false', async () => {
      const file = await new UploadedFile(baseFileData()).save();
      expect(file.isDeleted).toBe(false);
    });

    test('defaults folderId to null', async () => {
      const file = await new UploadedFile(baseFileData()).save();
      expect(file.folderId).toBeNull();
    });

    test('defaults contentType to unknown', async () => {
      const file = await new UploadedFile(baseFileData()).save();
      expect(file.contentType).toBe('unknown');
    });

    test('initializes empty currentContent fields', async () => {
      const file = await new UploadedFile(baseFileData()).save();
      expect(file.currentContent.transcribedText).toBe('');
      expect(file.currentContent.summary).toBe('');
      expect(file.currentContent.studyGuide).toBe('');
      expect(file.currentContent.flashCards).toEqual([]);
      expect(file.currentContent.quiz).toEqual([]);
    });

    test('initializes empty editHistory arrays', async () => {
      const file = await new UploadedFile(baseFileData()).save();
      expect(file.editHistory.transcriptionEdits).toEqual([]);
      expect(file.editHistory.summaryEdits).toEqual([]);
      expect(file.editHistory.studyGuideEdits).toEqual([]);
      expect(file.editHistory.flashCardEdits).toEqual([]);
      expect(file.editHistory.quizEdits).toEqual([]);
    });

    test('sets uploadDate automatically', async () => {
      const before = Date.now();
      const file = await new UploadedFile(baseFileData()).save();
      expect(file.uploadDate).toBeInstanceOf(Date);
      expect(file.uploadDate.getTime()).toBeGreaterThanOrEqual(before - 1000);
    });
  });

  describe('enum fields', () => {
    test('accepts valid status values', async () => {
      const statuses = ['uploaded', 'queued', 'preprocessing', 'ocr_processing',
                        'ai_processing', 'completed', 'failed'];
      for (const status of statuses) {
        const data = baseFileData();
        data.uploadId = `upload-${status}-${Date.now()}-${Math.random()}`;
        data.status = status;
        const file = await new UploadedFile(data).save();
        expect(file.status).toBe(status);
      }
    });

    test('rejects invalid status', async () => {
      const data = baseFileData();
      data.status = 'completely_invalid';
      await expect(new UploadedFile(data).save()).rejects.toThrow();
    });

    test('accepts valid contentType values', async () => {
      const types = ['handwritten', 'typed', 'mixed', 'pdf', 'unknown'];
      for (const contentType of types) {
        const data = baseFileData();
        data.uploadId = `upload-${contentType}-${Date.now()}-${Math.random()}`;
        data.contentType = contentType;
        const file = await new UploadedFile(data).save();
        expect(file.contentType).toBe(contentType);
      }
    });
  });

  describe('flashCards subdocument', () => {
    test('stores flashcards with question and answer', async () => {
      const data = baseFileData();
      data.currentContent = {
        flashCards: [
          { cardId: 'c1', question: 'What is ML?', answer: 'Machine learning.' },
          { cardId: 'c2', question: 'Define AI.', answer: 'Artificial intelligence.' },
        ],
      };
      const file = await new UploadedFile(data).save();
      expect(file.currentContent.flashCards).toHaveLength(2);
      expect(file.currentContent.flashCards[0].question).toBe('What is ML?');
    });
  });

  describe('editHistory append-only', () => {
    test('appends transcription edits without overwriting', async () => {
      const file = await new UploadedFile(baseFileData()).save();
      file.editHistory.transcriptionEdits.push({
        previousText: 'old text',
        newText: 'new text',
        editedBy: testUser._id,
      });
      await file.save();
      file.editHistory.transcriptionEdits.push({
        previousText: 'new text',
        newText: 'newer text',
        editedBy: testUser._id,
      });
      await file.save();
      const reloaded = await UploadedFile.findById(file._id);
      expect(reloaded.editHistory.transcriptionEdits).toHaveLength(2);
      expect(reloaded.editHistory.transcriptionEdits[0].previousText).toBe('old text');
      expect(reloaded.editHistory.transcriptionEdits[1].newText).toBe('newer text');
    });
  });

  describe('timestamps', () => {
    test('sets createdAt and updatedAt', async () => {
      const file = await new UploadedFile(baseFileData()).save();
      expect(file.createdAt).toBeInstanceOf(Date);
      expect(file.updatedAt).toBeInstanceOf(Date);
    });

    test('updates updatedAt on save', async () => {
      const file = await new UploadedFile(baseFileData()).save();
      const firstUpdate = file.updatedAt.getTime();
      await new Promise((r) => setTimeout(r, 20));
      file.title = 'Changed Title';
      await file.save();
      expect(file.updatedAt.getTime()).toBeGreaterThan(firstUpdate);
    });
  });
});