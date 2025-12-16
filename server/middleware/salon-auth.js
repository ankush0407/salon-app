const db = require('../utils/db');

/**
 * Middleware to be used after Clerk authentication.
 * It takes the Clerk user ID from req.clerkUser, finds the corresponding salon,
 * and attaches auth information to req.auth.
 */
async function linkClerkUserToSalon(req, res, next) {
  if (!req.clerkUser || !req.clerkUser.id) {
    return res.status(401).json({ message: 'Authentication error: Clerk user not found.' });
  }

  const clerkUserId = req.clerkUser.id;

  try {
    // Query the salons table to find the salon linked to the Clerk user ID.
    // This assumes you have a 'clerk_user_id' column in your 'salons' table.
    const { rows } = await db.query('SELECT id FROM salons WHERE clerk_user_id = $1', [clerkUserId]);

    if (rows.length === 0) {
      console.warn(`No salon found for Clerk user ID: ${clerkUserId}`);
      return res.status(403).json({ message: 'Access denied: No salon associated with this user.' });
    }

    const salon = rows[0];

    // Create the req.auth object that the profile route expects
    req.auth = {
      userId: clerkUserId,
      salonId: salon.id,
    };

    next();
  } catch (error) {
    console.error('Error linking Clerk user to salon:', error);
    return res.status(500).json({ message: 'Internal server error during authorization.' });
  }
}

module.exports = { linkClerkUserToSalon };
