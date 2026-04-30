const DEFAULT_BASE_URL = process.env.OLLAMA_API_URL || process.env.LLM_API_URL || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || process.env.LLM_MODEL || 'gemma3:1b';
const DEFAULT_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 120000);

const AI_PROVIDER = (process.env.AI_PROVIDER || 'ollama').toLowerCase();
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama3-8b-8192';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_BASE_URL = 'https://api.openai.com/v1/chat/completions';

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

async function callGroq(prompt) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set.');
  }

  const response = await fetch(GROQ_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 2048,
    }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error('Groq returned an unreadable response.');
  }

  if (!response.ok) {
    throw new Error(data?.error?.message || `Groq request failed (${response.status}).`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Groq returned an empty response.');
  }

  return String(content).trim();
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

async function callOpenAI(prompt) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set.');
  }

  const response = await fetch(OPENAI_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 2048,
    }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error('OpenAI returned an unreadable response.');
  }

  if (!response.ok) {
    throw new Error(data?.error?.message || `OpenAI request failed (${response.status}).`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned an empty response.');
  }

  return String(content).trim();
}

// Route to OpenAI, Groq, or Ollama based on AI_PROVIDER env var
async function callAI(prompt, options = {}) {
  if (AI_PROVIDER === 'openai') {
    return callOpenAI(prompt);
  }
  if (AI_PROVIDER === 'groq') {
    return callGroq(prompt);
  }
  return callOllama(prompt, options);
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

function parseFlashcardsFromText(text) {
  const cleaned = stripCodeFences(String(text || ''))
    .replace(/\r\n/g, '\n')
    .trim();

  try {
    const parsed = parseJsonPayload(cleaned);
    const cards = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.flashCards)
        ? parsed.flashCards
        : [];

    if (cards.length) return cards;
  } catch (_) {
  }

  const blocks = cleaned
    .split(/\n\s*---+\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);

  const cards = [];
  for (const block of blocks) {
    const qMatch = block.match(/(?:^|\n)Q(?:uestion)?\s*:\s*([\s\S]*?)(?=\nA(?:nswer)?\s*:|$)/i);
    const aMatch = block.match(/(?:^|\n)A(?:nswer)?\s*:\s*([\s\S]*?)$/i);

    if (qMatch && aMatch) {
      cards.push({
        question: qMatch[1].trim(),
        answer: aMatch[1].trim(),
      });
    }
  }

  if (!cards.length) {
    const lines = cleaned
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    for (let i = 0; i < lines.length - 1; i += 1) {
      const qMatch = lines[i].match(/^Q(?:uestion)?\s*:\s*(.+)$/i);
      const aMatch = lines[i + 1].match(/^A(?:nswer)?\s*:\s*(.+)$/i);

      if (qMatch && aMatch) {
        cards.push({
          question: qMatch[1].trim(),
          answer: aMatch[1].trim(),
        });
      }
    }
  }

  return cards;
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

  return callAI(prompt);
}

async function generateFlashcards(text) {
  const context = buildContextWindow(text, Number(process.env.OLLAMA_SOURCE_MAX_CHARS || 7000));
  const prompt = [
    'Create 6 to 8 high-quality study flashcards from the notes below.',
    'Return plain text only.',
    'Use exactly this format for every card:',
    'Q: <question>',
    'A: <answer>',
    '---',
    'Rules:',
    '- Each question must be specific and answerable from the notes.',
    '- Each answer must be concise, correct, and self-contained.',
    '- Do not include numbering, markdown, commentary, or JSON.',
    '- Do not leave any card incomplete.',
    '',
    'NOTES:',
    context,
  ].join('\n');

  const raw = await callAI(prompt);
  const cards = parseFlashcardsFromText(raw);

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

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function generateQuiz(text) {
  const cleanText = stripHtml(text); 
  const context = buildContextWindow(cleanText, Number(process.env.OLLAMA_SOURCE_MAX_CHARS || 7000)); 
  const count = Math.floor(Math.random() * 5) + 3;
  const prompt = [
  `Create ${count} multiple choice quiz questions based strictly on the notes below.`,
  'Return a JSON array only. No explanation, no markdown, no code fences.',
  'Each item must follow this exact shape:',
  '{ "itemId": "q1", "question": "<question based on the notes>", "options": ["<option 1>", "<option 2>", "<option 3>", "<option 4>"], "correctAnswer": "<exact text of correct option>", "explanation": "<one sentence explanation>" }',
  'Rules:',
  '- ALL questions must come directly from the notes below, do not invent topics',
  '- options must have exactly 4 full sentence or phrase answers, NOT letters like A B C D',
  '- correctAnswer must be the exact text of the correct option copied verbatim',
  '- explanation must be 1 sentence explaining why the answer is correct',
  '',
  'NOTES:',
  context,
].join('\n');

  const raw = await callAI(prompt);
  const parsed = parseJsonPayload(raw);
  const questions = Array.isArray(parsed) ? parsed : [];

  return questions
    .map((q, i) => ({
      itemId:        q.itemId || `q${i + 1}`,
      question:      String(q.question || '').trim(),
      options:       Array.isArray(q.options) ? q.options.map(String) : [],
      correctAnswer: String(q.correctAnswer || '').trim(),
      explanation:   String(q.explanation || '').trim(),
    }))
    .filter(q => q.question && q.options.length === 4 && q.correctAnswer)
    .slice(0, count);
}

module.exports = {
  getOllamaConfig,
  generateSummary,
  generateFlashcards,
  generateQuiz,
};