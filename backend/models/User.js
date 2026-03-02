/**
 * User MongoDB doc/schema:
 * User uploads storage with a link to the upload location. */

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: { type: String, trim: true, default: '' },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['user', 'guest', 'admin'],
    default: 'user',
  },
  ipAddress: { type: String, default: '' },
  dateJoined: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true },
  fileUploads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UploadedFile' }],
  /** 
   * ----------------------------------------------------------------------
   * FUTURE ADDITIONS:
   * "guest-to-user" flag, notifications, darkmode...
   * ----------------------------------------------------------------------
   */
  settings: {
    defaultView: { type: String, default: 'grid' },
    emailNotifications: { type: Boolean, default: false },
  },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
