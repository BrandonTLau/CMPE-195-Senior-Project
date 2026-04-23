const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

async function makeUser(overrides = {}) {
  const defaults = {
    fullName: 'Test User',
    email: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'password123',
    role: 'user',
  };
  const data = { ...defaults, ...overrides };
  const normalized = data.email.toLowerCase().trim();
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(data.password, salt);
  const user = await new User({
    fullName: data.fullName,
    email: normalized,
    password: hashed,
    role: data.role,
    ipAddress: '127.0.0.1',
  }).save();
  return { user, plainPassword: data.password };
}

function makeToken(userId, secret = process.env.JWT_SECRET) {
  return jwt.sign({ user: { id: userId.toString() } }, secret, { expiresIn: '1h' });
}

async function makeUserWithToken(overrides = {}) {
  const { user, plainPassword } = await makeUser(overrides);
  const token = makeToken(user._id);
  return { user, token, plainPassword };
}

module.exports = { makeUser, makeToken, makeUserWithToken };