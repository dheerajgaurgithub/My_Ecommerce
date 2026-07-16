import express from 'express';
import DeliveryLocation from '../models/DeliveryLocation.js';

const router = express.Router();

// Check delivery by pincode
router.get('/check/:pincode', async (req, res) => {
  try {
    const location = await DeliveryLocation.findOne({ pincode: req.params.pincode });
    
    if (location) {
      res.json({ 
        success: true, 
        available: location.is_available,
        charge: location.is_free_delivery ? 0 : location.delivery_charge,
        days: location.estimated_days,
        free: location.is_free_delivery
      });
    } else {
      // Default fallback for non-served areas
      res.json({ 
        success: true, 
        available: false,
        charge: 99,
        days: 2,
        free: false
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all delivery locations
router.get('/locations', async (req, res) => {
  try {
    const locations = await DeliveryLocation.find();
    res.json({ success: true, locations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create delivery location
router.post('/locations', async (req, res) => {
  try {
    const location = new DeliveryLocation(req.body);
    await location.save();
    res.status(201).json({ success: true, location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update delivery location
router.patch('/locations/:id', async (req, res) => {
  try {
    const location = await DeliveryLocation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete delivery location
router.delete('/locations/:id', async (req, res) => {
  try {
    await DeliveryLocation.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Location deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Legacy routes for backward compatibility
router.get('/', async (req, res) => {
  try {
    const locations = await DeliveryLocation.find();
    res.json({ success: true, locations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const location = new DeliveryLocation(req.body);
    await location.save();
    res.status(201).json({ success: true, location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
