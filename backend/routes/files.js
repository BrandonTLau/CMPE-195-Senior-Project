/**
 * UPLOADED FILE EXTRAPOLATED DATA MANIPULATION:
 *  - edit history apending
 *  - file deletion
 *  - study aid regeneration requests */

const express = require('express');
const router = express.Router();
const path    = require('path');
const fs      = require('fs');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const UploadedFile = require('../models/UploadedFile');
const User = require('../models/User');

// ____________________________________________________
// TO HANDLE FILE USER UPLOADING:
// @route   POST /api/files/upload
// ____________________________________________________
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    const userId   = req.user.id;
    const uploadId = req.uploadId;

    const newFile = new File({
      uploadId,
      userID:       userId,
      originalName: req.file.originalname,
      fileType:     req.file.mimetype.startsWith('image/') ? 'image' : 'pdf',
      mimeType:     req.file.mimetype,
      fileSize:     req.file.size,
      fileLocation: path.join('uploads', userId, uploadId, req.file.originalname),
      folderPath:   `${userId}/${uploadId}`,
      contentType:  req.file.mimetype === 'application/pdf' ? 'pdf' : 'unknown',
      status:       'uploaded',
      title:        req.file.originalname.replace(/\.[^/.]+$/, ''),
      currentContent: { transcribedText: '', summary: '', studyGuide: '', flashCards: [], quiz: [] },
    });

    const saved = await newFile.save();
    await User.findByIdAndUpdate(userId, { $push: { fileUploads: saved._id } });

    /** >>> FUTURE INTEGRATIONS GO HERE: 
     * trigger OCR/AI pipeline:
     *  - const { spawn } = require('child_process');
     *  - spawn('python3', [path.join(__dirname, '..', 'integrations', 'pipeline.py'), saved._id.toString(), req.file.path]);
    */

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
    const files = await File.find({ userID: req.user.id })
      .sort({ uploadDate: -1 })
      .select('-editHistory -extractionData.rawText -aiGeneratedContent');
    res.json(files);
  } catch (err) {
    console.error('List files error:', err.message);
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
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ msg: 'File not found' });
    if (file.userID.toString() !== req.user.id) return res.status(403).json({ msg: 'Access denied' });
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
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ msg: 'File not found' });
    if (file.userID.toString() !== req.user.id) return res.status(403).json({ msg: 'Access denied' });
    const { title, tags, isFavorite } = req.body;
    if (title      !== undefined) file.title      = title;
    if (tags       !== undefined) file.tags       = tags;
    if (isFavorite !== undefined) file.isFavorite = isFavorite;
    await file.save();
    res.json(file);
  } catch (err) {
    console.error('Meta error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ____________________________________________________
// TO HANDLE REAL-TIME USER EDIT:
// shared helper fx;
// appends an edit record, updates currentContent field
// ____________________________________________________
async function applyTextEdit(fileId, userId, field, historyKey, { previousText, newText, selectionStart, selectionEnd }) {
  const file = await File.findById(fileId);
  if (!file) return { err: 'File not found', status: 404 };
  if (file.userID.toString() !== userId) return { err: 'Access denied', status: 403 };

  file.editHistory[historyKey].push({
    previousText: previousText ?? (file.currentContent[field] || ''),
    newText,
    selectionStart: selectionStart ?? null,
    selectionEnd:   selectionEnd   ?? null,
    editedAt: new Date(),
    editedBy: userId,
  });
  file.currentContent[field]       = newText;
  file.currentContent.lastUpdated  = new Date();
  await file.save();
  return { file };
}
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

// -------------------- STUDY AIDS --------------------
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
// ADD FLASHCARDS
// @route   PUT /api/files/:id/edit/flashcard
// ____________________________________________________
router.put('/:id/edit/flashcard', auth, async (req, res) => {
  const { cardId, field, previousText, newText } = req.body;
  if (!cardId || !field || newText === undefined) {
    return res.status(400).json({ msg: 'cardId, field, and newText are required' });
  }
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ msg: 'File not found' });
    if (file.userID.toString() !== req.user.id) return res.status(403).json({ msg: 'Access denied' });

    file.editHistory.flashCardEdits.push({ cardId, field, previousText: previousText ?? '', newText, editedAt: new Date(), editedBy: req.user.id });
    const card = file.currentContent.flashCards.find(c => c.cardId === cardId);
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
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ msg: 'File not found' });
    if (file.userID.toString() !== req.user.id) return res.status(403).json({ msg: 'Access denied' });

    file.editHistory.quizEdits.push({ itemId, field, previousText: previousText ?? '', newText, editedAt: new Date(), editedBy: req.user.id });
    const item = file.currentContent.quiz.find(q => q.itemId === itemId);
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
    const file = await File.findById(req.params.id).select('editHistory userID');
    if (!file) return res.status(404).json({ msg: 'File not found' });
    if (file.userID.toString() !== req.user.id) return res.status(403).json({ msg: 'Access denied' });
    res.json(file.editHistory);
  } catch (err) {
    console.error('Get edits error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ____________________________________________________
// LOG OF STUDY AID REGENERATION REQUEST HISTORY:
// Left room for AI worker to grab it, once integrated.
// @route   POST /api/files/:id/regenerate
// ____________________________________________________
router.post('/:id/regenerate', auth, async (req, res) => {
  const { contentType } = req.body;
  const valid = ['summary', 'studyGuide', 'flashCards', 'quiz', 'all'];
  if (!contentType || !valid.includes(contentType)) {
    return res.status(400).json({ msg: `contentType must be one of: ${valid.join(', ')}` });
  }
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ msg: 'File not found' });
    if (file.userID.toString() !== req.user.id) return res.status(403).json({ msg: 'Access denied' });

    const entry = {
      requestedAt: new Date(),
      requestedBy: req.user.id,
      contentType,
      basedOnText: file.currentContent.transcribedText || file.extractionData?.rawText || '',
      status: 'pending',
    };
    file.regenerationLog.push(entry);
    await file.save();

    /**
     * FOR FUTURE AI WORKER INTEGRATION: 
     * dispatch AI job here:
     *  - await aiQueue.add({ fileId: file._id, contentType, text: entry.basedOnText });
     */

    res.json({ msg: 'Regeneration queued. AI integration pending.', entry, currentContent: file.currentContent });
  } catch (err) {
    console.error('Regenerate error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ____________________________________________________
// FILE DELETION HANDLER
// @route   DELETE /api/files/:id
// ____________________________________________________
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ msg: 'File not found' });
    if (file.userID.toString() !== req.user.id) return res.status(403).json({ msg: 'Access denied' });

    const folder = path.join(__dirname, '..', 'uploads', file.userID.toString(), file.uploadId);
    if (fs.existsSync(folder)) fs.rmSync(folder, { recursive: true, force: true });

    await File.findByIdAndDelete(req.params.id);
    await User.findByIdAndUpdate(req.user.id, { $pull: { fileUploads: file._id } });
    res.json({ msg: 'File deleted' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// FUTURE ADDITIONS: 
// PUT /api/files/:id/process  — manually launch OCR and AI features??
// GET /api/files/:id/status   — pipeline progress status updates polling??
// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
module.exports = router;