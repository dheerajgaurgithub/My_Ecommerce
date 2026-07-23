import Notification from '../models/Notification.js';

/**
 * Create a notification for admin
 */
export const createAdminNotification = async (title, message, type, orderId = null, customerName = null) => {
  try {
    const notification = new Notification({
      for_admin: true,
      title,
      message,
      type,
      order_id: orderId,
      customer_name: customerName,
      is_read: false
    });
    await notification.save();
    console.log('Admin notification created:', title);
  } catch (error) {
    console.error('Error creating admin notification:', error);
  }
};

/**
 * Create a notification for customer
 */
export const createCustomerNotification = async (userId, title, message, type, orderId = null) => {
  try {
    const notification = new Notification({
      user_id: userId,
      for_admin: false,
      title,
      message,
      type,
      order_id: orderId,
      is_read: false
    });
    await notification.save();
    console.log('Customer notification created:', title);
  } catch (error) {
    console.error('Error creating customer notification:', error);
  }
};

/**
 * Create a notification for delivery partner
 */
export const createDeliveryPartnerNotification = async (partnerId, title, message, type, orderId = null) => {
  try {
    const notification = new Notification({
      delivery_partner_id: partnerId,
      for_delivery_partner: true,
      title,
      message,
      type,
      order_id: orderId,
      is_read: false
    });
    await notification.save();
    console.log('Delivery partner notification created:', title);
  } catch (error) {
    console.error('Error creating delivery partner notification:', error);
  }
};

/**
 * Create notifications when order is placed
 */
export const notifyOrderPlaced = async (order) => {
  try {
    // Admin notification
    await createAdminNotification(
      'New Order Placed',
      `${order.userName || 'A customer'} has placed a new order #${order.orderNumber}`,
      'order_placed',
      order._id,
      order.userName
    );

    // Customer notification
    await createCustomerNotification(
      order.userId,
      'Order Placed Successfully',
      `Your order #${order.orderNumber} has been placed successfully`,
      'order_placed',
      order._id
    );
  } catch (error) {
    console.error('Error creating order placed notifications:', error);
  }
};

/**
 * Create notifications when order is confirmed
 */
export const notifyOrderConfirmed = async (order) => {
  try {
    // Customer notification
    await createCustomerNotification(
      order.userId,
      'Order Confirmed',
      `Your order #${order.orderNumber} has been confirmed and is being processed`,
      'order_confirmed',
      order._id
    );
  } catch (error) {
    console.error('Error creating order confirmed notifications:', error);
  }
};

/**
 * Create notifications when order is picked up by delivery partner
 */
export const notifyOrderPicked = async (order, partnerId = null) => {
  try {
    // Admin notification
    await createAdminNotification(
      'Order Picked Up',
      `Order #${order.orderNumber} has been picked up by delivery partner`,
      'order_picked',
      order._id,
      order.userName
    );

    // Customer notification
    await createCustomerNotification(
      order.userId,
      'Order Picked Up',
      `Your order #${order.orderNumber} has been picked up and is on its way`,
      'order_picked',
      order._id
    );

    // Delivery partner notification
    if (partnerId) {
      await createDeliveryPartnerNotification(
        partnerId,
        'Order Picked Successfully',
        `You have successfully picked up order #${order.orderNumber} from the store`,
        'order_picked',
        order._id
      );
    }
  } catch (error) {
    console.error('Error creating order picked notifications:', error);
  }
};

/**
 * Create notifications when order is out for delivery
 */
export const notifyOrderOutForDelivery = async (order, partnerId = null) => {
  try {
    // Customer notification
    await createCustomerNotification(
      order.userId,
      'Order Out for Delivery',
      `Your order #${order.orderNumber} is out for delivery. Delivery partner will reach you soon`,
      'order_out_for_delivery',
      order._id
    );

    // Delivery partner notification
    if (partnerId) {
      await createDeliveryPartnerNotification(
        partnerId,
        'Out for Delivery',
        `You are now out for delivery with order #${order.orderNumber}. Deliver as soon as possible`,
        'order_out_for_delivery',
        order._id
      );
    }
  } catch (error) {
    console.error('Error creating order out for delivery notifications:', error);
  }
};

/**
 * Create notifications when order is delivered
 */
export const notifyOrderDelivered = async (order, partnerId = null) => {
  try {
    // Admin notification
    await createAdminNotification(
      'Order Delivered',
      `Order #${order.orderNumber} has been delivered to ${order.userName || 'customer'}`,
      'order_delivered',
      order._id,
      order.userName
    );

    // Customer notification
    await createCustomerNotification(
      order.userId,
      'Order Delivered',
      `Your order #${order.orderNumber} has been successfully delivered`,
      'order_delivered',
      order._id
    );

    // Delivery partner notification
    if (partnerId) {
      await createDeliveryPartnerNotification(
        partnerId,
        'Order Delivered',
        `You have successfully delivered order #${order.orderNumber}`,
        'order_delivered',
        order._id
      );
    }
  } catch (error) {
    console.error('Error creating order delivered notifications:', error);
  }
};

/**
 * Create notification when order is assigned to delivery partner
 */
export const notifyOrderAssigned = async (order, partnerId) => {
  try {
    await createDeliveryPartnerNotification(
      partnerId,
      'New Order Assigned',
      `Order #${order.orderNumber} has been assigned to you`,
      'order_assigned',
      order._id
    );
  } catch (error) {
    console.error('Error creating order assigned notification:', error);
  }
};
