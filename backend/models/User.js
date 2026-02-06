/**
 * User schema:
 * User uploads storage with a link to the upload location.
 */

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  ipAddress: { 
    type: String 
  },
  dateJoined: { 
    type: Date, 
    default: Date.now 
  },
  // Array of references to the UploadedFile model
  fileUploads: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UploadedFile' 
  }]
});

module.exports = mongoose.model('User', UserSchema);