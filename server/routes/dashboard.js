const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { authenticateToken, requireOwner } = require('../middleware/auth');

// Dashboard Metrics Endpoint
router.get('/', [authenticateToken, requireOwner], async (req, res) => {
  const { salonId } = req;

  try {
    // 1. Total Customers
    const totalCustomersResult = await db.query(
      'SELECT COUNT(*) AS count FROM customers WHERE salon_id = $1',
      [salonId]
    );
    const totalCustomers = totalCustomersResult.rows.length > 0 ? parseInt(totalCustomersResult.rows[0].count, 10) : 0;

    // 2. New Customers (Last 30 Days)
    const newCustomersLast30DaysResult = await db.query(
      "SELECT COUNT(*) AS count FROM customers WHERE salon_id = $1 AND join_date >= NOW() - INTERVAL '30 days'",
      [salonId]
    );
    const newCustomersLast30Days = newCustomersLast30DaysResult.rows.length > 0 ? parseInt(newCustomersLast30DaysResult.rows[0].count, 10) : 0;

    // 3. New Customers (Last 365 Days)
    const newCustomersLast365DaysResult = await db.query(
      "SELECT COUNT(*) AS count FROM customers WHERE salon_id = $1 AND join_date >= NOW() - INTERVAL '365 days'",
      [salonId]
    );
    const newCustomersLast365Days = newCustomersLast365DaysResult.rows.length > 0 ? parseInt(newCustomersLast365DaysResult.rows[0].count, 10) : 0;

    // 4. Active Subscriptions
    const activeSubscriptionsResult = await db.query(
      'SELECT COUNT(*) AS count FROM subscriptions s JOIN customers c ON s.customer_id = c.id WHERE c.salon_id = $1 AND s.is_active = true',
      [salonId]
    );
    const activeSubscriptions = activeSubscriptionsResult.rows.length > 0 ? parseInt(activeSubscriptionsResult.rows[0].count, 10) : 0;

    // 5. New Customers Trend (last 30 days)
    const newCustomersTrendResult = await db.query(
      `SELECT DATE(join_date) AS date, COUNT(*) AS count
       FROM customers
       WHERE salon_id = $1 AND join_date >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(join_date)
       ORDER BY date ASC`,
      [salonId]
    );
    const newCustomersTrend = newCustomersTrendResult.rows;

    // 6. Subscription Type Breakdown
    const subscriptionTypeBreakdownResult = await db.query(
      `SELECT st.name, COUNT(s.id) AS count
       FROM subscription_types st
       JOIN subscriptions s ON st.id = s.type_id
       WHERE st.salon_id = $1 AND s.is_active = true
       GROUP BY st.name`,
      [salonId]
    );
    const subscriptionTypeBreakdown = subscriptionTypeBreakdownResult.rows;

    // Placeholder for more complex metrics
    const revenue = 0;
    const appointments = 0;
    const servicePopularity = [];
    const clientRetentionRate = 0;


    res.json({
      totalCustomers,
      newCustomers: {
          last30Days: newCustomersLast30Days,
          last365Days: newCustomersLast365Days,
      },
      activeSubscriptions,
      newCustomersTrend,
      subscriptionTypeBreakdown,
      revenue,
      appointments,
      servicePopularity,
      clientRetentionRate,
    });

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ message: 'Error fetching dashboard metrics: ' + error.message });
  }
});

module.exports = router;
