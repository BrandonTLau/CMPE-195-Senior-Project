/**
 * RUN FIRST TO PREPOPULATE MOCK USERS IN THE DATABASE
 * Fills User database model with new mock user credentials */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const path     = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

/* const MOCK_EMAIL    = 'test@example.com';
const MOCK_PASSWORD = 'password123'; */
const MONGO_URI     = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notescan_db';

const MOCK_USERS = [
  {
    fullName: 'Bob TheAdministrator',
    email: 'iamtheadmin@example.com',
    password: 'drop-down-venomous-diabetes-path-sheep-scouring',
    role: 'admin',
  },
  {
    fullName: 'Testo Userski',
    email: 'test@example.com',
    password: 'password123',
    role: 'user',
  },
  {
    fullName: 'Steven Mockiouserio',
    email: 'stevem@example.com',
    password: '$teve123321',
    role: 'user',
  },
  {
    fullName: 'Peter Parker',
    email: 'ppspider@example.com',
    password: 'man$pid3r',
    role: 'user',
  },
  {
    fullName: 'Timberly Cook',
    email: 'timcook@example.com',
    password: 'appleapple123',
    role: 'user',
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB\n');

    let created = 0;  // count for new unique users created
    let skipped = 0;  // count for duplicate user skipped

    for (const newMockUser of MOCK_USERS) {
      const normalizedEmail = newMockUser.email.toLowerCase().trim();
      const alreadyExists = await User.findOne({email: normalizedEmail});

      // check for duplicate users in case the script is ran multiple times
      if (alreadyExists) {
        console.log(`--- SKIPPED ---  ${normalizedEmail} (user already exists)`);
        skipped++;
        continue;
      }

      const salted = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(newMockUser.password, salted);

      await new User({
        fullName: newMockUser.fullName,
        email: normalizedEmail,
        password: hashed,
        role: newMockUser.role || 'user',
        ipAddress: '127.0.0.1',
      }).save();
      console.log(`ADDED  ${normalizedEmail} (password: ${newMockUser.password})`);
      created++;
    }

    console.log(`\nDone:  # created - ${created};  # skipped - ${skipped}.`);

  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();