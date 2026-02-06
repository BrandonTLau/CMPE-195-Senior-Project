/**
 * File upload, processing, listing
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const UploadedFile = require('../models/UploadedFile');
const User = require('../models/User');

// @route   POST api/files/upload
// @desc    Upload a file
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    const newFile = new UploadedFile({
      userID: req.user.id,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileLocation: req.file.path,
      fileSize: req.file.size
    });

    const savedFile = await newFile.save();

    // Add reference to User document
    await User.findByIdAndUpdate(req.user.id, {
        $push: { fileUploads: savedFile._id }
    });

    // FUTURE INTEGRATION: Trigger Python script here for OCR/AI processing
    // spawn('python3', ['process_note.py', savedFile._id, req.file.path]);

    res.json(savedFile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/files
// @desc    Get all files for logged in user
router.get('/', auth, async (req, res) => {
  try {
    const files = await UploadedFile.find({ userID: req.user.id }).sort({ uploadDate: -1 });
    res.json(files);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/files/:id/edit
// @desc    Update transcribed text or summary (User Edits)
router.put('/:id/edit', auth, async (req, res) => {
  const { editedText, editedSummary, editedFlashCards } = req.body;
  
  try {
    let file = await UploadedFile.findById(req.params.id);
    if (!file) return res.status(404).json({ msg: 'File not found' });
    
    // Ensure user owns file
    if (file.userID.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    file.userEdits = {
      editedText: editedText || file.userEdits.editedText,
      editedSummary: editedSummary || file.userEdits.editedSummary,
      editedFlashCards: editedFlashCards || file.userEdits.editedFlashCards,
      lastEdited: Date.now()
    };

    await file.save();
    res.json(file);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
