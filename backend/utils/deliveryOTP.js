import crypto from 'crypto';

/**
 * Generate a 6-digit OTP for delivery verification
 * @returns {string} 6-digit OTP
 */
export function generateDeliveryOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Calculate OTP expiration time (24 hours from now)
 * @returns {Date} Expiration date
 */
export function calculateOTPExpiration() {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  return expiresAt;
}

/**
 * Verify if OTP is valid and not expired
 * @param {string} providedOTP - OTP provided by user
 * @param {string} storedOTP - OTP stored in database
 * @param {Date} expiresAt - OTP expiration time
 * @returns {object} Verification result
 */
export function verifyDeliveryOTP(providedOTP, storedOTP, expiresAt) {
  if (!providedOTP || !storedOTP) {
    return { valid: false, message: 'OTP not found' };
  }

  if (providedOTP !== storedOTP) {
    return { valid: false, message: 'Invalid OTP' };
  }

  if (new Date() > new Date(expiresAt)) {
    return { valid: false, message: 'OTP has expired' };
  }

  return { valid: true, message: 'OTP verified successfully' };
}
