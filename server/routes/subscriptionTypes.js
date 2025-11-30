const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { authenticateToken, requireOwner, requireSalonAccess } = require('../middleware/auth');

// Get all subscription types for the salon
router.get('/', authenticateToken, requireSalonAccess, async (req, res) => {
  try {
    const salonId = req.salonId;
    const { rows } = await db.query('SELECT * FROM subscription_types WHERE salon_id = $1 ORDER BY name', [salonId]);
    res.json(rows);
  } catch (error) {
    console.error('Error getting subscription types:', error);
    res.status(500).json({ message: 'Failed to fetch subscription types' });
  }
});

// Add new subscription type (Owner only)
router.post('/', authenticateToken, requireOwner, requireSalonAccess, async (req, res) => {
  try {
    const { name, price, visits } = req.body;
    const salonId = req.salonId;
    
    if (!name || !price || !visits) {
      return res.status(400).json({ message: 'Name, price, and visits are required' });
    }
    
    // Check for duplicate name within this salon
    const { rows: existing } = await db.query(
      'SELECT id FROM subscription_types WHERE salon_id = $1 AND name = $2',
      [salonId, name]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'A subscription type with this name already exists' });
    }
    
    const { rows } = await db.query(
      'INSERT INTO subscription_types (salon_id, name, price, visits) VALUES ($1, $2, $3, $4) RETURNING *',
      [salonId, name, price, visits]
    );
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error adding subscription type:', error);
    res.status(500).json({ message: 'Failed to add subscription type' });
  }
});

// Delete subscription type (Owner only)
router.delete('/:id', authenticateToken, requireOwner, requireSalonAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.salonId;
    
    // Verify subscription type belongs to this salon
    const { rows: typeCheck } = await db.query(
      'SELECT id FROM subscription_types WHERE id = $1 AND salon_id = $2',
      [id, salonId]
    );
    if (typeCheck.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // You might want to check if any subscriptions are using this type before deleting
    const { rowCount } = await db.query('DELETE FROM subscription_types WHERE id = $1 AND salon_id = $2', [id, salonId]);
    
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Subscription type not found' });
    }
    
    res.json({ message: 'Subscription type deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription type:', error);
    res.status(500).json({ message: 'Failed to delete subscription type' });
  }
});

module.exports = router;