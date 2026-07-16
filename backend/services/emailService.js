import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config();

const ipv4Lookup = (hostname, options, callback) => {
  return dns.lookup(hostname, { family: 4 }, callback);
};

const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';

const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || process.env.GMAIL_SENDER || 'replybymahirandfriends@gmail.com',
  useGmail: process.env.USE_GMAIL === 'true',
  useGmailOAuth: process.env.USE_GMAIL_OAUTH === 'true',
  useGmailApi: process.env.USE_GMAIL_API === 'true' || (process.env.EMAIL_PROVIDER || '').toLowerCase() === 'gmailapi',
  useSendGrid: process.env.USE_SENDGRID === 'true' || !!process.env.SENDGRID_API_KEY,
  useCustomSMTP: !!process.env.SMTP_HOST && !!process.env.SMTP_PASS,
  enableEmailSending: process.env.ENABLE_EMAIL_SENDING === 'true' || isProd || process.env.NODE_ENV === 'production' || (process.env.SMTP_HOST && process.env.SMTP_PASS),
  
  gmail: {
    user: process.env.GMAIL_USER,
    password: process.env.GMAIL_APP_PASSWORD,
  },
  
  gmailOAuth: {
    user: process.env.GMAIL_USER,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_OAUTH_REFRESH_TOKEN,
    redirectUri: process.env.GMAIL_OAUTH_REDIRECT_URI || 'https://developers.google.com/oauthplayground',
  },
  
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.GMAIL_USER || process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
  },
  
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM,
    fromName: process.env.SENDGRID_FROM_NAME || 'Mahir & Friends',
  },
  
  gmailApi: {
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_OAUTH_REFRESH_TOKEN,
    sender: process.env.GMAIL_SENDER,
  }
};

const createTransporter = () => {
  try {
    if (EMAIL_CONFIG.useGmailApi) {
      return null;
    }
    
    if (
      EMAIL_CONFIG.useGmailOAuth &&
      EMAIL_CONFIG.gmailOAuth.user &&
      EMAIL_CONFIG.gmailOAuth.clientId &&
      EMAIL_CONFIG.gmailOAuth.clientSecret &&
      EMAIL_CONFIG.gmailOAuth.refreshToken
    ) {
      console.log('📧 Using Gmail OAuth2 configuration');
      const oAuth2Client = new google.auth.OAuth2(
        EMAIL_CONFIG.gmailOAuth.clientId,
        EMAIL_CONFIG.gmailOAuth.clientSecret,
        EMAIL_CONFIG.gmailOAuth.redirectUri
      );
      oAuth2Client.setCredentials({ refresh_token: EMAIL_CONFIG.gmailOAuth.refreshToken });

      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: EMAIL_CONFIG.gmailOAuth.user,
          clientId: EMAIL_CONFIG.gmailOAuth.clientId,
          clientSecret: EMAIL_CONFIG.gmailOAuth.clientSecret,
          refreshToken: EMAIL_CONFIG.gmailOAuth.refreshToken,
        },
      });
    }

    if (EMAIL_CONFIG.useCustomSMTP && EMAIL_CONFIG.smtp.host && EMAIL_CONFIG.smtp.password) {
      console.log('📧 Using custom SMTP configuration');
      return nodemailer.createTransport({
        host: EMAIL_CONFIG.smtp.host,
        port: EMAIL_CONFIG.smtp.port,
        secure: EMAIL_CONFIG.smtp.secure,
        auth: {
          user: EMAIL_CONFIG.smtp.user,
          pass: EMAIL_CONFIG.smtp.password,
        },
        pool: true,
        connectionTimeout: 20000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        family: 4,
        lookup: ipv4Lookup,
        tls: {
          rejectUnauthorized: false
        }
      });
    }
    
    if (EMAIL_CONFIG.useGmail && EMAIL_CONFIG.gmail.user && EMAIL_CONFIG.gmail.password) {
      console.log('📧 Using Gmail SMTP configuration');
      return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: EMAIL_CONFIG.gmail.user,
          pass: EMAIL_CONFIG.gmail.password,
        },
        family: 4,
        lookup: ipv4Lookup,
        connectionTimeout: 20000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        tls: {
          rejectUnauthorized: false
        }
      });
    }

    console.warn('⚠️ No SMTP configuration found');
    return null;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
};

const transporter = createTransporter();

const verifyTransporter = async () => {
  if (!transporter) return false;
  
  try {
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Email transporter verification failed:', error.message);
    return false;
  }
};

const buildGmailMime = ({ from, to, subject, text, html }) => {
  const boundary = 'mixed_' + Math.random().toString(16).slice(2);
  if (html && text) {
    return [
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      '',
      text,
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      '',
      html,
      `--${boundary}--` 
    ].join('\r\n');
  }
  const isHtml = !!html;
  const body = isHtml ? html : (text || '');
  const contentType = isHtml ? 'text/html; charset=UTF-8' : 'text/plain; charset=UTF-8';
  return [
    `Content-Type: ${contentType}`,
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    '',
    body
  ].join('\r\n');
};

const createOTPEmailTemplate = (otp, type = 'password-reset', name = '') => {
  const templates = {
    'password-reset': {
      subject: 'Your Mahir & Friends Password Reset Code',
      text: `Your password reset code is: ${otp}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nMahir & Friends Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Password Reset - Mahir & Friends</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #667eea; margin: 0; font-size: 28px;">Mahir & Friends</h1>
              <p style="color: #6b7280; margin-top: 5px;">Premium Fashion Store</p>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px;">Password Reset Code</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
              You requested a password reset for your Mahir & Friends account. Use the following code to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background-color: #f3f4f6; padding: 20px 30px; border-radius: 8px; border: 2px dashed #d1d5db;">
                <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${otp}</span>
              </div>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-weight: 500;">
                ⚠️ This code expires in 15 minutes
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <div style="text-align: center; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Mahir & Friends. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    },
    'email-verification': {
      subject: 'Verify Your Mahir & Friends Email Address',
      text: `Welcome to Mahir & Friends!\n\nYour verification code is: ${otp}\n\nThis code expires in 15 minutes.\n\nBest regards,\nMahir & Friends Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Email Verification - Mahir & Friends</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #667eea; margin: 0; font-size: 28px;">Welcome to Mahir & Friends!</h1>
              <p style="color: #6b7280; margin-top: 5px;">Premium Fashion Store</p>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px;">Verify Your Email Address</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
              Thanks for joining Mahir & Friends! Please verify your email address using the code below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background-color: #f3f4f6; padding: 20px 30px; border-radius: 8px; border: 2px dashed #d1d5db;">
                <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${otp}</span>
              </div>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-weight: 500;">
                ⚠️ This code expires in 15 minutes
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <div style="text-align: center; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Mahir & Friends. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  };
  
  return templates[type] || templates['password-reset'];
};

export const sendEmail = async ({ to, subject, text, html, attachments = [], type, otp }) => {
  const startTime = Date.now();
  
  try {
    if (!to || typeof to !== 'string') {
      throw new Error('Valid recipient email address is required');
    }
    
    if (otp && type) {
      const template = createOTPEmailTemplate(otp, type);
      subject = subject || template.subject;
      text = text || template.text;
      html = html || template.html;
    }
    
    if (!subject || (!text && !html)) {
      throw new Error('Subject and content (text or html) are required');
    }
    
    const emailData = { to, subject, text, html, attachments };
    const mailOptions = {
      from: `"${EMAIL_CONFIG.sendgrid.fromName}" <${EMAIL_CONFIG.from}>`,
      to,
      subject,
      text,
      html,
      attachments
    };
    
    if (!EMAIL_CONFIG.enableEmailSending) {
      console.log('📪 Email sending disabled. Logging email:', { to, subject, hasOtp: !!otp });
      return { 
        success: true, 
        message: 'Email sending disabled - logged only', 
        provider: 'none',
        deliveryTime: Date.now() - startTime
      };
    }
    
    let result = null;
    
    if (EMAIL_CONFIG.useGmailApi) {
      try {
        console.log('📧 Attempting to send via Gmail API to:', to);
        const { clientId, clientSecret, refreshToken, sender } = EMAIL_CONFIG.gmailApi;
        if (!clientId || !clientSecret || !refreshToken || !sender) {
          throw new Error('Gmail API selected but credentials are incomplete');
        }
        const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, 'https://developers.google.com/oauthplayground');
        oAuth2Client.setCredentials({ refresh_token: refreshToken });
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        const rawMime = buildGmailMime({
          from: sender,
          to,
          subject,
          text,
          html,
        });
        const raw = Buffer.from(rawMime).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        const resp = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
        result = {
          success: true,
          provider: 'gmailapi',
          messageId: resp?.data?.id || 'gmailapi-sent',
          deliveryTime: Date.now() - startTime,
        };
        console.log('✅ Email sent successfully via Gmail API');
        return result;
      } catch (error) {
        console.error('❌ Gmail API send failed:', error.message);
        console.log('🔄 Falling back to other email providers...');
      }
    }

    if (transporter) {
      try {
        console.log('📧 Attempting to send via SMTP to:', to);
        
        const info = await transporter.sendMail(mailOptions);
        result = {
          success: true,
          provider: EMAIL_CONFIG.useCustomSMTP ? 'smtp' : (EMAIL_CONFIG.useGmail ? 'gmail' : 'smtp'),
          messageId: info.messageId,
          deliveryTime: Date.now() - startTime
        };
        
        console.log('✅ Email sent successfully via SMTP');
        return result;
        
      } catch (error) {
        console.error('❌ SMTP send failed:', error.message);
        
        if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET' || error.code === 'ENETUNREACH' || error.code === 'ECONNECTION') {
          console.log('Connection failed, trying fallback configuration...');

          if (!mailOptions) {
            console.error('Fallback failed: mailOptions is not defined');
          }

          if (EMAIL_CONFIG.gmail.user && EMAIL_CONFIG.gmail.password) {
            try {
              const fallbackTransporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                  user: EMAIL_CONFIG.gmail.user,
                  pass: EMAIL_CONFIG.gmail.password
                },
                family: 4,
                lookup: ipv4Lookup,
                tls: {
                  rejectUnauthorized: false
                },
                connectionTimeout: 20000,
                greetingTimeout: 15000,
                socketTimeout: 20000
              });

              const fallbackInfo = await fallbackTransporter.sendMail(mailOptions);
              result = {
                success: true,
                provider: 'gmail-fallback',
                messageId: fallbackInfo.messageId,
                deliveryTime: Date.now() - startTime
              };
              
              console.log('✅ Email sent via fallback');
              return result;
            } catch (fallbackError) {
              console.error('Fallback also failed:', fallbackError.message);
            }
          } else {
            console.warn('Fallback skipped: Gmail credentials are not configured.');
          }

          if (EMAIL_CONFIG.useSendGrid && EMAIL_CONFIG.sendgrid.apiKey) {
            try {
              console.log('📧 Trying SendGrid fallback...');
              const sgTransport = nodemailer.createTransport({
                host: 'smtp.sendgrid.net',
                port: 587,
                secure: false,
                auth: {
                  user: 'apikey',
                  pass: EMAIL_CONFIG.sendgrid.apiKey
                },
                family: 4,
                lookup: ipv4Lookup,
                tls: {
                  rejectUnauthorized: false
                }
              });
              const sgInfo = await sgTransport.sendMail(mailOptions);
              result = {
                success: true,
                provider: 'sendgrid-fallback',
                messageId: sgInfo.messageId,
                deliveryTime: Date.now() - startTime
              };
              console.log('✅ Email sent via SendGrid fallback');
              return result;
            } catch (sendGridError) {
              console.error('SendGrid fallback also failed:', sendGridError.message);
            }
          }
        }
        
        throw error;
      }
    }
    
    const errorMsg = 'No email providers configured. Please set up at least one email provider.';
    throw new Error(errorMsg);
    
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    
    if (!isProd) {
      console.log('🔧 Development mode: Email error logged but not thrown');
      return {
        success: false,
        error: error.message,
        provider: 'none',
        deliveryTime: Date.now() - startTime
      };
    }
    
    throw error;
  }
};

export const sendOTPEmail = async (to, otp, type = 'password-reset', name = '') => {
  return sendEmail({ to, otp, type });
};

export const sendWelcomeEmail = async (email, name) => {
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
          <p>&copy; ${new Date().getFullYear()} Mahir & Friends. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
};

export const sendOrderConfirmationEmail = async (email, name, order) => {
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
          <p>&copy; ${new Date().getFullYear()} Mahir & Friends. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
};

export const sendDeliveryUpdateEmail = async (email, name, order, status) => {
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
          <p>&copy; ${new Date().getFullYear()} Mahir & Friends. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
};

if (EMAIL_CONFIG.enableEmailSending) {
  console.log(`📧 Email system initialized:`);
  console.log(`   • Environment: ${isProd ? 'production' : 'development'}`);
  console.log(`   • Custom SMTP: ${EMAIL_CONFIG.useCustomSMTP ? '✅' : '❌'}`);
  console.log(`   • Gmail (API): ${EMAIL_CONFIG.useGmailApi ? '✅' : '❌'}`);
  console.log(`   • Gmail (OAuth2): ${EMAIL_CONFIG.useGmailOAuth ? '✅' : '❌'}`);
  console.log(`   • Gmail (SMTP): ${EMAIL_CONFIG.useGmail ? '✅' : '❌'}`);
  console.log(`   • SMTP: ${!!transporter ? '✅' : '❌'}`);
  console.log(`   • From: ${EMAIL_CONFIG.from}`);

  if (transporter) {
    verifyTransporter().catch(error => {
      console.warn('⚠️ SMTP verification failed on startup:', error.message);
    });
  }
} else {
  console.log('📪 Email sending is disabled');
}

const emailService = {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendDeliveryUpdateEmail
};

export default emailService;
