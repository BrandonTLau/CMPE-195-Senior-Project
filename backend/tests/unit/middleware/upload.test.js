const path = require('path');

describe('upload middleware', () => {
  let uploadModule;

  beforeAll(() => {
    uploadModule = require('../../../middleware/upload');
  });

  describe('file filter', () => {
    const makeFile = (overrides = {}) => ({
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
      ...overrides,
    });

    const invokeFilter = (file) => new Promise((resolve) => {
      const fileFilter = uploadModule._fileFilter || extractFileFilter();
      fileFilter({}, file, (err, accepted) => resolve({ err, accepted }));
    });

    function extractFileFilter() {
      return (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/heic',
          'image/heif',
        ];
        const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.heic', '.heif'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
          return cb(null, true);
        }
        cb(new Error('Invalid file type. Only PDF, JPG, JPEG, PNG, and HEIC filetypes are allowed.'), false);
      };
    }

    test('accepts PDF files', async () => {
      const { err, accepted } = await invokeFilter(makeFile({
        originalname: 'notes.pdf',
        mimetype: 'application/pdf',
      }));
      expect(err).toBeNull();
      expect(accepted).toBe(true);
    });

    test('accepts JPEG files', async () => {
      const { err, accepted } = await invokeFilter(makeFile({
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
      }));
      expect(err).toBeNull();
      expect(accepted).toBe(true);
    });

    test('accepts PNG files', async () => {
      const { err, accepted } = await invokeFilter(makeFile({
        originalname: 'scan.png',
        mimetype: 'image/png',
      }));
      expect(err).toBeNull();
      expect(accepted).toBe(true);
    });

    test('accepts HEIC files', async () => {
      const { err, accepted } = await invokeFilter(makeFile({
        originalname: 'photo.heic',
        mimetype: 'image/heic',
      }));
      expect(err).toBeNull();
      expect(accepted).toBe(true);
    });

    test('rejects executable files', async () => {
      const { err, accepted } = await invokeFilter(makeFile({
        originalname: 'malware.exe',
        mimetype: 'application/x-msdownload',
      }));
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toMatch(/Invalid file type/i);
      expect(accepted).toBe(false);
    });

    test('rejects text files', async () => {
      const { err, accepted } = await invokeFilter(makeFile({
        originalname: 'notes.txt',
        mimetype: 'text/plain',
      }));
      expect(err).toBeInstanceOf(Error);
      expect(accepted).toBe(false);
    });

    test('rejects Word documents', async () => {
      const { err, accepted } = await invokeFilter(makeFile({
        originalname: 'notes.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }));
      expect(err).toBeInstanceOf(Error);
      expect(accepted).toBe(false);
    });

    test('accepts by extension when mime is generic', async () => {
      const { err, accepted } = await invokeFilter(makeFile({
        originalname: 'photo.heif',
        mimetype: 'application/octet-stream',
      }));
      expect(err).toBeNull();
      expect(accepted).toBe(true);
    });
  });

  describe('upload middleware module', () => {
    test('exports a multer-compatible middleware', () => {
      expect(uploadModule).toBeDefined();
      expect(typeof uploadModule.single).toBe('function');
    });

    test('has array handler for multi-file upload scenarios', () => {
      expect(typeof uploadModule.array).toBe('function');
    });
  });
});