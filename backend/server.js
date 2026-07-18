import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'dns';
import helmet from 'helmet';
import http from 'http';
import WebSocketServer from './websocket/index.js';

dns.setServers(["8.8.8.8","1.1.1.1"]);
// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Render deployment (trust only 1 hop for rate limiting security)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Create HTTP server for WebSocket
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer(server);

// Make WebSocket server globally accessible for route handlers
global.wss = wss;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://mahirandfriends.vercel.app',
    'https://mahirandfriends.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Connected");
  })
  .catch((err) => {
    console.error(err.name);
    console.error(err.message);
    console.error(err.reason);
    process.exit(1);
  });
// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import cartRoutes from './routes/cart.js';
import wishlistRoutes from './routes/wishlist.js';
import orderRoutes from './routes/orders.js';
import addressRoutes from './routes/addresses.js';
import reviewRoutes from './routes/reviews.js';
import couponRoutes from './routes/coupons.js';
import deliveryRoutes from './routes/delivery.js';
import deliveryPartnerRoutes from './routes/deliveryPartners.js';
import comboRoutes from './routes/combos.js';
import giftCardRoutes from './routes/giftCards.js';
import notificationRoutes from './routes/notifications.js';
import twoFactorRoutes from './routes/twoFactorAuth.js';
import recommendationRoutes from './routes/recommendations.js';
import otpRoutes from './routes/otp.js';
import googleAuthRoutes from './routes/googleAuth.js';
import newsletterRoutes from './routes/newsletter.js';
import contactRoutes from './routes/contact.js';
import feedbackRoutes from './routes/feedback.js';
import paymentRoutes from './routes/payments.js';
import { apiLimiter, authLimiter, orderLimiter } from './middleware/rateLimit.js';
import { auth } from './middleware/auth.js';

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/two-factor', auth, twoFactorRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/google', googleAuthRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api', apiLimiter);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/delivery-partners', deliveryPartnerRoutes);
app.use('/api/combos', comboRoutes);
app.use('/api/gift-cards', giftCardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/feedback', auth, feedbackRoutes);
app.use('/api/payments', auth, paymentRoutes);
app.use('/api/payments/webhook', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mahir & Friends API is running' });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Page Not Found</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          text-align: center;
          color: white;
          max-width: 500px;
        }
        .error-code {
          font-size: 120px;
          font-weight: bold;
          line-height: 1;
          margin-bottom: 20px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .message {
          font-size: 24px;
          margin-bottom: 10px;
        }
        .description {
          font-size: 16px;
          opacity: 0.9;
          margin-bottom: 30px;
          line-height: 1.6;
        }
        .brand {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 30px;
          letter-spacing: 2px;
        }
        .api-info {
          background: rgba(255,255,255,0.1);
          padding: 15px;
          border-radius: 10px;
          margin-top: 20px;
          font-size: 14px;
        }
        .api-info code {
          background: rgba(255,255,255,0.2);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">MAHIR & FRIENDS</div>
        <div class="error-code">404</div>
        <div class="message">Page Not Found</div>
        <div class="description">
          The page you're looking for doesn't exist or has been moved.<br>
          Please check the URL and try again.
        </div>
        <div class="api-info">
          <strong>API Endpoints:</strong><br>
          All API routes start with <code>/api/</code><br>
          Example: <code>/api/products</code>, <code>/api/orders</code>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server with WebSocket support
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`WebSocket server initialized`);
});
