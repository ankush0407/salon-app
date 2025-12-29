const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { requireClerkAuth } = require('../middleware/clerk-auth');

/**
 * GET /api/customer/me
 * Returns the authenticated customer's profile and subscription details
 * 
 * Flow:
 * 1. Verify Clerk session token
 * 2. Find customer by email in PostgreSQL
 * 3. Update clerk_user_id if not already set
 * 4. Return customer profile + subscriptions
 */
router.get('/me', requireClerkAuth, async (req, res) => {
  try {
    const clerkEmail = req.clerkUser.email;
    const clerkUserId = req.clerkUser.id;

    if (!clerkEmail) {
      return res.status(400).json({ message: 'Email not found in Clerk session' });
    }

    // Query customers table by email
    const customerResult = await db.query(
      'SELECT id, salon_id, name, email, phone, join_date, clerk_user_id FROM customers WHERE LOWER(email) = LOWER($1)',
      [clerkEmail]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({ 
        message: 'No customer found with this email'
      });
    }

    // Get all customer records for this email (one per salon)
    const customers = customerResult.rows;
    const customerIds = customers.map(c => c.id);

    // Update clerk_user_id for all customer records if not already set
    for (const customer of customers) {
      if (!customer.clerk_user_id) {
        await db.query(
          'UPDATE customers SET clerk_user_id = $1 WHERE id = $2',
          [clerkUserId, customer.id]
        );
      }
    }

    // Get subscriptions from ALL customer records (across all salons)
    const subscriptionsResult = await db.query(
      `SELECT 
        s.id, 
        s.start_date, 
        s.is_active,
        st.name, 
        st.price, 
        st.visits,
        st.salon_id,
        sl.name as salon_name,
        COUNT(v.id) as used_visits
      FROM subscriptions s
      JOIN subscription_types st ON s.type_id = st.id
      JOIN salons sl ON st.salon_id = sl.id
      LEFT JOIN visits v ON s.id = v.subscription_id
      WHERE s.customer_id = ANY($1)
      GROUP BY s.id, st.id, sl.name, st.salon_id
      ORDER BY s.start_date DESC`,
      [customerIds]
    );

    const subscriptions = subscriptionsResult.rows.map(sub => ({
      id: sub.id,
      name: sub.name,
      salonId: sub.salon_id,
      salonName: sub.salon_name,
      price: sub.price,
      startDate: sub.start_date,
      isActive: sub.is_active,
      totalVisits: parseInt(sub.visits),
      usedVisits: parseInt(sub.used_visits) || 0,
      remainingVisits: parseInt(sub.visits) - (parseInt(sub.used_visits) || 0),
    }));

    // Use first customer record for profile data (they all have same email/name)
    const primaryCustomer = customers[0];

    // Return customer profile with subscriptions
    res.json({
      customer: {
        id: primaryCustomer.id,
        name: primaryCustomer.name,
        email: primaryCustomer.email,
        phone: primaryCustomer.phone,
        joinDate: primaryCustomer.join_date,
        salonId: primaryCustomer.salon_id,
      },
      subscriptions: subscriptions,
      message: subscriptions.length === 0 ? 'No active subscriptions' : undefined,
    });
  } catch (error) {
    console.error('❌ Error fetching customer profile:', error);
    res.status(500).json({ message: 'Failed to fetch customer profile' });
  }
});

/**
 * GET /api/customer/subscriptions
 * Returns just the subscription list (alternative endpoint)
 */
router.get('/subscriptions', requireClerkAuth, async (req, res) => {
  try {
    const clerkEmail = req.clerkUser.email;

    // Find all customer records by email (one per salon)
    const customerResult = await db.query(
      'SELECT id FROM customers WHERE LOWER(email) = LOWER($1)',
      [clerkEmail]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const customerIds = customerResult.rows.map(c => c.id);

    // Get subscriptions from ALL customer records (across all salons)
    const subscriptionsResult = await db.query(
      `SELECT 
        s.id, 
        s.start_date, 
        s.is_active,
        st.name, 
        st.price, 
        st.visits,
        st.salon_id,
        sl.name as salon_name,
        json_agg(json_build_object('id', v.id, 'date', v.date, 'note', v.note) 
          ORDER BY v.date ASC) FILTER (WHERE v.id IS NOT NULL) as visits
      FROM subscriptions s
      JOIN subscription_types st ON s.type_id = st.id
      JOIN salons sl ON st.salon_id = sl.id
      LEFT JOIN visits v ON s.id = v.subscription_id
      WHERE s.customer_id = ANY($1)
      GROUP BY s.id, st.id, sl.name, st.salon_id
      ORDER BY s.start_date DESC`,
      [customerIds]
    );

    const subscriptions = subscriptionsResult.rows.map(sub => ({
      id: sub.id,
      name: sub.name,
      salonId: sub.salon_id,
      salonName: sub.salon_name,
      price: sub.price,
      startDate: sub.start_date,
      isActive: sub.is_active,
      totalVisits: parseInt(sub.visits),
      usedVisits: (sub.visits || []).length,
      remainingVisits: parseInt(sub.visits) - ((sub.visits || []).length),
      visits: sub.visits || [],
    }));

    res.json({
      subscriptions: subscriptions,
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Failed to fetch subscriptions' });
  }
});


router.get('/subscriptions/:id', requireClerkAuth, async (req, res) => {
  try {
    const clerkEmail = req.clerkUser.email;
    const { id } = req.params;

    // Find all customer records by email (one per salon)
    const customerResult = await db.query(
      'SELECT id FROM customers WHERE LOWER(email) = LOWER($1)',
      [clerkEmail]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const customerIds = customerResult.rows.map(c => c.id);

    // Get subscription with visit details (check across all customer records)
    const subscriptionResult = await db.query(
      `SELECT
        s.id,
        s.start_date,
        s.is_active,
        st.name,
        st.price,
        st.visits as total_visits,
        st.salon_id,
        sl.name as salon_name,
        json_agg(json_build_object('id', v.id, 'date', v.date, 'note', v.note)
          ORDER BY v.date ASC) FILTER (WHERE v.id IS NOT NULL) as visits
      FROM subscriptions s
      JOIN subscription_types st ON s.type_id = st.id
      JOIN salons sl ON st.salon_id = sl.id
      LEFT JOIN visits v ON s.id = v.subscription_id
      WHERE s.customer_id = ANY($1) AND s.id = $2
      GROUP BY s.id, st.id, sl.name, st.salon_id`,
      [customerIds, id]
    );

    if (subscriptionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Subscription not found or does not belong to this customer' });
    }

    const sub = subscriptionResult.rows[0];
    const subscription = {
      id: sub.id,
      name: sub.name,
      salonId: sub.salon_id,
      salonName: sub.salon_name,
      price: sub.price,
      startDate: sub.start_date,
      isActive: sub.is_active,
      totalVisits: parseInt(sub.total_visits),
      usedVisits: (sub.visits || []).length,
      remainingVisits: parseInt(sub.total_visits) - ((sub.visits || []).length),
      visits: sub.visits || [],
    };

    console.log('📋 Returning subscription details:', { id: subscription.id, name: subscription.name, salonId: subscription.salonId });
    res.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    res.status(500).json({ message: 'Failed to fetch subscription details' });
  }
});

module.exports = router;
