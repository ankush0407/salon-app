const jwt = require('jsonwebtoken');

/**
 * JWT authentication middleware
 * Verifies token and extracts user context including salon_id
 */
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    req.salonId = user.salon_id;
    next();
  });
}

/**
 * Verify user has OWNER role
 */
function requireOwner(req, res, next) {
  if (req.user.role !== 'OWNER') {
    return res.status(403).json({ message: 'Access denied. Owner only.' });
  }
  next();
}

/**
 * Verify user has salon context (salon_id in JWT)
 */
function requireSalonAccess(req, res, next) {
  if (!req.salonId) {
    return res.status(403).json({ message: 'Salon context required' });
  }
  next();
}

module.exports = { authenticateToken, requireOwner, requireSalonAccess };