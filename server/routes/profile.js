const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const multer = require('multer');
const path = require('path');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Get profile data
router.get('/', async (req, res) => {
  try {
    const { salonId } = req.auth;
    if (!salonId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { rows } = await db.query('SELECT name, phone, email, salon_image_url, subscription_status FROM salons WHERE id = $1', [salonId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching profile data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile data
router.put('/', upload.single('salonImage'), async (req, res) => {
  try {
    const { salonId } = req.auth;
    if (!salonId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { name, phone, email } = req.body;

    let salonImageUrl = req.body.salon_image_url; // Keep existing image if not updated

    if (req.file) {
      salonImageUrl = `/uploads/${req.file.filename}`;
    }

    const { rows } = await db.query(
      'UPDATE salons SET name = $1, phone = $2, email = $3, salon_image_url = $4 WHERE id = $5 RETURNING *',
      [name, phone, email, salonImageUrl, salonId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating profile data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
