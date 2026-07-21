import express from 'express';
import Store from '../models/Store.js';
import { auth } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get all stores (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const stores = await Store.find().sort({ name: 1 });
    res.json({ success: true, stores });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get active stores (public)
router.get('/active', async (req, res) => {
  try {
    const stores = await Store.find({ is_active: true }).sort({ name: 1 });
    res.json({ success: true, stores });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get nearby stores for delivery partner based on location
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, city, district, pincode } = req.query;

    let stores = [];
    
    // If coordinates provided, find stores within service radius
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ success: false, message: 'Invalid coordinates' });
      }

      const allStores = await Store.find({ is_active: true });
      
      allStores.forEach(store => {
        const distance = calculateDistance(
          latitude,
          longitude,
          store.coordinates.lat,
          store.coordinates.lng
        );

        const serviceRadius = store.serviceRadius || 50;
        
        if (distance <= serviceRadius) {
          stores.push({
            ...store.toObject(),
            distance,
            withinServiceArea: true
          });
        }
      });

      // Sort by distance
      stores.sort((a, b) => a.distance - b.distance);
    } 
    // If city/district/pincode provided, find stores in that area
    else if (city || district || pincode) {
      const matchQuery = { is_active: true };
      if (city) matchQuery['address.city'] = new RegExp(city, 'i');
      if (district) matchQuery['address.district'] = new RegExp(district, 'i');
      if (pincode) matchQuery['address.pincode'] = pincode;
      
      stores = await Store.find(matchQuery);
    } 
    // Return all active stores if no location info provided
    else {
      stores = await Store.find({ is_active: true });
    }

    res.json({
      success: true,
      stores,
      count: stores.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get nearest store based on coordinates (must come before /:id route)
router.get('/nearest', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates' });
    }

    // Calculate distance using Haversine formula
    const stores = await Store.find({ is_active: true });
    
    if (stores.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active stores found'
      });
    }
    
    let nearestStore = null;
    let minDistance = Infinity;
    const availableStores = [];

    stores.forEach(store => {
      const distance = calculateDistance(
        latitude,
        longitude,
        store.coordinates.lat,
        store.coordinates.lng
      );

      const serviceRadius = store.serviceRadius || 50; // Default 50km if not set
      
      // Check if user is within service radius
      if (distance <= serviceRadius) {
        availableStores.push({
          ...store.toObject(),
          distance,
          withinServiceArea: true
        });

        if (distance < minDistance) {
          minDistance = distance;
          nearestStore = {
            ...store.toObject(),
            distance,
            serviceRadius
          };
        }
      }
    });

    // If no store within service radius, return the nearest one anyway
    if (!nearestStore) {
      stores.forEach(store => {
        const distance = calculateDistance(
          latitude,
          longitude,
          store.coordinates.lat,
          store.coordinates.lng
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestStore = {
            ...store.toObject(),
            distance,
            serviceRadius: store.serviceRadius || 50,
            withinServiceArea: false
          };
        }
      });
    }

    res.json({
      success: true,
      store: nearestStore,
      distance: minDistance,
      distanceUnit: 'km',
      serviceRadius: nearestStore.serviceRadius,
      withinServiceArea: nearestStore.withinServiceArea !== false,
      availableStores: availableStores.sort((a, b) => a.distance - b.distance)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single store by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    res.json({ success: true, store });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new store (admin only)
router.post('/', [
  body('name').notEmpty().withMessage('Store name is required'),
  body('address.street').notEmpty().withMessage('Street address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('address.pincode').notEmpty().withMessage('Pincode is required'),
  body('coordinates.lat').isFloat().withMessage('Valid latitude is required'),
  body('coordinates.lng').isFloat().withMessage('Valid longitude is required'),
  body('serviceRadius').optional().isFloat().withMessage('Valid service radius is required')
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const store = new Store(req.body);
    await store.save();
    res.json({ success: true, store, message: 'Store created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update store (admin only)
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Store name cannot be empty'),
  body('address.street').optional().notEmpty().withMessage('Street address cannot be empty'),
  body('address.city').optional().notEmpty().withMessage('City cannot be empty'),
  body('address.state').optional().notEmpty().withMessage('State cannot be empty'),
  body('address.pincode').optional().notEmpty().withMessage('Pincode cannot be empty'),
  body('coordinates.lat').optional().isFloat().withMessage('Valid latitude is required'),
  body('coordinates.lng').optional().isFloat().withMessage('Valid longitude is required'),
  body('serviceRadius').optional().isFloat().withMessage('Valid service radius is required')
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const store = await Store.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    res.json({ success: true, store, message: 'Store updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete store (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    res.json({ success: true, message: 'Store deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle store active status
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    store.is_active = !store.is_active;
    await store.save();

    res.json({ success: true, store, message: `Store ${store.is_active ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to calculate distance between two coordinates using Haversine formula
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
  
  return distance;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

export default router;
