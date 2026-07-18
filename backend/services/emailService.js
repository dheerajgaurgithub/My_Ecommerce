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
  useGmailOAuth: process.env.USE_GMAIL_OAUTH === 'true' || !!process.env.GMAIL_OAUTH_REFRESH_TOKEN,
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
    console.warn('⚠️ Email transporter verification failed (non-blocking):', error.message);
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
      subject: '🔐 Password Reset Code - Mahir & Friends',
      text: `Your password reset code is: ${otp}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nMahir & Friends Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Password Reset - Mahir & Friends</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div style="max-width: 600px; margin: 40px auto; background-color: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="font-size: 50px; margin-bottom: 10px;">🔐</div>
              <h1 style="color: #667eea; margin: 0; font-size: 32px; font-weight: bold;">Mahir & Friends</h1>
              <p style="color: #764ba2; margin-top: 5px; font-size: 16px;">Premium Fashion Store</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
              <p style="color: white; margin: 0; font-size: 18px; font-weight: bold;">Your Password Reset Code</p>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 25px; font-size: 15px;">
              You requested a password reset for your Mahir & Friends account. Use the following code to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px 40px; border-radius: 15px; box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);">
                <span style="font-family: 'Courier New', monospace; font-size: 42px; font-weight: bold; color: white; letter-spacing: 8px;">${otp}</span>
              </div>
            </div>
            
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 10px; border-left: 5px solid #f59e0b; margin: 25px 0;">
              <p style="margin: 0; color: #92400e; font-weight: bold; font-size: 15px;">
                ⏰ This code expires in 15 minutes
              </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 25px; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #333; font-size: 14px;">
                <strong style="color: #667eea;">🔒 Security Tip:</strong> Never share your OTP with anyone, even if they claim to represent Mahir & Friends.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </p>
            
            <hr style="border: none; border-top: 2px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Mahir & Friends. All rights reserved.</p>
              <p style="margin-top: 5px;">🌟 Delivering Excellence, Together 🌟</p>
            </div>
          </div>
        </body>
        </html>
      `
    },
    'email-verification': {
      subject: '✉️ Verify Your Email - Mahir & Friends',
      text: `Welcome to Mahir & Friends!\n\nYour verification code is: ${otp}\n\nThis code expires in 15 minutes.\n\nBest regards,\nMahir & Friends Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Email Verification - Mahir & Friends</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);">
          <div style="max-width: 600px; margin: 40px auto; background-color: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="font-size: 50px; margin-bottom: 10px;">✉️</div>
              <h1 style="color: #11998e; margin: 0; font-size: 32px; font-weight: bold;">Welcome to Mahir & Friends!</h1>
              <p style="color: #38ef7d; margin-top: 5px; font-size: 16px;">Premium Fashion Store</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 25px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
              <p style="color: white; margin: 0; font-size: 18px; font-weight: bold;">Verify Your Email Address</p>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 25px; font-size: 15px;">
              Thanks for joining Mahir & Friends! Please verify your email address using the code below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 25px 40px; border-radius: 15px; box-shadow: 0 5px 15px rgba(17, 153, 142, 0.3);">
                <span style="font-family: 'Courier New', monospace; font-size: 42px; font-weight: bold; color: white; letter-spacing: 8px;">${otp}</span>
              </div>
            </div>
            
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 10px; border-left: 5px solid #f59e0b; margin: 25px 0;">
              <p style="margin: 0; color: #92400e; font-weight: bold; font-size: 15px;">
                ⏰ This code expires in 15 minutes
              </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 25px; border-left: 4px solid #11998e;">
              <p style="margin: 0; color: #333; font-size: 14px;">
                <strong style="color: #11998e;">🎉 What's next?</strong> After verification, you'll have access to exclusive deals, personalized recommendations, and much more!
              </p>
            </div>
            
            <hr style="border: none; border-top: 2px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Mahir & Friends. All rights reserved.</p>
              <p style="margin-top: 5px;">🌟 Delivering Excellence, Together 🌟</p>
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
  const subject = '🎉 Welcome to Mahir & Friends!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
      <div style="max-width: 600px; margin: 40px auto; background-color: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="font-size: 60px; margin-bottom: 10px;">🎉</div>
          <h1 style="color: #f5576c; margin: 0; font-size: 32px; font-weight: bold;">Welcome to Mahir & Friends!</h1>
          <p style="color: #f093fb; margin-top: 5px; font-size: 16px;">Premium Fashion Store</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 25px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 18px; font-weight: bold;">Hello ${name || 'there'},</p>
          <p style="color: white; margin: 10px 0 0; font-size: 14px;">We're thrilled to have you join our community!</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #f5576c; font-size: 20px; margin-bottom: 20px; border-bottom: 2px solid #f093fb; padding-bottom: 10px;">
            🚀 What's next?
          </h3>
          <ul style="color: #333; padding-left: 20px; margin: 0; font-size: 15px;">
            <li style="margin-bottom: 15px; padding-left: 10px;">
              <span style="color: #f093fb; font-weight: bold;">Explore our latest collection</span> of premium fashion
            </li>
            <li style="margin-bottom: 15px; padding-left: 10px;">
              <span style="color: #f093fb; font-weight: bold;">Create your wishlist</span> and save favorites
            </li>
            <li style="margin-bottom: 15px; padding-left: 10px;">
              <span style="color: #f093fb; font-weight: bold;">Enjoy exclusive member-only deals</span>
            </li>
            <li style="margin-bottom: 0; padding-left: 10px;">
              <span style="color: #f093fb; font-weight: bold;">Track your orders</span> in real-time
            </li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/shop" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; box-shadow: 0 5px 15px rgba(240, 147, 251, 0.3);">
            Start Shopping 🛍️
          </a>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 25px; border-left: 4px solid #f093fb;">
          <p style="margin: 0; color: #333; font-size: 14px;">
            <strong style="color: #f5576c;">💡 Need Help?</strong> Feel free to reach out to our support team anytime.
          </p>
        </div>
        
        <div style="text-align: center; border-top: 2px solid #eee; margin-top: 30px; padding-top: 20px;">
          <p style="color: #f093fb; margin: 0; font-size: 16px; font-weight: bold;">Best regards,</p>
          <p style="color: #f5576c; margin: 5px 0 0; font-size: 14px;">Mahir & Friends Team</p>
          <div style="margin-top: 15px; color: #999; font-size: 12px;">
            🌟 Delivering Excellence, Together 🌟
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
};

export const sendOrderConfirmationEmail = async (email, name, order) => {
  const subject = `🛒 Order Confirmed - ${order.order_number}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);">
      <div style="max-width: 600px; margin: 40px auto; background-color: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="font-size: 60px; margin-bottom: 10px;">🛒</div>
          <h1 style="color: #11998e; margin: 0; font-size: 32px; font-weight: bold;">Order Confirmed!</h1>
          <p style="color: #38ef7d; margin-top: 5px; font-size: 16px;">Mahir & Friends</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 25px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 18px; font-weight: bold;">Hello ${name || 'there'},</p>
          <p style="color: white; margin: 10px 0 0; font-size: 14px;">Great news! Your order has been successfully placed.</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 15px; margin-bottom: 30px; border-left: 4px solid #11998e;">
          <h3 style="color: #11998e; font-size: 18px; margin: 0 0 15px;">📋 Order Details</h3>
          <p style="color: #333; margin: 5px 0; font-size: 14px;"><strong>Order Number:</strong> <span style="color: #38ef7d;">${order.order_number}</span></p>
          <p style="color: #333; margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        
        <div style="background: white; padding: 25px; margin-bottom: 30px; border-radius: 15px; border: 2px solid #e0e0e0;">
          <h3 style="color: #11998e; font-size: 18px; margin: 0 0 20px;">📦 Items</h3>
          ${order.items.map(item => `
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px;">
              <span style="color: #333;">${item.product_id?.name || 'Product'} x ${item.quantity}</span>
              <span style="color: #38ef7d; font-weight: bold;">₹${(item.product_id?.price || item.price) * item.quantity}</span>
            </div>
          `).join('')}
          
          <div style="text-align: right; margin-top: 20px; padding-top: 15px; border-top: 2px solid #11998e;">
            <p style="color: #11998e; margin: 0; font-size: 22px; font-weight: bold;">Total: ₹${order.total}</p>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/track-order" style="display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; box-shadow: 0 5px 15px rgba(17, 153, 142, 0.3);">
            Track Your Order 🚚
          </a>
        </div>
        
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 10px; margin-top: 25px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong style="color: #dc3545;">💡 Thank you</strong> for shopping with Mahir & Friends! We appreciate your business.
          </p>
        </div>
        
        <div style="text-align: center; border-top: 2px solid #eee; margin-top: 30px; padding-top: 20px;">
          <p style="color: #11998e; margin: 0; font-size: 16px; font-weight: bold;">Best regards,</p>
          <p style="color: #38ef7d; margin: 5px 0 0; font-size: 14px;">Mahir & Friends Team</p>
          <div style="margin-top: 15px; color: #999; font-size: 12px;">
            🌟 Delivering Excellence, Together 🌟
          </div>
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

  const statusColors = {
    'confirmed': '#667eea',
    'processing': '#f59e0b',
    'shipped': '#11998e',
    'out_for_delivery': '#38ef7d',
    'delivered': '#4CAF50',
    'picked_up': '#667eea',
    'in_transit': '#f093fb'
  };

  const statusEmoji = {
    'confirmed': '✅',
    'processing': '⏳',
    'shipped': '📦',
    'out_for_delivery': '🚚',
    'delivered': '🎉',
    'picked_up': '🛵',
    'in_transit': '📍'
  };

  const color = statusColors[status] || '#667eea';
  const emoji = statusEmoji[status] || '📋';

  const subject = `${emoji} Order Update - ${order.order_number} - ${status.replace('_', ' ').toUpperCase()}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Update</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);">
      <div style="max-width: 600px; margin: 40px auto; background-color: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="font-size: 60px; margin-bottom: 10px;">${emoji}</div>
          <h1 style="color: ${color}; margin: 0; font-size: 32px; font-weight: bold;">Order Update</h1>
          <p style="color: ${color}dd; margin-top: 5px; font-size: 16px;">Mahir & Friends</p>
        </div>
        
        <div style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 25px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 18px; font-weight: bold;">Hello ${name || 'there'},</p>
          <p style="color: white; margin: 10px 0 0; font-size: 14px;">Your order status has been updated!</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 15px; margin-bottom: 30px; border-left: 4px solid ${color};">
          <h3 style="color: ${color}; font-size: 18px; margin: 0 0 15px;">📋 Order: ${order.order_number}</h3>
          <p style="color: #333; margin: 5px 0; font-size: 14px;"><strong>Status:</strong> <span style="background: ${color}; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold;">${status.replace('_', ' ').toUpperCase()}</span></p>
          <p style="color: #666; margin: 10px 0 0; font-size: 14px;">${statusMessages[status] || 'Your order status has been updated.'}</p>
        </div>
        
        ${(order.delivery?.pickupOTP || order.delivery?.deliveryOTP) ? `
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong style="color: #dc3545;">🔐 OTP Information:</strong>
          </p>
          ${order.delivery?.pickupOTP ? `<p style="margin: 5px 0 0; color: #92400e; font-size: 14px;"><strong>Pickup OTP:</strong> <span style="background: #f59e0b; color: white; padding: 3px 10px; border-radius: 15px; font-weight: bold;">${order.delivery.pickupOTP}</span></p>` : ''}
          ${order.delivery?.deliveryOTP ? `<p style="margin: 5px 0 0; color: #92400e; font-size: 14px;"><strong>Delivery OTP:</strong> <span style="background: #f59e0b; color: white; padding: 3px 10px; border-radius: 15px; font-weight: bold;">${order.delivery.deliveryOTP}</span></p>` : ''}
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/track-order" style="display: inline-block; background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; box-shadow: 0 5px 15px rgba(${parseInt(color.slice(1,3),16)}, ${parseInt(color.slice(3,5),16)}, ${parseInt(color.slice(5,7),16)}, 0.3);">
            Track Your Order 🚚
          </a>
        </div>
        
        <div style="text-align: center; border-top: 2px solid #eee; margin-top: 30px; padding-top: 20px;">
          <p style="color: ${color}; margin: 0; font-size: 16px; font-weight: bold;">Best regards,</p>
          <p style="color: ${color}dd; margin: 5px 0 0; font-size: 14px;">Mahir & Friends Team</p>
          <div style="margin-top: 15px; color: #999; font-size: 12px;">
            🌟 Delivering Excellence, Together 🌟
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
};

export const sendFeedbackRequestEmail = async (email, name, orderId, orderNumber) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const subject = '📝 Share Your Experience - Mahir & Friends';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Feedback Request - Mahir & Friends</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <div style="max-width: 600px; margin: 40px auto; background-color: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="font-size: 50px; margin-bottom: 10px;">📦</div>
          <h1 style="color: #667eea; margin: 0; font-size: 32px; font-weight: bold;">Your Order Has Been Delivered!</h1>
          <p style="color: #764ba2; margin-top: 5px; font-size: 16px;">Order #${orderNumber}</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 18px; font-weight: bold;">We'd Love to Hear From You!</p>
        </div>
        
        <p style="color: #374151; line-height: 1.6; margin-bottom: 25px; font-size: 15px;">
          Hi ${name},<br><br>
          Your order has been successfully delivered! We hope you're happy with your purchase. Please take a moment to share your experience with us. Your feedback helps us improve our products and services.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${frontendUrl}/feedback?orderId=${orderId}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px 40px; border-radius: 15px; text-decoration: none; color: white; font-weight: bold; font-size: 16px; box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);">
            📝 Share Your Feedback
          </a>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 25px; border-left: 4px solid #667eea;">
          <p style="margin: 0; color: #333; font-size: 14px;">
            <strong style="color: #667eea;">🎁 Why share feedback?</strong> Your input helps us serve you better and earn exclusive rewards!
          </p>
        </div>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 10px; border-left: 5px solid #f59e0b; margin: 25px 0;">
          <p style="margin: 0; color: #92400e; font-weight: bold; font-size: 15px;">
            ⏰ This feedback link is valid for 7 days
          </p>
        </div>
        
        <hr style="border: none; border-top: 2px solid #eee; margin: 30px 0;">
        
        <div style="text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Mahir & Friends. All rights reserved.</p>
          <p style="margin-top: 5px;">🌟 Delivering Excellence, Together 🌟</p>
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

  // Run email verification in background - don't block server startup
  // This allows deployment to succeed even if SMTP is blocked
  setTimeout(() => {
    verifyTransporter();
  }, 2000);
} else {
  console.log('📪 Email sending is disabled');
}

const emailService = {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendDeliveryUpdateEmail,
  sendFeedbackRequestEmail
};

export default emailService;
