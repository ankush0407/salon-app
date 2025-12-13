const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { authenticateToken, requireSalonAccess } = require('../middleware/auth');
const clerk = require('@clerk/clerk-sdk-node');
const clerkClient = clerk.clerkClient;

// Get all customers for the salon
router.get('/', authenticateToken, requireSalonAccess, async (req, res) => {
  try {
    const salonId = req.salonId;
    const { rows } = await db.query('SELECT * FROM customers WHERE salon_id = $1 ORDER BY name', [salonId]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
});

// Add customer to salon
router.post('/', authenticateToken, requireSalonAccess, async (req, res) => {
  try {
    console.log('📝 ADD CUSTOMER REQUEST:', req.body);
    const { name, email, phone } = req.body;
    const salonId = req.salonId;
    
    // Validate name is required
    if (!name) {
      return res.status(400).json({ message: 'Customer name is required' });
    }
    
    // Check for duplicate email within this salon
    if (email) {
      const { rows: existing } = await db.query(
        'SELECT id FROM customers WHERE salon_id = $1 AND email = $2',
        [salonId, email]
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: 'A customer with this email already exists' });
      }
    }
    
    const join_date = new Date();
    
    console.log('💾 Inserting into PostgreSQL:', { salonId, name, email, phone, join_date });
    
    const { rows } = await db.query(
      'INSERT INTO customers (salon_id, name, email, phone, join_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [salonId, name, email || null, phone, join_date]
    );
    
    const newCustomer = rows[0];
    console.log('✅ Customer added to PostgreSQL:', newCustomer);

    // After successfully adding to DB, create user in Clerk
    if (email) {
      try {
        console.log('✨ Creating user in Clerk:', { email, name });
        await clerkClient.users.createUser({
          emailAddress: [email],
          skipPasswordRequirement: true,
          firstName: name,
        });
        console.log('🎉 Successfully created Clerk user for:', email);
      } catch (error) {
        // Check if the error is due to the user already existing
        const isDuplicate = error.errors && error.errors.some(e => e.code === 'form_identifier_exists');
        if (isDuplicate) {
          console.log('🤷‍♂️ User already exists in Clerk, skipping creation:', email);
        } else {
          // For any other Clerk-related error, log it but don't fail the request
          console.error('❌ Error creating Clerk user:', error.errors || error.message);
        }
      }
    }
    
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('❌ Error adding customer:', error.message);
    res.status(500).json({ message: 'Failed to add customer' });
  }
});

// Update customer
router.put('/:id', authenticateToken, requireSalonAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    const salonId = req.salonId;
    
    // Verify customer belongs to this salon
    const { rows: customer } = await db.query('SELECT id FROM customers WHERE id = $1 AND salon_id = $2', [id, salonId]);
    if (customer.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { rows } = await db.query(
      'UPDATE customers SET name = $1, email = $2, phone = $3 WHERE id = $4 AND salon_id = $5 RETURNING *',
      [name, email, phone, id, salonId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', authenticateToken, requireSalonAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.salonId;
    
    // Verify customer belongs to this salon
    const { rows: customer } = await db.query('SELECT id FROM customers WHERE id = $1 AND salon_id = $2', [id, salonId]);
    if (customer.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete visits, then subscriptions, then customer
    await db.query('DELETE FROM visits WHERE subscription_id IN (SELECT id FROM subscriptions WHERE customer_id = $1)', [id]);
    await db.query('DELETE FROM subscriptions WHERE customer_id = $1', [id]);
    const { rowCount } = await db.query('DELETE FROM customers WHERE id = $1 AND salon_id = $2', [id, salonId]);
    
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json({ message: 'Customer and associated subscriptions deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Failed to delete customer' });
  }
});

module.exports = router;