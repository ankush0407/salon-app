const express = require('express');
const { query: queryDb } = require('../utils/db');
const { authenticateToken, requireOwner } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/availability/:salonId
 * Get salon availability settings
 */
router.get('/:salonId', async (req, res) => {
  try {
    const { salonId } = req.params;

    const db = { query: queryDb };
    
    const result = await db.query(
      `SELECT * FROM salon_availability 
       WHERE salon_id = $1
       ORDER BY day_of_week`,
      [salonId]
    );

    // Format response with day names
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const availability = result.rows.map(row => ({
      id: row.id,
      salonId: row.salon_id,
      dayOfWeek: row.day_of_week,
      dayName: dayNames[row.day_of_week],
      isWorkingDay: row.is_working_day,
      startTime: row.start_time,
      endTime: row.end_time,
      slotDuration: row.slot_duration,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({ availability });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ message: 'Failed to fetch availability' });
  }
});

/**
 * POST /api/availability
 * Create or update salon availability settings
 */
router.post('/', [authenticateToken, requireOwner], async (req, res) => {
  try {
    const salonId = req.salonId;
    const { availabilitySettings } = req.body;

    if (!availabilitySettings || !Array.isArray(availabilitySettings)) {
      return res.status(400).json({ message: 'availabilitySettings array is required' });
    }

    const db = { query: queryDb };

    // Delete existing settings
    await db.query('DELETE FROM salon_availability WHERE salon_id = $1', [salonId]);

    // Insert new settings
    const savedSettings = [];
    for (const setting of availabilitySettings) {
      const { dayOfWeek, isWorkingDay, startTime, endTime, slotDuration } = setting;

      const result = await db.query(
        `INSERT INTO salon_availability 
         (salon_id, day_of_week, is_working_day, start_time, end_time, slot_duration)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          salonId, 
          dayOfWeek, 
          isWorkingDay, 
          isWorkingDay ? startTime : '09:00:00', 
          isWorkingDay ? endTime : '17:00:00', 
          slotDuration || 30
        ]
      );

      savedSettings.push(result.rows[0]);
    }

    res.status(201).json({ availability: savedSettings });
  } catch (error) {
    console.error('Error creating availability:', error);
    res.status(500).json({ message: 'Failed to create availability settings' });
  }
});

/**
 * PATCH /api/availability/:settingId
 * Update a specific availability setting
 */
router.patch('/:settingId', [authenticateToken, requireOwner], async (req, res) => {
  try {
    const { settingId } = req.params;
    const salonId = req.salonId;
    const { isWorkingDay, startTime, endTime, slotDuration } = req.body;

    const db = { query: queryDb };

    // Verify ownership
    const setting = await db.query(
      'SELECT * FROM salon_availability WHERE id = $1 AND salon_id = $2',
      [settingId, salonId]
    );

    if (setting.rows.length === 0) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    const result = await db.query(
      `UPDATE salon_availability 
       SET is_working_day = COALESCE($2, is_working_day),
           start_time = COALESCE($3, start_time),
           end_time = COALESCE($4, end_time),
           slot_duration = COALESCE($5, slot_duration),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [settingId, isWorkingDay, startTime, endTime, slotDuration]
    );

    res.json({ availability: result.rows[0] });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ message: 'Failed to update availability' });
  }
});

module.exports = router;
