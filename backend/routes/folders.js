const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const auth         = require('../middleware/auth');
const User         = require('../models/User');
const UploadedFile = require('../models/UploadedFile');

/** 
 * LIST ALL FOLDERS
 * @ GET /api/folders
 */
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('folders');
    res.json(user?.folders ?? []);
  } catch (err) {
    console.error('Get folders error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * CREATE NEW FOLDER
 * @ POST /api/folders
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ msg: 'Folder name is required' });

    const folder = { id: uuidv4(), name: name.trim() };
    await User.findByIdAndUpdate(req.user.id, { $push: { folders: folder } });
    res.status(201).json(folder);
  } catch (err) {
    console.error('Create folder error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * RENAME EXISTING FOLDER
 * @ PATCH /api/folders/:id
 */
router.patch('/:id', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ msg: 'Folder name is required' });

    await User.findOneAndUpdate(
      { _id: req.user.id, 'folders.id': req.params.id },
      { $set: { 'folders.$.name': name.trim() } }
    );
    res.json({ id: req.params.id, name: name.trim() });
  } catch (err) {
    console.error('Rename folder error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * DELETE EXISTING FOLDER
 * NOTES UNASSIGNED FROM FOLDER, NOT DELETED
 * @ DELETE /api/folders/:id 
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    // If any notes are assigned to folder, unassign them
    await UploadedFile.updateMany(
      { userID: req.user.id, folderId: req.params.id },
      { $set: { folderId: null } }
    );
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { folders: { id: req.params.id } },
    });
    res.json({ msg: 'Folder deleted' });
  } catch (err) {
    console.error('Delete folder error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;