const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { authenticateToken, requireSalonAccess } = require('../middleware/auth');

// Get subscriptions for a customer
router.get('/customer/:customerId', authenticateToken, requireSalonAccess, async (req, res) => {
  try {
    const { customerId } = req.params;
    const salonId = req.salonId;
    
    // Verify customer belongs to this salon
    const { rows: customerCheck } = await db.query(
      'SELECT id FROM customers WHERE id = $1 AND salon_id = $2',
      [customerId, salonId]
    );
    if (customerCheck.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { rows: subscriptions } = await db.query(
      `SELECT s.id, s.start_date, s.is_active, st.name, st.price, st.visits AS total_visits
       FROM subscriptions s
       JOIN subscription_types st ON s.type_id = st.id
       WHERE s.customer_id = $1
       ORDER BY s.start_date DESC`,
      [customerId]
    );

    for (const sub of subscriptions) {
      const { rows: visits } = await db.query('SELECT * FROM visits WHERE subscription_id = $1 ORDER BY id ASC', [sub.id]);
      sub.visits = visits;
      sub.usedVisits = visits.length;
      sub.totalVisits = parseInt(sub.total_visits) || 0;
      console.log(`📊 Subscription ${sub.id} (${sub.name}): usedVisits=${sub.usedVisits}, totalVisits=${sub.totalVisits}`);
    }

    console.log('✅ Returning subscriptions:', JSON.stringify(subscriptions.map(s => ({ id: s.id, name: s.name, usedVisits: s.usedVisits, totalVisits: s.totalVisits }))));
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Failed to fetch subscriptions' });
  }
});

// Add subscription for a customer
router.post('/', authenticateToken, requireSalonAccess, async (req, res) => {
  try {
    const { customer_id, type_id, start_date } = req.body;
    const salonId = req.salonId;
    
    // Verify customer and subscription type belong to this salon
    const { rows: customerCheck } = await db.query(
      'SELECT id FROM customers WHERE id = $1 AND salon_id = $2',
      [customer_id, salonId]
    );
    const { rows: typeCheck } = await db.query(
      'SELECT id FROM subscription_types WHERE id = $1 AND salon_id = $2',
      [type_id, salonId]
    );
    
    if (customerCheck.length === 0 || typeCheck.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { rows } = await db.query(
      'INSERT INTO subscriptions (customer_id, type_id, start_date) VALUES ($1, $2, $3) RETURNING *',
      [customer_id, type_id, start_date]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: 'Failed to create subscription' });
  }
});

// Redeem a visit for a subscription
router.post('/:id/redeem', authenticateToken, requireSalonAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const salonId = req.salonId;
    
    // Verify subscription belongs to this salon
    const { rows: subCheck } = await db.query(
      `SELECT s.id FROM subscriptions s
       JOIN customers c ON s.customer_id = c.id
       WHERE s.id = $1 AND c.salon_id = $2`,
      [id, salonId]
    );
    if (subCheck.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get local date (not UTC) for the visit
    const now = new Date();
    const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const date = localDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Check if there are visits left and subscription is active
    const { rows: subRows } = await db.query(
      `SELECT st.visits AS total_visits, s.is_active
       FROM subscriptions s
       JOIN subscription_types st ON s.type_id = st.id
       WHERE s.id = $1`, [id]
    );
    const { rows: visitRows } = await db.query('SELECT id FROM visits WHERE subscription_id = $1', [id]);

    if (subRows.length === 0) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    if (!subRows[0].is_active) {
      return res.status(400).json({ message: 'This subscription is inactive and cannot be used' });
    }
    
    if (visitRows.length >= subRows[0].total_visits) {
      return res.status(400).json({ message: 'No visits remaining' });
    }

    console.log('📝 Redeeming visit for subscription', id, 'on date:', date);
    const { rows } = await db.query(
      'INSERT INTO visits (subscription_id, date, note) VALUES ($1, $2, $3) RETURNING *',
      [id, date, note]
    );
    console.log('✅ Visit redeemed:', rows[0]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('❌ Error redeeming visit:', error.message);
    res.status(500).json({ message: 'Failed to redeem visit' });
  }
});

// Update a visit's note
router.put('/visit/:visitId', authenticateToken, requireSalonAccess, async (req, res) => {
  try {
    const { visitId } = req.params;
    const { note } = req.body;
    const salonId = req.salonId;
    
    // Verify visit belongs to this salon
    const { rows: visitCheck } = await db.query(
      `SELECT v.id FROM visits v
       JOIN subscriptions s ON v.subscription_id = s.id
       JOIN customers c ON s.customer_id = c.id
       WHERE v.id = $1 AND c.salon_id = $2`,
      [visitId, salonId]
    );
    if (visitCheck.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { rows } = await db.query(
      'UPDATE visits SET note = $1 WHERE id = $2 RETURNING *',
      [note, visitId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Visit not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating visit note:', error);
    res.status(500).json({ message: 'Failed to update visit note' });
  }
});

// Delete a visit
router.delete('/visit/:visitId', authenticateToken, requireSalonAccess, async (req, res) => {
  try {
    const { visitId } = req.params;
    const salonId = req.salonId;
    
    // Verify visit belongs to this salon
    const { rows: visitCheck } = await db.query(
      `SELECT v.id FROM visits v
       JOIN subscriptions s ON v.subscription_id = s.id
       JOIN customers c ON s.customer_id = c.id
       WHERE v.id = $1 AND c.salon_id = $2`,
      [visitId, salonId]
    );
    if (visitCheck.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { rowCount } = await db.query('DELETE FROM visits WHERE id = $1', [visitId]);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Visit not found' });
    }
    res.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('Error deleting visit:', error);
    res.status(500).json({ message: 'Failed to delete visit' });
  }
});

module.exports = router;