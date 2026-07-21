import express from 'express';
import Address from '../models/Address.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get user's addresses
router.get('/', auth, async (req, res) => {
  try {
    const addresses = await Address.find({ user_id: req.user._id }).sort({ is_default: -1 });
    res.json({ success: true, addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create address
router.post('/', auth, async (req, res) => {
  try {
    const { full_name, phone, pincode, address_line, city, state, is_default = false, latitude, longitude, google_maps_link } = req.body;

    // If setting as default, unset other defaults
    if (is_default) {
      await Address.updateMany({ user_id: req.user._id }, { is_default: false });
    }

    const address = new Address({
      user_id: req.user._id,
      full_name,
      phone,
      pincode,
      address_line,
      city,
      state,
      country: 'India',
      is_default,
      latitude: latitude || 0,
      longitude: longitude || 0,
      google_maps_link: google_maps_link || ''
    });

    await address.save();
    res.status(201).json({ success: true, address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update address
router.put('/:id', auth, async (req, res) => {
  try {
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      req.body,
      { new: true }
    );
    
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    res.json({ success: true, address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete address
router.delete('/:id', auth, async (req, res) => {
  try {
    await Address.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Set default address
router.patch('/:id/default', auth, async (req, res) => {
  try {
    await Address.updateMany({ user_id: req.user._id }, { is_default: false });
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { is_default: true },
      { new: true }
    );
    res.json({ success: true, address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
