/**
 * Uploaded file storage:
 *  - Verify file type;
 *  - Save file into user-specific folder for later retrieval. */

const multer = require('multer');
const path = require('path');
//const fs = require('fs'); // leaving for local upload handling
const { v4: uuidv4 } = require('uuid');

// ____________________________________________________
// PERMITTED UPLOAD FILE TYPES && EXTENSIONS
// ____________________________________________________
// >>> add more??? 
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.heic', '.heif'];

// ____________________________________________________
// FILE STORAGE CONFIGURATOR
// ____________________________________________________
// Create a folder for the specific user if it doesn't exist, 
// or place in existing folder structure: /<userId>/<uploadId>/ 
// req.user uuid is populated by the auth middleware before multer run
// BLOCK COMMENTED CODE BELOW HANDLES FILES UPLOADED TO LOCAL STORAGE
/* const storage = multer.diskStorage({
  destination(req, file, cb) {
    if (!req.uploadId) req.uploadId = uuidv4();
    const userId = req.user ? req.user.id : 'guest';
    const dir = path.join(__dirname, '..', 'uploads', userId, req.uploadId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    cb(null, file.originalname);
  },
}); */

// CODE BELOW HANDLES FILE UPLOADS TO AWS S3 INSTEAD OF LOCAL

const storage = multer.memoryStorage();

// ____________________________________________________
// FILTER OUT UNSANCTIONED FILE TYPES
// ____________________________________________________
// fileBouncer
const fileFilter = (req, file, cb) => {
  if (!req.uploadId) req.uploadId = uuidv4(); // for AWS S3 storage
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(file.mimetype) || ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(null, true);
  }
  cb(new Error('Invalid file type. Only PDF, JPG, JPEG, PNG, and HEIC filetypes are allowed.'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },     // Arbitrary. 50mb? 1024x1024? Change as needed.
});

module.exports = upload;