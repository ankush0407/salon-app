const express = require('express');
const { query: queryDb } = require('../utils/db');
const { authenticateToken, requireOwner } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/appointments/available-slots
 * Get available appointment slots for a customer to book
 * Query params: salonId, days (number of days to look ahead)
 */
router.get('/available-slots', async (req, res) => {
  try {
    const { salonId, days = 30 } = req.query;
    if (!salonId) {
      return res.status(400).json({ message: 'salonId is required' });
    }

    const db = { query: queryDb };
    
    // Get salon availability settings
    const availability = await db.query(
      'SELECT * FROM salon_availability WHERE salon_id = $1 ORDER BY day_of_week',
      [salonId]
    );

    if (availability.rows.length === 0) {
      return res.status(200).json({ slots: [] });
    }

    // Get confirmed appointments to exclude
    const confirmedAppointments = await db.query(
      `SELECT requested_time, proposed_time FROM appointments 
       WHERE salon_id = $1 AND status = 'CONFIRMED' 
       ORDER BY requested_time`,
      [salonId]
    );

    const slots = [];
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + parseInt(days));

    // Generate available slots
    for (let date = new Date(now); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const availabilityRow = availability.rows.find(a => a.day_of_week === dayOfWeek);

      if (!availabilityRow || !availabilityRow.is_working_day) continue;

      const slotDuration = availabilityRow.slot_duration || 30;
      let slotTime = new Date(date);
      const [hours, minutes] = availabilityRow.start_time.split(':');
      slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const endTime = new Date(date);
      const [endHours, endMinutes] = availabilityRow.end_time.split(':');
      endTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

      // Generate slots for the day
      while (slotTime < endTime) {
        const nextSlot = new Date(slotTime);
        nextSlot.setMinutes(nextSlot.getMinutes() + slotDuration);

        // Check if slot is confirmed or proposed
        const isBooked = confirmedAppointments.rows.some(apt => {
          const aptTime = new Date(apt.requested_time);
          const proposedTime = apt.proposed_time ? new Date(apt.proposed_time) : null;
          const checkTime = proposedTime || aptTime;
          
          return (
            checkTime.getTime() === slotTime.getTime() ||
            (checkTime > slotTime && checkTime < nextSlot)
          );
        });

        if (!isBooked) {
          slots.push({
            time: slotTime.toISOString(),
            available: true
          });
        }

        slotTime = nextSlot;
      }
    }

    res.json({ slots });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ message: 'Failed to fetch available slots' });
  }
});

/**
 * GET /api/appointments/owner
 * Get all appointments for salon owner
 */
router.get('/owner', [authenticateToken, requireOwner], async (req, res) => {
  try {
    const salonId = req.salonId;
    const { status } = req.query;

    const db = { query: queryDb };
    
    let query = `
      SELECT 
        a.*, 
        c.name as customer_name, 
        c.email as customer_email,
        c.phone as customer_phone,
        st.name as subscription_type,
        sub.start_date as subscription_start
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      LEFT JOIN subscriptions sub ON a.subscription_id = sub.id
      LEFT JOIN subscription_types st ON sub.type_id = st.id
      WHERE a.salon_id = $1
    `;
    
    const params = [salonId];
    
    if (status) {
      query += ` AND a.status = $2`;
      params.push(status);
    }
    
    query += ` ORDER BY a.requested_time DESC`;

    const result = await db.query(query, params);
    res.json({ appointments: result.rows });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

/**
 * GET /api/appointments/customer/:customerId
 * Get all appointments for a customer
 */
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const db = { query: queryDb };
    
    const result = await db.query(
      `SELECT 
        a.*, 
        s.name as salon_name,
        st.name as subscription_type
      FROM appointments a
      JOIN salons s ON a.salon_id = s.id
      LEFT JOIN subscriptions sub ON a.subscription_id = sub.id
      LEFT JOIN subscription_types st ON sub.type_id = st.id
      WHERE a.customer_id = $1
      ORDER BY a.requested_time DESC`,
      [customerId]
    );

    res.json({ appointments: result.rows });
  } catch (error) {
    console.error('Error fetching customer appointments:', error);
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

/**
 * POST /api/appointments
 * Create a new appointment request
 */
router.post('/', async (req, res) => {
  try {
    const { customerId, salonId, subscriptionId, requestedTime, notes } = req.body;

    if (!customerId || !salonId || !requestedTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const db = { query: queryDb };

    // Check for conflicting confirmed appointments
    const conflicting = await db.query(
      `SELECT id FROM appointments 
       WHERE salon_id = $1 
       AND status = 'CONFIRMED'
       AND requested_time = $2`,
      [salonId, requestedTime]
    );

    if (conflicting.rows.length > 0) {
      return res.status(409).json({ message: 'Slot is no longer available' });
    }

    // Create the appointment
    const result = await db.query(
      `INSERT INTO appointments (salon_id, customer_id, subscription_id, requested_time, notes, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')
       RETURNING *`,
      [salonId, customerId, subscriptionId, requestedTime, notes || null]
    );

    res.status(201).json({ appointment: result.rows[0] });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Failed to create appointment' });
  }
});

/**
 * PATCH /api/appointments/:appointmentId/confirm
 * Confirm an appointment request
 */
router.patch('/:appointmentId/confirm', [authenticateToken, requireOwner], async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const salonId = req.salonId;

    const db = { query: queryDb };

    // Verify ownership
    const apt = await db.query(
      'SELECT * FROM appointments WHERE id = $1 AND salon_id = $2',
      [appointmentId, salonId]
    );

    if (apt.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const result = await db.query(
      `UPDATE appointments 
       SET status = 'CONFIRMED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [appointmentId]
    );

    res.json({ appointment: result.rows[0] });
  } catch (error) {
    console.error('Error confirming appointment:', error);
    res.status(500).json({ message: 'Failed to confirm appointment' });
  }
});

/**
 * PATCH /api/appointments/:appointmentId/propose
 * Propose a new time for an appointment
 */
router.patch('/:appointmentId/propose', [authenticateToken, requireOwner], async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { proposedTime } = req.body;
    const salonId = req.salonId;

    if (!proposedTime) {
      return res.status(400).json({ message: 'proposedTime is required' });
    }

    const db = { query: queryDb };

    // Verify ownership
    const apt = await db.query(
      'SELECT * FROM appointments WHERE id = $1 AND salon_id = $2',
      [appointmentId, salonId]
    );

    if (apt.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const result = await db.query(
      `UPDATE appointments 
       SET status = 'RESCHEDULE_PROPOSED', proposed_time = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [appointmentId, proposedTime]
    );

    res.json({ appointment: result.rows[0] });
  } catch (error) {
    console.error('Error proposing new time:', error);
    res.status(500).json({ message: 'Failed to propose new time' });
  }
});

/**
 * PATCH /api/appointments/:appointmentId/accept-proposal
 * Customer accepts a proposed reschedule
 */
router.patch('/:appointmentId/accept-proposal', async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const db = { query: queryDb };

    // Get the appointment
    const apt = await db.query(
      'SELECT * FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (apt.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (apt.rows[0].status !== 'RESCHEDULE_PROPOSED') {
      return res.status(400).json({ message: 'Appointment is not awaiting customer response' });
    }

    // Move proposed_time to requested_time and set status to CONFIRMED
    const result = await db.query(
      `UPDATE appointments 
       SET requested_time = proposed_time, status = 'CONFIRMED', proposed_time = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [appointmentId]
    );

    res.json({ appointment: result.rows[0] });
  } catch (error) {
    console.error('Error accepting proposal:', error);
    res.status(500).json({ message: 'Failed to accept proposal' });
  }
});

/**
 * PATCH /api/appointments/:appointmentId/cancel
 * Cancel an appointment
 */
router.patch('/:appointmentId/cancel', async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const db = { query: queryDb };

    const result = await db.query(
      `UPDATE appointments 
       SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [appointmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({ appointment: result.rows[0] });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Failed to cancel appointment' });
  }
});

module.exports = router;
