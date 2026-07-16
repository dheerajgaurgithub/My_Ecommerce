import { WebSocketServer as WSServer } from 'ws';
import jwt from 'jsonwebtoken';

class WebSocketServer {
  constructor(server) {
    this.wss = new WSServer({ server });
    this.clients = new Map(); // userId -> WebSocket connection
    this.adminClients = new Set(); // Admin connections
    this.deliveryPartnerClients = new Map(); // partnerId -> WebSocket connection

    this.setup();
  }

  setup() {
    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection');

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  async handleMessage(ws, data) {
    const { type, payload } = data;

    switch (type) {
      case 'auth':
        await this.handleAuth(ws, payload);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }

  async handleAuth(ws, payload) {
    try {
      const { token, role, userId } = payload;

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      ws.userId = decoded._id || userId;
      ws.role = role;

      if (role === 'admin') {
        this.adminClients.add(ws);
        console.log('Admin connected to WebSocket');
      } else if (role === 'delivery_partner') {
        this.deliveryPartnerClients.set(userId, ws);
        console.log('Delivery partner connected to WebSocket');
      } else {
        this.clients.set(userId, ws);
        console.log('User connected to WebSocket:', userId);
      }

      ws.send(JSON.stringify({ type: 'auth_success', userId: ws.userId }));
    } catch (error) {
      console.error('WebSocket auth error:', error);
      ws.send(JSON.stringify({ type: 'auth_error', message: 'Authentication failed' }));
      ws.close();
    }
  }

  handleDisconnect(ws) {
    if (ws.role === 'admin') {
      this.adminClients.delete(ws);
    } else if (ws.role === 'delivery_partner') {
      this.deliveryPartnerClients.delete(ws.userId);
    } else if (ws.userId) {
      this.clients.delete(ws.userId);
    }
    console.log('WebSocket disconnected');
  }

  // Broadcast to all users
  broadcast(type, data) {
    const message = JSON.stringify({ type, data });
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Send to specific user
  sendToUser(userId, type, data) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, data }));
    }
  }

  // Send to all admins
  sendToAdmins(type, data) {
    const message = JSON.stringify({ type, data });
    this.adminClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Send to specific delivery partner
  sendToDeliveryPartner(partnerId, type, data) {
    const client = this.deliveryPartnerClients.get(partnerId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, data }));
    }
  }

  // Broadcast to all delivery partners
  broadcastToDeliveryPartners(type, data) {
    const message = JSON.stringify({ type, data });
    this.deliveryPartnerClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Notify new order to admins
  notifyNewOrder(order) {
    this.sendToAdmins('new_order', {
      orderId: order._id,
      orderNumber: order.order_number,
      total: order.total,
      customerName: order.address_snapshot?.name || 'Customer',
      createdAt: order.createdAt
    });
  }

  // Notify order status update to user
  notifyOrderStatusUpdate(userId, order) {
    this.sendToUser(userId, 'order_status_update', {
      orderId: order._id,
      orderNumber: order.order_number,
      status: order.status,
      timeline: order.timeline
    });
  }

  // Notify delivery partner of new assignment
  notifyDeliveryPartnerAssignment(partnerId, order) {
    this.sendToDeliveryPartner(partnerId, 'new_delivery_assignment', {
      orderId: order._id,
      orderNumber: order.order_number,
      pickupAddress: order.delivery?.storeAddress,
      deliveryAddress: order.address_snapshot,
      pickupOTP: order.delivery?.pickupOTP,
      deliveryOTP: order.delivery?.deliveryOTP
    });
  }

  // Notify user of delivery partner location
  notifyDeliveryLocation(userId, location) {
    this.sendToUser(userId, 'delivery_location_update', location);
  }
}

export default WebSocketServer;
