const DEFAULT_BASE_URL = process.env.OLLAMA_API_URL || process.env.LLM_API_URL || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || process.env.LLM_MODEL || 'gemma3:1b';
const DEFAULT_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 120000);

function getOllamaConfig() {
  return {
    baseUrl: DEFAULT_BASE_URL.replace(/\/$/, ''),
    model: DEFAULT_MODEL,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
}

function normalizeWhitespace(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildContextWindow(text, maxChars = 7000) {
  const cleaned = normalizeWhitespace(text);
  if (cleaned.length <= maxChars) return cleaned;

  const headSize = Math.floor(maxChars * 0.4);
  const middleSize = Math.floor(maxChars * 0.2);
  const tailSize = maxChars - headSize - middleSize;
  const middleStart = Math.max(Math.floor((cleaned.length - middleSize) / 2), headSize);

  return [
    cleaned.slice(0, headSize).trim(),
    cleaned.slice(middleStart, middleStart + middleSize).trim(),
    cleaned.slice(cleaned.length - tailSize).trim(),
  ].filter(Boolean).join('\n\n[... omitted for length ...]\n\n');
}

async function callOllama(prompt, { format } = {}) {
  const { baseUrl, model, timeoutMs } = getOllamaConfig();

  if (typeof fetch !== 'function') {
    throw new Error('Global fetch is not available. Use Node 18+ to call Ollama.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format,
        options: {
          temperature: 0.2,
          top_p: 0.9,
        },
      }),
      signal: controller.signal,
    });

    let data = null;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error('Ollama returned an unreadable response.');
    }

    if (!response.ok) {
      throw new Error(data?.error || `Ollama request failed (${response.status}).`);
    }

    if (!data?.response) {
      throw new Error('Ollama returned an empty response.');
    }

    return String(data.response).trim();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Ollama request timed out.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function stripCodeFences(text) {
  return String(text || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function parseJsonPayload(text) {
  const cleaned = stripCodeFences(text);

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const firstObject = cleaned.match(/\{[\s\S]*\}/);
    if (firstObject) {
      return JSON.parse(firstObject[0]);
    }

    const firstArray = cleaned.match(/\[[\s\S]*\]/);
    if (firstArray) {
      return JSON.parse(firstArray[0]);
    }

    throw new Error('Model did not return valid JSON.');
  }
}

async function generateSummary(text) {
  const context = buildContextWindow(text, Number(process.env.OLLAMA_SOURCE_MAX_CHARS || 7000));
  const prompt = [
    'You are generating a study summary for a student.',
    'Summarize the notes below into 5 to 8 concise bullet points.',
    'Keep it factual and easy to review.',
    'Do not add a title, introduction, or closing sentence.',
    'If the notes are sparse, still produce the best possible bullets from the content provided.',
    '',
    'NOTES:',
    context,
  ].join('\n');

  return callOllama(prompt);
}

async function generateFlashcards(text) {
  const context = buildContextWindow(text, Number(process.env.OLLAMA_SOURCE_MAX_CHARS || 7000));
  const prompt = [
    'Create 6 to 8 high-quality study flashcards from the notes below.',
    'Return valid JSON only.',
    'Use this exact shape:',
    '{"flashCards":[{"question":"...","answer":"..."}]}',
    'Rules:',
    '- Each question must be specific and answerable from the notes.',
    '- Each answer must be concise, correct, and self-contained.',
    '- Do not include numbering, markdown, or commentary.',
    '',
    'NOTES:',
    context,
  ].join('\n');

  const raw = await callOllama(prompt, { format: 'json' });
  const parsed = parseJsonPayload(raw);
  const cards = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.flashCards)
      ? parsed.flashCards
      : [];

  const cleanedCards = cards
    .map((card) => ({
      question: normalizeWhitespace(card?.question),
      answer: normalizeWhitespace(card?.answer),
    }))
    .filter((card) => card.question && card.answer)
    .slice(0, 8);

  if (!cleanedCards.length) {
    throw new Error('No usable flashcards were returned by the model.');
  }

  return cleanedCards;
}

module.exports = {
  getOllamaConfig,
  generateSummary,
  generateFlashcards,
};
