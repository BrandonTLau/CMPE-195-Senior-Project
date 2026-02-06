/**
 * Upload schema:
 *  1. File metadata;
 *  2. Original extraction data;
 *  3. Manual User edits.
 */

const mongoose = require('mongoose');

const UploadedFileSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Indexed for fast retrieval by user
  },
  // File Metadata
  originalName: { type: String, required: true },
  fileType: { type: String, required: true }, // 'application/pdf', 'image/jpeg'
  fileLocation: { type: String, required: true }, // Local path on disk
  fileSize: { type: Number, required: true },
  uploadDate: { type: Date, default: Date.now },
  
  // Processing Status
  status: { 
    type: String, 
    enum: ['uploaded', 'processing', 'completed', 'failed'], 
    default: 'uploaded' 
  },

  // OCR & Extraction Data (Machine Generated)
  extractionData: {
    rawText: { type: String, default: '' }, // Raw OCR output
    extractionAccuracy: { type: Number }, // Confidence score from OCR
    detectedLanguage: { type: String },
    
    // AI Generated Content
    summary: { type: String, default: '' },
    flashCards: [{
      question: String,
      answer: String
    }],
    studyGuide: { type: String, default: '' }
  },

  // User Edits (Human Modified)
  // Stores changes while keeping extractionData intact
  userEdits: {
    editedText: { type: String },
    editedSummary: { type: String },
    editedFlashCards: [{
      question: String,
      answer: String
    }],
    lastEdited: { type: Date }
  }
});

module.exports = mongoose.model('UploadedFile', UploadedFileSchema);
