/**
 * MAIN SERVER */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// MIDDLEWARE BRIDGE
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-auth-token'],
}));

app.use(express.json()); // Parse JSON bodies

// To display original image (statically serving uploaded files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ROUTES
app.use('/api/auth', require('./routes/auth'));
app.use('/api/files', require('./routes/files'));

app.use('/api/folders', require('./routes/folders')); // user folders

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

/**
 * ---------------------------------------------------------
 * FUTURE INTEGRATIONS: 
 * app.use('/api/process', require('./routes/process'));  
 * --------------------------------------------------------- */

//const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/notes_app_local";

async function start() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notescan_db';
    // (TESTING) query timeout to ensure there is no stalling
    //await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 10000, });
    
    await mongoose.connect(uri);
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Startup error:', err.message);
    process.exit(1);
  }
}

// (TESTING) test route; no database interaction
//app.get('/api/ping', (req, res) => res.json({ pong: true }));

start();

//app.use('/uploads', express.static('uploads'));