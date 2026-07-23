import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for admin notifications
  },
  delivery_partner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPartner',
    required: false // Optional for delivery partner notifications
  },
  for_admin: {
    type: Boolean,
    default: false
  },
  for_delivery_partner: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['order_placed', 'order_confirmed', 'order_picked', 'order_out_for_delivery', 'order_delivered', 'order_assigned', 'promotion'],
    default: 'promotion'
  },
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  customer_name: {
    type: String,
    required: false
  },
  is_read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

notificationSchema.index({ user_id: 1 });
notificationSchema.index({ for_admin: 1 });
notificationSchema.index({ delivery_partner_id: 1 });
notificationSchema.index({ for_delivery_partner: 1 });

export default mongoose.model('Notification', notificationSchema);
