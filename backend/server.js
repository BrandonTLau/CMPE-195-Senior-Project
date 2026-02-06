/**
 * MAIN SERVER
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
// Allow frontend to communicate
app.use(cors({
  origin: ["http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "x-auth-token"],
}));
app.use(express.json()); // Parse JSON bodies

// Database Connection
// Connect to local MongoDB instance
/** mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notes_app_local', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected Locally'))
.catch(err => console.log(err)); */

const uri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/notes_app_local";

async function start() {
  try {
    await mongoose.connect(uri); 
    console.log("MongoDB Connected");

    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

start();


// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/files', require('./routes/files'));

// Serve uploaded files statically (optional, if you want to display the original image)
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));