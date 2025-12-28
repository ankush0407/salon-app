/**
 * Common validation utilities
 * Centralized validation logic to reduce code duplication
 */

/**
 * Validate required fields
 * @param {Object} data - Data object to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} { valid: boolean, error: string }
 */
function validateRequired(data, requiredFields) {
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      return { valid: false, error: `${field} is required` };
    }
  }
  return { valid: true };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate salon access
 * @param {number} salonId - Salon ID from token
 * @param {number} resourceSalonId - Salon ID of resource being accessed
 * @returns {boolean}
 */
function validateSalonAccess(salonId, resourceSalonId) {
  return salonId === resourceSalonId;
}

module.exports = {
  validateRequired,
  isValidEmail,
  validateSalonAccess,
};
