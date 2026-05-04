/**
 * Extracts Express app config from `server.js` so integration tests can mount it via Supertest
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

function buildApp() {
  const app = express();

  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-auth-token'],
  }));

  app.use(express.json({ limit: '10mb' }));

  // LOCAL/RENDER FILE UPLOADS -----------------
  //app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // CORS headers to account for .pdf files
/*   app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
  next();
  }, express.static(path.join(__dirname, 'uploads'))); */
  // ------------------------------------------

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/files', require('./routes/files'));
  app.use('/api/folders', require('./routes/folders'));

  app.get('/api/health', (req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  );

  app.use((err, req, res, next) => {
    if (err && err.message && err.message.startsWith('Invalid file type')) {
      return res.status(400).json({ msg: err.message });
    }
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ msg: 'File too large' });
    }
    console.error('Unhandled error:', err && err.message);
    res.status(500).json({ msg: 'Server error' });
  });

  return app;
}

module.exports = buildApp;