/**
 * UPLOADED FILE EXTRAPOLATED DATA MANIPULATION:
 *  - edit history appending
 *  - file deletion
 *  - study aid generation requests
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const UploadedFile = require('../models/UploadedFile');
const User = require('../models/User');
const { generateSummary, generateFlashcards, generateQuiz, getOllamaConfig } = require('../services/ollama');

function requireOwnedFile(file, userId) {
  if (!file) return { err: 'File not found', status: 404 };
  if (file.userID.toString() !== userId) return { err: 'Access denied', status: 403 };
  return null;
}

function normalizeFlashCards(cards = []) {
  return cards
    .map((card, index) => ({
      cardId: String(card?.cardId || card?.id || `card-${index + 1}`),
      question: String(card?.question || '').trim(),
      answer: String(card?.answer || '').trim(),
    }))
    .filter((card) => card.question && card.answer);
}

function getSourceText(file, sourceText) {
  const candidate = typeof sourceText === 'string' && sourceText.trim()
    ? sourceText
    : file.currentContent?.transcribedText || file.extractionData?.rawText || '';

  return String(candidate || '').trim();
}

async function applyTextEdit(fileId, userId, field, historyKey, { previousText, newText, selectionStart, selectionEnd }) {
  const file = await UploadedFile.findById(fileId);
  const access = requireOwnedFile(file, userId);
  if (access) return access;

  file.editHistory[historyKey].push({
    previousText: previousText ?? (file.currentContent[field] || ''),
    newText,
    selectionStart: selectionStart ?? null,
    selectionEnd: selectionEnd ?? null,
    editedAt: new Date(),
    editedBy: userId,
  });
  file.currentContent[field] = newText;
  file.currentContent.lastUpdated = new Date();
  await file.save();
  return { file };
}

async function generateRequestedContent(file, userId, contentType, sourceText) {
  const valid = ['summary', 'flashCards', 'quiz', 'all'];
  if (!valid.includes(contentType)) {
    return { err: `contentType must be one of: ${valid.join(', ')}`, status: 400 };
  }

  const source = getSourceText(file, sourceText);
  if (!source) {
    return {
      err: 'No note text is available yet. Save OCR text first or provide text from the current editor before generating AI content.',
      status: 400,
    };
  }

  const entry = {
    requestedAt: new Date(),
    requestedBy: userId,
    contentType,
    basedOnText: source,
    status: 'pending',
  };

  file.regenerationLog.push(entry);
  const logEntry = file.regenerationLog[file.regenerationLog.length - 1];

  try {
    const generated = {};
    if (contentType === 'quiz' || contentType === 'all') {
      const questions = await generateQuiz(source);
      const normalizedQuiz = questions.map((q, i) => ({
        itemId:        q.itemId || `q${Date.now()}-${i + 1}`,
        question:      q.question,
        options:       q.options,
        correctAnswer: q.correctAnswer,
        explanation:   q.explanation,
      }));
        generated.quiz = normalizedQuiz;
        file.aiGeneratedContent.quiz = normalizedQuiz;
        file.currentContent.quiz = normalizedQuiz;
    }

    if (contentType === 'summary' || contentType === 'all') {
      generated.summary = await generateSummary(source);
      file.aiGeneratedContent.summary = generated.summary;
      file.currentContent.summary = generated.summary;
    }

    if (contentType === 'flashCards' || contentType === 'all') {
      const cards = await generateFlashcards(source);
      const normalizedCards = normalizeFlashCards(cards.map((card, index) => ({
        cardId: card.cardId || `card-${Date.now()}-${index + 1}`,
        question: card.question,
        answer: card.answer,
      })));

      generated.flashCards = normalizedCards;
      file.aiGeneratedContent.flashCards = normalizedCards;
      file.currentContent.flashCards = normalizedCards;
    }

    file.aiGeneratedContent.aiEngine = `ollama/${getOllamaConfig().model}`;
    file.aiGeneratedContent.generatedAt = new Date();
    file.currentContent.lastUpdated = new Date();
    logEntry.status = 'completed';
    await file.save();

    return {
      file,
      generated,
      entry: logEntry,
    };
  } catch (err) {
    logEntry.status = 'failed';
    file.processingError = err.message;
    await file.save();
    return { err: `AI generation failed: ${err.message}`, status: 502 };
  }
}

// ____________________________________________________
// TO HANDLE FILE USER UPLOADING:
// @route   POST /api/files/upload
// ____________________________________________________
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    const userId = req.user.id;
    const uploadId = req.uploadId;

    const newFile = new UploadedFile({
      uploadId,
      userID: userId,
      originalName: req.file.originalname,
      fileType: req.file.mimetype.startsWith('image/') ? 'image' : 'pdf',
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      fileLocation: path.join('uploads', userId, uploadId, req.file.originalname),
      folderPath: `${userId}/${uploadId}`,
      contentType: req.file.mimetype === 'application/pdf' ? 'pdf' : 'unknown',
      status: 'uploaded',
      title: req.file.originalname.replace(/\.[^/.]+$/, ''),
      currentContent: { transcribedText: '', summary: '', studyGuide: '', flashCards: [], quiz: [] },
    });

    const saved = await newFile.save();
    await User.findByIdAndUpdate(userId, { $push: { fileUploads: saved._id } });

    res.status(201).json(saved);
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ msg: 'Server error during upload' });
  }
});

// ____________________________________________________
// GET FILE LIST, LIGHT&FAST:
// just list, no edit history, raw text, etc...
// @route   GET /api/files
// ____________________________________________________
router.get('/', auth, async (req, res) => {
  try {
    //const files = await UploadedFile.find({ userID: req.user.id })
    const files = await UploadedFile.find({ userID: req.user.id, isDeleted: { $ne: true } })
      .sort({ uploadDate: -1 })
      .select('-editHistory -extractionData.rawText -aiGeneratedContent');
    res.json(files);
  } catch (err) {
    console.error('List files error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ____________________________________________________
// TRASH
// @route   GET /api/files/trash
// ____________________________________________________
router.get('/trash', auth, async (req, res) => {
  try {
    const files = await UploadedFile.find({ userID: req.user.id, isDeleted: true })
      .sort({ uploadDate: -1 })
      .select('-editHistory -extractionData.rawText -aiGeneratedContent');
    res.json(files);
  } catch (err) {
    console.error('Trash list error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ____________________________________________________
// GET ENTIRE DOCUMENT, HEAVY:
// full document w/ fixins
// @route   GET /api/files/:id
// ____________________________________________________
router.get('/:id', auth, async (req, res) => {
  try {
    const file = await UploadedFile.findById(req.params.id);
    const access = requireOwnedFile(file, req.user.id);
    if (access) return res.status(access.status).json({ msg: access.err });
    res.json(file);
  } catch (err) {
    console.error('Get file error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ____________________________________________________
// PARTIAL METADATA:
// title, tags, favorite
// @route   PATCH /api/files/:id/meta
// ____________________________________________________
router.patch('/:id/meta', auth, async (req, res) => {
  try {
    const file = await UploadedFile.findById(req.params.id);
    const access = requireOwnedFile(file, req.user.id);
    if (access) return res.status(access.status).json({ msg: access.err });

    const { title, tags, isFavorite, isDeleted, folderId } = req.body;
    if (title !== undefined) file.title = title;
    if (tags !== undefined) file.tags = tags;
    if (isFavorite !== undefined) file.isFavorite = isFavorite;
    if (isDeleted !== undefined) file.isDeleted = isDeleted;
    if (folderId  !== undefined) file.folderId  = folderId;
    await file.save();
    res.json(file);
  } catch (err) {
    console.error('Meta error:', err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'File not found' });
      }
    res.status(500).json({ msg: 'Server error' });
  }
});

// ____________________________________________________
// ADD TRANSCRIPTION
// @route   PUT /api/files/:id/edit/transcription
// ____________________________________________________
router.put('/:id/edit/transcription', auth, async (req, res) => {
  if (req.body.newText === undefined) return res.status(400).json({ msg: 'newText is required' });
  const { err, status, file } = await applyTextEdit(
    req.params.id, req.user.id, 'transcribedText', 'transcriptionEdits', req.body
  );
  if (err) return res.status(status).json({ msg: err });
  res.json({ currentContent: file.currentContent, editCount: file.editHistory.transcriptionEdits.length });
});

// ____________________________________________________
// ADD SUMMARIZATION
// @route   PUT /api/files/:id/edit/summary
// ____________________________________________________
router.put('/:id/edit/summary', auth, async (req, res) => {
  if (req.body.newText === undefined) return res.status(400).json({ msg: 'newText is required' });
  const { err, status, file } = await applyTextEdit(
    req.params.id, req.user.id, 'summary', 'summaryEdits', req.body
  );
  if (err) return res.status(status).json({ msg: err });
  res.json({ currentContent: file.currentContent, editCount: file.editHistory.summaryEdits.length });
});

// ____________________________________________________
// ADD STUDY GUIDE
// @route   PUT /api/files/:id/edit/studyguide
// ____________________________________________________
router.put('/:id/edit/studyguide', auth, async (req, res) => {
  if (req.body.newText === undefined) return res.status(400).json({ msg: 'newText is required' });
  const { err, status, file } = await applyTextEdit(
    req.params.id, req.user.id, 'studyGuide', 'studyGuideEdits', req.body
  );
  if (err) return res.status(status).json({ msg: err });
  res.json({ currentContent: file.currentContent });
});

// ____________________________________________________
// REPLACE FLASHCARDS ARRAY
// @route   PUT /api/files/:id/edit/flashcards
// ____________________________________________________
router.put('/:id/edit/flashcards', auth, async (req, res) => {
  if (!Array.isArray(req.body.cards)) {
    return res.status(400).json({ msg: 'cards must be an array' });
  }

  try {
    const file = await UploadedFile.findById(req.params.id);
    const access = requireOwnedFile(file, req.user.id);
    if (access) return res.status(access.status).json({ msg: access.err });

    const nextCards = normalizeFlashCards(req.body.cards);
    file.currentContent.flashCards = nextCards;
    file.currentContent.lastUpdated = new Date();
    await file.save();

    res.json({ currentContent: file.currentContent });
  } catch (err) {
    console.error('Edit flashcards error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ____________________________________________________
// ADD FLASHCARD
// @route   PUT /api/files/:id/edit/flashcard
// ____________________________________________________
router.put('/:id/edit/flashcard', auth, async (req, res) => {
  const { cardId, field, previousText, newText } = req.body;
  if (!cardId || !field || newText === undefined) {
    return res.status(400).json({ msg: 'cardId, field, and newText are required' });
  }

  if (!['question', 'answer'].includes(field)) {
    return res.status(400).json({ msg: 'field must be question or answer' });
  }

  try {
    const file = await UploadedFile.findById(req.params.id);
    const access = requireOwnedFile(file, req.user.id);
    if (access) return res.status(access.status).json({ msg: access.err });

    file.editHistory.flashCardEdits.push({
      cardId,
      field,
      previousText: previousText ?? '',
      newText,
      editedAt: new Date(),
      editedBy: req.user.id,
    });

    const card = file.currentContent.flashCards.find((c) => c.cardId === cardId);
    if (card) card[field] = newText;
    file.currentContent.lastUpdated = new Date();
    await file.save();

    res.json({ currentContent: file.currentContent });
  } catch (err) {
    console.error('Edit flashcard error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ____________________________________________________
// ADD QUIZZES
// @route   PUT /api/files/:id/edit/quiz
// ____________________________________________________
router.put('/:id/edit/quiz', auth, async (req, res) => {
  const { itemId, field, previousText, newText } = req.body;
  if (!itemId || !field || newText === undefined) {
    return res.status(400).json({ msg: 'itemId, field, and newText are required' });
  }
  try {
    const file = await UploadedFile.findById(req.params.id);
    const access = requireOwnedFile(file, req.user.id);
    if (access) return res.status(access.status).json({ msg: access.err });

    file.editHistory.quizEdits.push({ itemId, field, previousText: previousText ?? '', newText, editedAt: new Date(), editedBy: req.user.id });
    const item = file.currentContent.quiz.find((q) => q.itemId === itemId);
    if (item) item[field] = newText;
    file.currentContent.lastUpdated = new Date();
    await file.save();
    res.json({ currentContent: file.currentContent });
  } catch (err) {
    console.error('Edit quiz error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ____________________________________________________
// GET FULL EDIT HISTORY (APPENDED-ONLY)
// @route   GET /api/files/:id/edits
// ____________________________________________________
router.get('/:id/edits', auth, async (req, res) => {
  try {
    const file = await UploadedFile.findById(req.params.id).select('editHistory userID');
    const access = requireOwnedFile(file, req.user.id);
    if (access) return res.status(access.status).json({ msg: access.err });
    res.json(file.editHistory);
  } catch (err) {
    console.error('Get edits error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

async function handleGenerateRequest(req, res) {
  const { contentType, sourceText } = req.body || {};

  try {
    const file = await UploadedFile.findById(req.params.id);
    const access = requireOwnedFile(file, req.user.id);
    if (access) return res.status(access.status).json({ msg: access.err });

    const result = await generateRequestedContent(file, req.user.id, contentType, sourceText);
    if (result.err) return res.status(result.status).json({ msg: result.err });

    res.json({
      msg: 'AI content generated successfully.',
      entry: result.entry,
      currentContent: result.file.currentContent,
      aiGeneratedContent: result.file.aiGeneratedContent,
    });
  } catch (err) {
    console.error('Generate AI error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
}

// ____________________________________________________
// MANUAL AI GENERATION
// @route   POST /api/files/:id/generate
// ____________________________________________________
router.post('/:id/generate', auth, handleGenerateRequest);

// ____________________________________________________
// REGENERATE ALIAS
// @route   POST /api/files/:id/regenerate
// ____________________________________________________
router.post('/:id/regenerate', auth, (req, res) => {
  req.body = {
    ...(req.body || {}),
    contentType: req.body?.contentType || 'all',
  };
  return handleGenerateRequest(req, res);
});

// ____________________________________________________
// FILE DELETION HANDLER
// @route   DELETE /api/files/:id
// ____________________________________________________
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await UploadedFile.findById(req.params.id);
    const access = requireOwnedFile(file, req.user.id);
    if (access) return res.status(access.status).json({ msg: access.err });

    const folder = path.join(__dirname, '..', 'uploads', file.userID.toString(), file.uploadId);
    if (fs.existsSync(folder)) fs.rmSync(folder, { recursive: true, force: true });

    await UploadedFile.findByIdAndDelete(req.params.id);
    await User.findByIdAndUpdate(req.user.id, { $pull: { fileUploads: file._id } });
    res.json({ msg: 'File deleted' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
