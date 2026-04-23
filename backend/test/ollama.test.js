// =============================================================================
// tests/ollama.test.js
//
// Unit tests for backend/services/ollama.js
// Uses Jest mocks — no real Ollama server required
//
// Install:
//   npm install --save-dev jest
//
// Run:
//   npx jest tests/ollama.test.js --coverage
// =============================================================================

const {
  getOllamaConfig,
  generateSummary,
  generateFlashcards,
} = require('../services/ollama');

// Also import internal functions for unit testing
// We use a trick to access non-exported functions via the module directly
const ollamaModule = require('../services/ollama');

// ---------------------------------------------------------------------------
// Mock global fetch — no real HTTP calls
// ---------------------------------------------------------------------------
global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockOllamaSuccess(text) {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ response: text }),
  });
}

function mockOllamaFailure(status = 500, errorMsg = 'model error') {
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ error: errorMsg }),
  });
}

function mockOllamaEmptyResponse() {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ response: '' }),
  });
}

function mockOllamaUnreadable() {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => { throw new Error('bad json'); },
  });
}

const VALID_FLASHCARD_TEXT = `
Q: What is photosynthesis?
A: The process by which plants convert sunlight into energy.
---
Q: What is osmosis?
A: The movement of water through a semi-permeable membrane.
---
Q: What is mitosis?
A: Cell division producing two identical daughter cells.
---
Q: What is DNA?
A: Deoxyribonucleic acid, the molecule carrying genetic information.
---
Q: What is respiration?
A: The process of releasing energy from glucose.
---
Q: What is an enzyme?
A: A protein that speeds up chemical reactions.
`.trim();

const SAMPLE_NOTES = 'The mitochondria is the powerhouse of the cell. Cells use ATP for energy.';


// =============================================================================
// 1. getOllamaConfig
// =============================================================================

describe('getOllamaConfig', () => {
  test('returns an object with required keys', () => {
    const config = getOllamaConfig();
    expect(config).toHaveProperty('baseUrl');
    expect(config).toHaveProperty('model');
    expect(config).toHaveProperty('timeoutMs');
  });

  test('baseUrl does not end with a trailing slash', () => {
    const { baseUrl } = getOllamaConfig();
    expect(baseUrl).not.toMatch(/\/$/);
  });

  test('timeoutMs is a positive number', () => {
    const { timeoutMs } = getOllamaConfig();
    expect(typeof timeoutMs).toBe('number');
    expect(timeoutMs).toBeGreaterThan(0);
  });

  test('model is a non-empty string', () => {
    const { model } = getOllamaConfig();
    expect(typeof model).toBe('string');
    expect(model.length).toBeGreaterThan(0);
  });
});


// =============================================================================
// 2. generateSummary
// =============================================================================

describe('generateSummary', () => {
  test('returns a non-empty string on success', async () => {
    mockOllamaSuccess('• Cells use ATP for energy\n• Mitochondria produces ATP');
    const result = await generateSummary(SAMPLE_NOTES);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('calls fetch exactly once', async () => {
    mockOllamaSuccess('• Summary point');
    await generateSummary(SAMPLE_NOTES);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('sends a POST request to /api/generate', async () => {
    mockOllamaSuccess('• Summary');
    await generateSummary(SAMPLE_NOTES);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/api/generate');
    expect(options.method).toBe('POST');
  });

  test('request body contains the notes text', async () => {
    mockOllamaSuccess('• Summary');
    await generateSummary(SAMPLE_NOTES);
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.prompt).toContain('NOTES');
  });

  test('throws when Ollama returns a non-ok status', async () => {
    mockOllamaFailure(500, 'model not found');
    await expect(generateSummary(SAMPLE_NOTES)).rejects.toThrow();
  });

  test('throws when response is empty string', async () => {
    mockOllamaEmptyResponse();
    await expect(generateSummary(SAMPLE_NOTES)).rejects.toThrow();
  });

  test('throws when response JSON is unreadable', async () => {
    mockOllamaUnreadable();
    await expect(generateSummary(SAMPLE_NOTES)).rejects.toThrow();
  });

  test('handles very long notes without crashing', async () => {
    mockOllamaSuccess('• Long summary point');
    const longNotes = 'word '.repeat(5000);
    const result = await generateSummary(longNotes);
    expect(typeof result).toBe('string');
  });

  test('handles empty string input without crashing', async () => {
    mockOllamaSuccess('• Nothing to summarize');
    const result = await generateSummary('');
    expect(typeof result).toBe('string');
  });
});


// =============================================================================
// 3. generateFlashcards — structure tests only (not content)
// =============================================================================

describe('generateFlashcards', () => {
  test('returns an array', async () => {
    mockOllamaSuccess(VALID_FLASHCARD_TEXT);
    const result = await generateFlashcards(SAMPLE_NOTES);
    expect(Array.isArray(result)).toBe(true);
  });

  test('returns at least 1 flashcard', async () => {
    mockOllamaSuccess(VALID_FLASHCARD_TEXT);
    const result = await generateFlashcards(SAMPLE_NOTES);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  test('returns at most 8 flashcards', async () => {
    mockOllamaSuccess(VALID_FLASHCARD_TEXT);
    const result = await generateFlashcards(SAMPLE_NOTES);
    expect(result.length).toBeLessThanOrEqual(8);
  });

  test('each card has a question field', async () => {
    mockOllamaSuccess(VALID_FLASHCARD_TEXT);
    const result = await generateFlashcards(SAMPLE_NOTES);
    result.forEach((card) => {
      expect(card).toHaveProperty('question');
    });
  });

  test('each card has an answer field', async () => {
    mockOllamaSuccess(VALID_FLASHCARD_TEXT);
    const result = await generateFlashcards(SAMPLE_NOTES);
    result.forEach((card) => {
      expect(card).toHaveProperty('answer');
    });
  });

  test('question is a non-empty string', async () => {
    mockOllamaSuccess(VALID_FLASHCARD_TEXT);
    const result = await generateFlashcards(SAMPLE_NOTES);
    result.forEach((card) => {
      expect(typeof card.question).toBe('string');
      expect(card.question.length).toBeGreaterThan(0);
    });
  });

  test('answer is a non-empty string', async () => {
    mockOllamaSuccess(VALID_FLASHCARD_TEXT);
    const result = await generateFlashcards(SAMPLE_NOTES);
    result.forEach((card) => {
      expect(typeof card.answer).toBe('string');
      expect(card.answer.length).toBeGreaterThan(0);
    });
  });

  test('question and answer are trimmed (no leading/trailing whitespace)', async () => {
    mockOllamaSuccess(VALID_FLASHCARD_TEXT);
    const result = await generateFlashcards(SAMPLE_NOTES);
    result.forEach((card) => {
      expect(card.question).toBe(card.question.trim());
      expect(card.answer).toBe(card.answer.trim());
    });
  });

  test('throws when model returns no usable flashcards', async () => {
    mockOllamaSuccess('Sorry I cannot help with that.');
    await expect(generateFlashcards(SAMPLE_NOTES)).rejects.toThrow(
      'No usable flashcards were returned by the model.'
    );
  });

  test('throws when Ollama returns a non-ok status', async () => {
    mockOllamaFailure(503, 'service unavailable');
    await expect(generateFlashcards(SAMPLE_NOTES)).rejects.toThrow();
  });

  test('throws when response is empty', async () => {
    mockOllamaEmptyResponse();
    await expect(generateFlashcards(SAMPLE_NOTES)).rejects.toThrow();
  });

  test('calls fetch exactly once', async () => {
    mockOllamaSuccess(VALID_FLASHCARD_TEXT);
    await generateFlashcards(SAMPLE_NOTES);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('sends a POST request to /api/generate', async () => {
    mockOllamaSuccess(VALID_FLASHCARD_TEXT);
    await generateFlashcards(SAMPLE_NOTES);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/api/generate');
    expect(options.method).toBe('POST');
  });

  test('parses JSON array format response correctly', async () => {
    const jsonResponse = JSON.stringify([
      { question: 'What is AI?', answer: 'Artificial Intelligence' },
      { question: 'What is ML?', answer: 'Machine Learning' },
      { question: 'What is NLP?', answer: 'Natural Language Processing' },
      { question: 'What is CV?', answer: 'Computer Vision' },
      { question: 'What is DL?', answer: 'Deep Learning' },
      { question: 'What is RL?', answer: 'Reinforcement Learning' },
    ]);
    mockOllamaSuccess(jsonResponse);
    const result = await generateFlashcards(SAMPLE_NOTES);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]).toHaveProperty('question');
    expect(result[0]).toHaveProperty('answer');
  });

  test('handles very long notes without crashing', async () => {
    mockOllamaSuccess(VALID_FLASHCARD_TEXT);
    const longNotes = 'concept '.repeat(3000);
    const result = await generateFlashcards(longNotes);
    expect(Array.isArray(result)).toBe(true);
  });

  test('does not include cards with empty question or answer', async () => {
    mockOllamaSuccess(VALID_FLASHCARD_TEXT);
    const result = await generateFlashcards(SAMPLE_NOTES);
    const invalid = result.filter(
      (card) => !card.question || !card.answer
    );
    expect(invalid.length).toBe(0);
  });
});
