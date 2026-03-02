/**
 * Login && Signup auth route */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = require('../middleware/auth');

const JWT_SECRET  = process.env.JWT_SECRET  || 'dev_jwt_secret_change_in_production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '10h';

// mock credentials from /frontend/src/LiginPage.jsx
const MOCK_EMAIL    = 'test@example.com';
const MOCK_PASSWORD = 'password123';

function signToken(userId) {
  return new Promise((resolve, reject) => {
    jwt.sign({ user: { id: userId } }, JWT_SECRET, { expiresIn: JWT_EXPIRES }, (err, token) => {
      if (err) reject(err);
      else resolve(token);
    });
  });
}

// ____________________________________________________
// TO HANDLE A NEW USER:
// Registration
// @route   POST api/auth/register
// ____________________________________________________
router.post('/register', async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: 'Email and password are required' });
  }
  try {
    const normalized = email.toLowerCase().trim();
    if (await User.findOne({ email: normalized })) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    const salt   = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user   = await new User({
      fullName: fullName || '',
      email:    normalized,
      password: hashed,
      ipAddress: req.ip || req.connection?.remoteAddress || '',
    }).save();

    const token = await signToken(user.id);
    res.status(201).json({ token, user: { id: user.id, email: user.email, fullName: user.fullName } });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});


// ____________________________________________________
// TO HANDLE AN EXISTING USER:
// Authenticate user & get token
// @route   POST api/auth/login
// ____________________________________________________
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: 'Email and password are required' });
  }
  try {
    const normalized = email.toLowerCase().trim();

    // Prototype: mock credentials auto-create the test user if missing
    if (normalized === MOCK_EMAIL && password === MOCK_PASSWORD) {
      let mock = await User.findOne({ email: MOCK_EMAIL });
      if (!mock) {
        const salt = await bcrypt.genSalt(10);
        mock = await new User({
          fullName:  'Test User',
          email:     MOCK_EMAIL,
          password:  await bcrypt.hash(MOCK_PASSWORD, salt),
          ipAddress: req.ip || '',
        }).save();
      }
      mock.lastLogin = new Date();
      await mock.save();
      const token = await signToken(mock.id);
      return res.json({ token, user: { id: mock.id, email: mock.email, fullName: mock.fullName } });
    }

    const user = await User.findOne({ email: normalized });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    user.lastLogin = new Date();
    await user.save();
    const token = await signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ____________________________________________________
// ACCESS USER PROFILE WITH UPLOADS
// @route   GET /api/auth/me
// ____________________________________________________
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('fileUploads', 'originalName uploadDate status title isFavorite');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Me error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
