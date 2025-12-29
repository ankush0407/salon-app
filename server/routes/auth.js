const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');

// Helper: Generate JWT token
const generateToken = (user, salonId) => 
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, salon_id: salonId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// Helper: Validate IANA timezone
const isValidTimezone = (timezone) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
};

// Register Salon
router.post('/register-salon', async (req, res) => {
  try {
    const { name, email, password, phone, address, timezone } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Salon name, email, and password are required' });
    }
    
    // Validate timezone if provided
    let salonTimezone = timezone || 'UTC';
    if (!isValidTimezone(salonTimezone)) {
      return res.status(400).json({ message: 'Invalid timezone provided' });
    }
    
    // Check if email already exists
    const { rows: existing } = await db.query('SELECT id FROM salons WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'This email is already registered' });
    }
    
    // Create salon and owner user with timezone
    const { rows: salonRows } = await db.query(
      'INSERT INTO salons (name, email, phone, address, timezone) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, timezone',
      [name, email, phone || null, address || null, salonTimezone]
    );
    
    const salon = salonRows[0];
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { rows: userRows } = await db.query(
      'INSERT INTO users (salon_id, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, email, role',
      [salon.id, email, hashedPassword, 'OWNER']
    );
    
    const user = userRows[0];
    const token = generateToken(user, salon.id);
    
    res.status(201).json({ 
      token,
      message: 'Salon registered successfully',
      user: { id: user.id, email: user.email, role: user.role, salon_id: salon.id, salon_name: salon.name, timezone: salon.timezone }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'An error occurred during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Get user and salon info
    const { rows: users } = await db.query(
      'SELECT u.*, s.name as salon_name, s.id as salon_id FROM users u JOIN salons s ON u.salon_id = s.id WHERE u.email = $1',
      [email]
    );
    
    if (users.length === 0 || !await bcrypt.compare(password, users[0].password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = users[0];
    const token = generateToken(user, user.salon_id);
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email,
        role: user.role,
        salon_id: user.salon_id,
        salon_name: user.salon_name
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login' });
  }
});

module.exports = router;