/**
 * Upload MDB doc/schema:
 *  - File metadata;
 *  - Original extraction data;
 *  - Manual User edits. */

const mongoose = require('mongoose');

// ____________________________________________________
// FLASHCARDS DB
// ____________________________________________________
const FlashCardSchema = new mongoose.Schema({
  cardId:   { type: String },
  question: { type: String, default: '' },
  answer:   { type: String, default: '' },
}, { _id: false });

// ____________________________________________________
// QUIZZES DB
// ____________________________________________________
const QuizItemSchema = new mongoose.Schema({
  itemId:        { type: String },
  question:      { type: String, default: '' },
  options:       [{ type: String }],
  correctAnswer: { type: String, default: '' },
  explanation:   { type: String, default: '' },
}, { _id: false });

// ____________________________________________________
// USER EDITS DB
// ____________________________________________________
const EditRecordSchema = new mongoose.Schema({
  previousText:   { type: String, required: true },
  newText:        { type: String, required: true },
  selectionStart: { type: Number, default: null },
  selectionEnd:   { type: Number, default: null },
  editedAt:       { type: Date, default: Date.now },
  editedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

// ____________________________________________________
// FILE UPLOADS DB
// ____________________________________________________
const UploadedFileSchema = new mongoose.Schema({
  uploadId: { type: String, required: true, unique: true, index: true },
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // ..................................................
  // Metadata
  // ..................................................
  originalName: { type: String, required: true },
  fileType:     { type: String, required: true },   // for general filetypes: 'image' || 'text'
  mimeType:     { type: String, required: true },   // file extension: image/jpeg || text/pdf
  fileSize:     { type: Number, required: true },
  fileLocation: { type: String, required: true },   // /uploads/<userId>/<uploadId>/<filename>
  folderPath:   { type: String, required: true },   // /<userId>/<uploadId>
  uploadDate:   { type: Date, default: Date.now },
  title:        { type: String, default: '' },
  tags:         [{ type: String }],
  isFavorite:   { type: Boolean, default: false },
  isDeleted:    { type: Boolean, default: false },
  folderId:     { type: String,  default: null  },
  pageCount:    { type: Number, default: 1 },

  // ..................................................
  // For OCR to classify post-processing
  // ..................................................
  contentType: {
    type: String,
    enum: ['handwritten', 'typed', 'mixed', 'pdf', 'unknown'],
    default: 'unknown',
  },

  // ..................................................
  // Processing steps/pipeline
  // ..................................................
  status: {
    type: String,
    enum: ['uploaded', 'queued', 'preprocessing', 'ocr_processing', 'ai_processing', 'completed', 'failed'],
    default: 'uploaded',
  },
  processingError:       { type: String, default: '' },
  processingStartedAt:   { type: Date },
  processingCompletedAt: { type: Date },

  // ..................................................
  // To store the OG OCR output. DOES NOT GET OVERWRITTEN
  // ..................................................
  extractionData: {
    rawText:              { type: String, default: '' },
    extractionAccuracy:   { type: Number, default: null },
    detectedLanguage:     { type: String, default: '' },
    // >>> FUTURE INTEGRATION GOES HERE: paddle, trocr, etc.
    ocrEngine:            { type: String, default: '' },   // 'paddleocr' || 'trocr'
    ocrVersion:           { type: String, default: '' },
    processingDurationMs: { type: Number, default: null },
    pageBreaks:           [{ page: Number, charOffset: Number }],
  },

  // ..................................................
  // To store OG AI summary/study guides. DOES NOT GET OVERWRITTEN
  // ..................................................
  aiGeneratedContent: {
    summary:     { type: String, default: '' },
    studyGuide:  { type: String, default: '' },
    flashCards:  [FlashCardSchema],
    quiz:        [QuizItemSchema],
    // >>> FUTURE INTEGRATION GOES HERE: ollama, kimi, deepseek, build-in paddleocr tools, etc.
    aiEngine:    { type: String, default: '' },         // 'ollama/mistral' || 'llama3' || 'kimi' ??
    generatedAt: { type: Date },
  },

  // ..................................................
  // Live display state to show latest user edits
  // To be seeded from extraction/AI on completion
  // ..................................................
  currentContent: {
    transcribedText: { type: String, default: '' },
    summary:         { type: String, default: '' },
    studyGuide:      { type: String, default: '' },
    flashCards:      [FlashCardSchema],
    quiz:            [QuizItemSchema],
    lastUpdated:     { type: Date },
  },

  // ..................................................
  // Edit history. Append only.
  // NOTHING IS DELETED OR OVERWRITTEN
  // ..................................................
  editHistory: {
    transcriptionEdits: [EditRecordSchema],
    summaryEdits:       [EditRecordSchema],
    studyGuideEdits:    [EditRecordSchema],
    flashCardEdits: [{
      cardId:       String,
      field:        { type: String, enum: ['question', 'answer'] },
      previousText: String,
      newText:      String,
      editedAt:     { type: Date, default: Date.now },
      editedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    }],
    quizEdits: [{
      itemId:       String,
      field:        String,
      previousText: String,
      newText:      String,
      editedAt:     { type: Date, default: Date.now },
      editedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    }],
  },

  // ..................................................
  // Log of post-edit regen requests:
  //    If an edit is made to the summary or extracted text,
  //    user needs to regenerate study aids output.
  // ..................................................
  regenerationLog: [{
    requestedAt:  { type: Date, default: Date.now },
    requestedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    contentType:  { type: String, enum: ['summary', 'studyGuide', 'flashCards', 'quiz', 'all'] },
    basedOnText:  { type: String },
    status:       { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  }],

}, { timestamps: true });

module.exports = mongoose.model('UploadedFile', UploadedFileSchema);