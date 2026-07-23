// Distance-based payment calculation for delivery partners
// Payment rates configuration
const PAYMENT_RATES = {
  // Tier 1: Short distance (0-10 km round trip)
  SHORT_DISTANCE: {
    maxDistance: 10,
    ratePerKm: 5, // ₹5 per km
    baseFee: 10   // Base fee for any delivery
  },
  // Tier 2: Medium distance (10-20 km round trip)
  MEDIUM_DISTANCE: {
    maxDistance: 20,
    ratePerKm: 7, // ₹7 per km
    baseFee: 15
  },
  // Tier 3: Long distance (20-50 km round trip)
  LONG_DISTANCE: {
    maxDistance: 50,
    ratePerKm: 10, // ₹10 per km
    baseFee: 25
  },
  // Tier 4: Very long distance (50+ km round trip)
  VERY_LONG_DISTANCE: {
    maxDistance: Infinity,
    ratePerKm: 12, // ₹12 per km
    baseFee: 40
  }
};

/**
 * Calculate payment for delivery partner based on round-trip distance
 * @param {number} distance - Round-trip distance in kilometers
 * @param {object} options - Additional options
 * @param {number} options.bonus - Additional bonus amount
 * @param {number} options.multiplier - Rate multiplier (e.g., for peak hours, bad weather)
 * @returns {object} Payment breakdown
 */
function calculateDeliveryPayment(distance, options = {}) {
  const { bonus = 0, multiplier = 1 } = options;
  
  // Determine payment tier based on distance
  let tier;
  if (distance <= PAYMENT_RATES.SHORT_DISTANCE.maxDistance) {
    tier = PAYMENT_RATES.SHORT_DISTANCE;
  } else if (distance <= PAYMENT_RATES.MEDIUM_DISTANCE.maxDistance) {
    tier = PAYMENT_RATES.MEDIUM_DISTANCE;
  } else if (distance <= PAYMENT_RATES.LONG_DISTANCE.maxDistance) {
    tier = PAYMENT_RATES.LONG_DISTANCE;
  } else {
    tier = PAYMENT_RATES.VERY_LONG_DISTANCE;
  }

  // Calculate distance fee
  const distanceFee = distance * tier.ratePerKm * multiplier;
  
  // Calculate total earning
  const totalEarning = tier.baseFee + distanceFee + bonus;

  return {
    distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
    tier: tier.name || 'standard',
    baseFee: tier.baseFee,
    ratePerKm: tier.ratePerKm,
    distanceFee: Math.round(distanceFee * 100) / 100, // Round to 2 decimal places
    bonus,
    multiplier,
    totalEarning: Math.round(totalEarning * 100) / 100,
    breakdown: {
      base: tier.baseFee,
      distance: Math.round(distanceFee * 100) / 100,
      bonus,
      total: Math.round(totalEarning * 100) / 100
    }
  };
}

/**
 * Calculate round-trip distance between two points
 * @param {number} lat1 - Starting point latitude
 * @param {number} lon1 - Starting point longitude
 * @param {number} lat2 - Destination latitude
 * @param {number} lon2 - Destination longitude
 * @returns {number} Round-trip distance in kilometers
 */
function calculateRoundTripDistance(lat1, lon1, lat2, lon2) {
  const oneWayDistance = calculateDistance(lat1, lon1, lat2, lon2);
  return oneWayDistance * 2; // Round trip = one way * 2
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lon1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lon2 - Second point longitude
 * @returns {number} Distance in kilometers (rounded to 2 decimal places)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 2 decimal places to avoid floating point precision issues
  return Math.round(distance * 100) / 100;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Get payment tier information
 * @param {number} distance - Distance in kilometers
 * @returns {object} Tier information
 */
function getPaymentTier(distance) {
  if (distance <= PAYMENT_RATES.SHORT_DISTANCE.maxDistance) {
    return {
      name: 'short',
      ...PAYMENT_RATES.SHORT_DISTANCE
    };
  } else if (distance <= PAYMENT_RATES.MEDIUM_DISTANCE.maxDistance) {
    return {
      name: 'medium',
      ...PAYMENT_RATES.MEDIUM_DISTANCE
    };
  } else if (distance <= PAYMENT_RATES.LONG_DISTANCE.maxDistance) {
    return {
      name: 'long',
      ...PAYMENT_RATES.LONG_DISTANCE
    };
  } else {
    return {
      name: 'very_long',
      ...PAYMENT_RATES.VERY_LONG_DISTANCE
    };
  }
}

export {
  calculateDeliveryPayment,
  calculateRoundTripDistance,
  calculateDistance,
  getPaymentTier,
  PAYMENT_RATES
};
