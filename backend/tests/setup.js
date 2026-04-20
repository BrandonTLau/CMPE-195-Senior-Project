process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_do_not_use_in_production';
process.env.JWT_EXPIRES = '1h';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.LLM_ENGINE = 'ollama';
process.env.LLM_MODEL = 'test-model';
process.env.LLM_API_URL = 'http://127.0.0.1:11434';

jest.mock('../services/ollama', () => ({
  generateSummary: jest.fn(async (text) => `MOCK SUMMARY: ${String(text || '').slice(0, 40)}`),
  generateFlashcards: jest.fn(async () => ([
    { cardId: 'card-1', question: 'Mock question 1?', answer: 'Mock answer 1' },
    { cardId: 'card-2', question: 'Mock question 2?', answer: 'Mock answer 2' },
  ])),
  getOllamaConfig: jest.fn(() => ({ model: 'test-model', apiUrl: 'http://127.0.0.1:11434' })),
}), { virtual: true });

afterEach(() => {
  jest.clearAllMocks();
});
