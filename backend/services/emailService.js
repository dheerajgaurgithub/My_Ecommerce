import nodemailer from 'nodemailer';
import { google } from 'googleapis';

class EmailService {
  constructor() {
    this.transporter = null;
    this.oauth2Client = null;
    this.initialize();
  }

  initialize() {
    console.log('Checking email service configuration...');
    console.log('SMTP_HOST:', process.env.SMTP_HOST ? '✓ Present' : '✗ Missing');
    console.log('SMTP_PORT:', process.env.SMTP_PORT ? '✓ Present' : '✗ Missing');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✓ Present' : '✗ Missing');
    console.log('SMTP_SECURE:', process.env.SMTP_SECURE ? '✓ Present' : '✗ Missing');

    // Use custom SMTP configuration
    if (process.env.SMTP_HOST && process.env.SMTP_PASS) {
      this.setupCustomSMTP();
    }
    // Fallback to OAuth2
    else if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_OAUTH_REFRESH_TOKEN) {
      this.setupOAuth2();
    }
    // Fallback to App Password
    else if (process.env.GMAIL_APP_PASSWORD && process.env.GMAIL_USER) {
      this.setupAppPassword();
    } else {
      console.error('Email service not initialized: Missing required environment variables');
      console.error('Required for Custom SMTP: SMTP_HOST, SMTP_PORT, SMTP_PASS, SMTP_SECURE');
      console.error('Required for OAuth2: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_OAUTH_REFRESH_TOKEN, GMAIL_USER');
      console.error('Required for App Password: GMAIL_USER, GMAIL_APP_PASSWORD');
    }
  }

  setupCustomSMTP() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.GMAIL_USER || process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      pool: true,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('Email service initialized with custom SMTP');
  }

  setupOAuth2() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_OAUTH_REDIRECT_URI
    );

    this.oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_OAUTH_REFRESH_TOKEN
    });

    async function getAccessToken() {
      const { token } = await this.oauth2Client.getAccessToken();
      return token;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_OAUTH_REFRESH_TOKEN,
        accessToken: getAccessToken.bind(this)
      },
      pool: true
    });

    console.log('Email service initialized with OAuth2');
  }

  setupAppPassword() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      },
      pool: true,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('Email service initialized with App Password');
  }

  async sendEmail({ to, subject, html, text }) {
    if (!this.transporter) {
      console.error('Email service not initialized');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.GMAIL_SENDER || process.env.GMAIL_USER,
        to,
        subject,
        html,
        text
      });

      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      // Try fallback with different configuration if connection fails
      if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET' || error.code === 'ENETUNREACH') {
        console.log('Connection failed, trying fallback configuration...');
        try {
          const fallbackTransporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_APP_PASSWORD
            },
            tls: {
              rejectUnauthorized: false
            }
          });

          const info = await fallbackTransporter.sendMail({
            from: process.env.GMAIL_SENDER || process.env.GMAIL_USER,
            to,
            subject,
            html,
            text
          });

          console.log('Email sent via fallback:', info.messageId);
          return true;
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }

      return false;
    }
  }

  async sendOTPEmail(email, otp, name) {
    const subject = 'Verify Your Email - Mahir & Friends';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Mahir & Friends</h1>
          </div>
          <div class="content">
            <h2>Hello ${name || 'there'},</h2>
            <p>Thank you for signing up! Please use the following One-Time Password (OTP) to verify your email address:</p>
            <div class="otp">${otp}</div>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Mahir & Friends. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({ to: email, subject, html });
  }

  async sendWelcomeEmail(email, name) {
    const subject = 'Welcome to Mahir & Friends!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Mahir & Friends!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name || 'there'},</h2>
            <p>We're thrilled to have you join our community! Your account has been successfully created.</p>
            <h3>What's next?</h3>
            <ul>
              <li>Explore our latest collection of premium fashion</li>
              <li>Create your wishlist and save favorites</li>
              <li>Enjoy exclusive member-only deals</li>
              <li>Track your orders in real-time</li>
            </ul>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/shop" class="button">Start Shopping</a>
            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Mahir & Friends. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({ to: email, subject, html });
  }

  async sendOrderConfirmationEmail(email, name, order) {
    const subject = `Order Confirmation - ${order.order_number}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name || 'there'},</h2>
            <p>Great news! Your order has been successfully placed.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> ${order.order_number}</p>
              <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              
              <h3>Items</h3>
              ${order.items.map(item => `
                <div class="item">
                  <span>${item.product_id?.name || 'Product'} x ${item.quantity}</span>
                  <span>₹${(item.product_id?.price || item.price) * item.quantity}</span>
                </div>
              `).join('')}
              
              <div class="total">
                <p>Total: ₹${order.total}</p>
              </div>
            </div>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/track-order" class="button">Track Your Order</a>
            
            <p>Thank you for shopping with Mahir & Friends!</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Mahir & Friends. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({ to: email, subject, html });
  }

  async sendDeliveryUpdateEmail(email, name, order, status) {
    const statusMessages = {
      'confirmed': 'Your order has been confirmed and is being processed.',
      'processing': 'Your order is being prepared for shipment.',
      'shipped': 'Your order has been shipped!',
      'out_for_delivery': 'Your order is out for delivery and will reach you soon.',
      'delivered': 'Your order has been delivered successfully!',
      'picked_up': 'Your order has been picked up by the delivery partner.',
      'in_transit': 'Your order is in transit to your location.'
    };

    const subject = `Order Update - ${order.order_number} - ${status.replace('_', ' ').toUpperCase()}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-box { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #667eea; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${name || 'there'},</h2>
            
            <div class="status-box">
              <h3>Order: ${order.order_number}</h3>
              <p><strong>Status:</strong> ${status.replace('_', ' ').toUpperCase()}</p>
              <p>${statusMessages[status] || 'Your order status has been updated.'}</p>
            </div>
            
            ${order.delivery?.pickupOTP ? `<p><strong>Pickup OTP:</strong> ${order.delivery.pickupOTP}</p>` : ''}
            ${order.delivery?.deliveryOTP ? `<p><strong>Delivery OTP:</strong> ${order.delivery.deliveryOTP}</p>` : ''}
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/track-order" class="button">Track Your Order</a>
          </div>
          <div class="footer">
            <p>&copy; 2024 Mahir & Friends. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({ to: email, subject, html });
  }
}

const emailService = new EmailService();
export default emailService;
