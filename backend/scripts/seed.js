/**
 * RUN FIRST TO
 * PREPOPULATE MOCK USER */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const path     = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

const MOCK_EMAIL    = 'test@example.com';
const MOCK_PASSWORD = 'password123';
const MONGO_URI     = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notescan_db';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: MOCK_EMAIL });
    if (existing) {
      console.log(`Mock user already exists: ${MOCK_EMAIL}`);
    } else {
      const salt   = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(MOCK_PASSWORD, salt);
      await new User({ fullName: 'Test User', email: MOCK_EMAIL, password: hashed, ipAddress: '127.0.0.1' }).save();
      console.log(`Created mock user  →  ${MOCK_EMAIL} / ${MOCK_PASSWORD}`);
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
