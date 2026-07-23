/**
 * Calculate complete route distance for delivery partner
 * Calculates distance from: Partner Current Location -> Store -> Customer Address
 * Also calculates payment based on total distance
 */

import { calculateDistance, calculateDeliveryPayment } from './calculateDeliveryPayment.js';

/**
 * Calculate complete route distance and payment for a delivery order
 * @param {object} partnerLocation - Delivery partner's current location {latitude, longitude}
 * @param {object} storeLocation - Store/pickup location {lat, lng} or {latitude, longitude}
 * @param {object} customerLocation - Customer delivery address {latitude, longitude}
 * @param {object} options - Additional options for payment calculation
 * @returns {object} Complete route information with distances and payment
 */
function calculateRouteDistance(partnerLocation, storeLocation, customerLocation, options = {}) {
  // Normalize store location format
  const storeLat = storeLocation.lat || storeLocation.latitude;
  const storeLng = storeLocation.lng || storeLocation.longitude;

  if (!partnerLocation?.latitude || !partnerLocation?.longitude) {
    throw new Error('Partner location is required');
  }
  if (!storeLat || !storeLng) {
    throw new Error('Store location is required');
  }
  if (!customerLocation?.latitude || !customerLocation?.longitude) {
    throw new Error('Customer location is required');
  }

  // Calculate individual distances
  const distancePartnerToStore = calculateDistance(
    partnerLocation.latitude,
    partnerLocation.longitude,
    storeLat,
    storeLng
  );

  const distanceStoreToCustomer = calculateDistance(
    storeLat,
    storeLng,
    customerLocation.latitude,
    customerLocation.longitude
  );

  // Calculate return distance (customer back to store or partner's preferred location)
  // For simplicity, we assume return to store for next pickup
  const distanceCustomerToStore = calculateDistance(
    customerLocation.latitude,
    customerLocation.longitude,
    storeLat,
    storeLng
  );

  // Total distance for payment (excluding partner to store)
  // Only include Store -> Customer and Customer -> Store (Return)
  const totalDistance = distanceStoreToCustomer + distanceCustomerToStore;

  // Calculate payment based on total distance
  const payment = calculateDeliveryPayment(totalDistance, options);

  return {
    partnerLocation: {
      latitude: partnerLocation.latitude,
      longitude: partnerLocation.longitude
    },
    storeLocation: {
      latitude: storeLat,
      longitude: storeLng
    },
    customerLocation: {
      latitude: customerLocation.latitude,
      longitude: customerLocation.longitude
    },
    distances: {
      partnerToStore: Math.round(distancePartnerToStore * 100) / 100,
      storeToCustomer: Math.round(distanceStoreToCustomer * 100) / 100,
      customerToStore: Math.round(distanceCustomerToStore * 100) / 100,
      total: Math.round(totalDistance * 100) / 100
    },
    payment: {
      ...payment,
      distance: Math.round(payment.distance * 100) / 100
    },
    routeSummary: {
      legs: [
        {
          from: 'Partner Location',
          to: 'Store (Pickup)',
          distance: Math.round(distancePartnerToStore * 100) / 100,
          includedInPayment: false
        },
        {
          from: 'Store (Pickup)',
          to: 'Customer (Delivery)',
          distance: Math.round(distanceStoreToCustomer * 100) / 100,
          includedInPayment: true
        },
        {
          from: 'Customer (Delivery)',
          to: 'Store (Return)',
          distance: Math.round(distanceCustomerToStore * 100) / 100,
          includedInPayment: true
        }
      ]
    }
  };
}

/**
 * Calculate distance from partner to store only
 * @param {object} partnerLocation - Partner's current location
 * @param {object} storeLocation - Store location
 * @returns {number} Distance in kilometers
 */
function calculatePartnerToStoreDistance(partnerLocation, storeLocation) {
  const storeLat = storeLocation.lat || storeLocation.latitude;
  const storeLng = storeLocation.lng || storeLocation.longitude;

  return calculateDistance(
    partnerLocation.latitude,
    partnerLocation.longitude,
    storeLat,
    storeLng
  );
}

/**
 * Calculate distance from store to customer only
 * @param {object} storeLocation - Store location
 * @param {object} customerLocation - Customer location
 * @returns {number} Distance in kilometers
 */
function calculateStoreToCustomerDistance(storeLocation, customerLocation) {
  const storeLat = storeLocation.lat || storeLocation.latitude;
  const storeLng = storeLocation.lng || storeLocation.longitude;

  return calculateDistance(
    storeLat,
    storeLng,
    customerLocation.latitude,
    customerLocation.longitude
  );
}

export {
  calculateRouteDistance,
  calculatePartnerToStoreDistance,
  calculateStoreToCustomerDistance
};
