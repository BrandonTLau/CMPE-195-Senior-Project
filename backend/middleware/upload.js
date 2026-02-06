/**
 * Uploaded file storage:
 *  1. Verify file type;
 *  2. Save file into user-specific folder for later retrieval.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create a folder for the specific user if it doesn't exist
    // Note: req.user is populated by the auth middleware
    const userId = req.user ? req.user.id : 'guest'; 
    const dir = `./uploads/${userId}`;

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Save with timestamp to prevent overwrites
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File type validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf', 
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/heic'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, PNG, and HEIC are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit example
});

module.exports = upload;