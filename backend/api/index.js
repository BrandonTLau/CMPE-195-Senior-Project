const mongoose = require('mongoose');
const buildApp = require('../app');

let appInstance;
let connectionPromise;

async function ensureDbConnection() {
  if (mongoose.connection.readyState === 1) return;
  if (!connectionPromise) {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI environment variable is not set');
    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
  }
  await connectionPromise;
}

module.exports = async (req, res) => {
  try {
    await ensureDbConnection();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    res.status(503).json({ msg: 'Database unavailable' });
    return;
  }
  if (!appInstance) appInstance = buildApp();
  return appInstance(req, res);
};