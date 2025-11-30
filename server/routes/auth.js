const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');

// Register Salon - Create new salon account
router.post('/register-salon', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Salon name, email, and password are required' });
    }
    
    console.log('New salon registration:', { name, email });
    
    // Check if salon email already exists
    const { rows: existingSalons } = await db.query(
      'SELECT id FROM salons WHERE email = $1',
      [email]
    );
    
    if (existingSalons.length > 0) {
      return res.status(400).json({ message: 'This email is already registered' });
    }
    
    // Create salon
    const { rows: salonRows } = await db.query(
      'INSERT INTO salons (name, email, phone, address) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
      [name, email, phone || null, address || null]
    );
    
    const salon = salonRows[0];
    
    // Hash password and create owner user
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { rows: userRows } = await db.query(
      'INSERT INTO users (salon_id, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, email, role',
      [salon.id, email, hashedPassword, 'OWNER']
    );
    
    const user = userRows[0];
    
    console.log('✅ New salon created:', salon.name);
    
    // Generate JWT for the new user
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        salon_id: salon.id
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ 
      token,
      message: 'Salon registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        salon_id: salon.id,
        salon_name: salon.name
      }
    });
  } catch (error) {
    console.error('Salon registration error:', error);
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
    
    console.log('Login attempt:', { email });
    
    // Get user from PostgreSQL database
    const { rows: users } = await db.query(
      'SELECT u.*, s.name as salon_name, s.id as salon_id FROM users u JOIN salons s ON u.salon_id = s.id WHERE u.email = $1',
      [email]
    );
    
    console.log('Users found:', users.length);
    
    if (users.length === 0) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT with salon_id
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        salon_id: user.salon_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
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