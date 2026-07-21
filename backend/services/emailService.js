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
        encoding: 'utf-8',
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
        },
        encoding: 'utf-8',
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
        },
        encoding: 'utf-8',
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

  // Skip verification in production to prevent deployment failures
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ Email verification skipped in production');
    return true;
  }

  try {
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');
    return true;
  } catch (error) {
    console.warn('⚠️ Email transporter verification failed (non-blocking):', error.message);
    return false;
  }
};

const encodeHeader = (value) => {
  // Check if the value contains non-ASCII characters
  if (/^[\x00-\x7F]*$/.test(value)) {
    return value;
  }
  // Encode using RFC 2047 for UTF-8
  const encoded = Buffer.from(value, 'utf-8').toString('base64');
  return `=?UTF-8?B?${encoded}?=`;
};

const buildGmailMime = ({ from, to, subject, text, html }) => {
  const boundary = 'mixed_' + Math.random().toString(16).slice(2);
  const encodedSubject = encodeHeader(subject);
  const encodedFrom = encodeHeader(from);
  if (html && text) {
    return [
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      `From: ${encodedFrom}`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
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
    `From: ${encodedFrom}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    '',
    body
  ].join('\r\n');
};

const createOTPEmailTemplate = (otp, type = 'password-reset', name = '') => {
  const templates = {
    'password-reset': {
      subject: 'Password Reset Code - Mahir & Friends',
      text: `Your password reset code is: ${otp}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nMahir & Friends Team`,
      html: `
        <!DOCTYPE html>
        <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Password Reset | Mahir & Friends</title>

<style>
body{
    margin:0;
    padding:0;
    background:#f4f6f9;
    font-family:Arial,Helvetica,sans-serif;
}

table{
    border-spacing:0;
}

img{
    border:0;
    display:block;
    max-width:100%;
}

.wrapper{
    width:100%;
    table-layout:fixed;
    background:#f4f6f9;
    padding:40px 0;
}

.main{
    background:#ffffff;
    margin:0 auto;
    width:100%;
    max-width:600px;
    border-radius:12px;
    overflow:hidden;
    box-shadow:0 8px 30px rgba(0,0,0,.08);
}

.content{
    padding:40px;
}

h1{
    margin:0;
    color:#1f2937;
    font-size:28px;
    font-weight:700;
}

h2{
    margin:0;
    color:#111827;
    font-size:22px;
    font-weight:600;
}

p{
    color:#4b5563;
    font-size:15px;
    line-height:26px;
    margin:18px 0;
}

.otp-box{
    background:#0F4C81;
    color:#ffffff;
    font-size:38px;
    letter-spacing:10px;
    font-weight:bold;
    text-align:center;
    padding:22px;
    border-radius:10px;
    font-family:Courier New, monospace;
}

.info-box{
    background:#F8FAFC;
    border-left:4px solid #0F4C81;
    padding:18px;
    margin-top:30px;
}

.notice{
    background:#FEF3C7;
    border:1px solid #FCD34D;
    padding:18px;
    margin:25px 0;
    border-radius:8px;
    color:#92400E;
    font-size:14px;
}

.footer{
    border-top:1px solid #e5e7eb;
    padding:25px 40px;
    text-align:center;
    color:#9ca3af;
    font-size:13px;
}

.button{
    display:inline-block;
    padding:14px 30px;
    background:#0F4C81;
    color:#ffffff;
    text-decoration:none;
    border-radius:6px;
    font-weight:bold;
}

@media only screen and (max-width:600px){

.content{
padding:25px !important;
}

.footer{
padding:20px !important;
}

.otp-box{
font-size:30px !important;
letter-spacing:6px !important;
padding:18px !important;
}

h1{
font-size:24px !important;
}

h2{
font-size:20px !important;
}

}
</style>

</head>

<body>

<center class="wrapper">

<table class="main" width="600">

<!-- Content -->

<tr>

<td class="content">

<h2>Password Reset Request</h2>

<p>

Hello,

</p>

<p>

We received a request to reset the password associated with your Mahir & Friends account.

If you initiated this request, please use the One-Time Password (OTP) below to continue.

</p>

<div style="height:20px;"></div>

<div class="otp-box">

${otp}

</div>

<div class="notice">

<strong>OTP Validity</strong><br>

This verification code is valid for <strong>15 minutes</strong>. Once expired, you will need to request a new code.

</div>

<p>

For your security, never share this OTP with anyone. Mahir & Friends will never ask for your verification code via phone, email, or message.

</p>

<div class="info-box">

<strong>Didn't request a password reset?</strong>

<p style="margin:10px 0 0;color:#4b5563;">

If you did not request this password reset, you can safely ignore this email. Your account remains secure and no changes will be made unless this OTP is verified.

</p>

</div>

<p style="margin-top:35px;">

Thank you,

<br><br>

<strong>Mahir & Friends</strong>

<br>

Premium Fashion Store

</p>

</td>

</tr>

<!-- Footer -->

<tr>

<td class="footer">

<p style="margin:0;">

© ${new Date().getFullYear()} Mahir & Friends. All rights reserved.

</p>

<p style="margin-top:8px;">

This is an automated email. Please do not reply to this message.

</p>

</td>

</tr>

</table>

</center>

</body>

</html>
      `
    },
    'email-verification': {
      subject: '✉️ Verify Your Email - Mahir & Friends',
      text: `Welcome to Mahir & Friends!\n\nYour verification code is: ${otp}\n\nThis code expires in 15 minutes.\n\nBest regards,\nMahir & Friends Team`,
      html: `
        <!DOCTYPE html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Email Verification | Mahir & Friends</title>

<style>
body{
    margin:0;
    padding:0;
    background:#f4f6f9;
    font-family:Arial,Helvetica,sans-serif;
}

table{
    border-spacing:0;
}

img{
    border:0;
    display:block;
    max-width:100%;
}

.wrapper{
    width:100%;
    table-layout:fixed;
    background:#f4f6f9;
    padding:40px 0;
}

.main{
    width:100%;
    max-width:600px;
    margin:0 auto;
    background:#ffffff;
    border-radius:12px;
    overflow:hidden;
    box-shadow:0 8px 30px rgba(0,0,0,.08);
}

.content{
    padding:40px;
}


h1{
    margin:0;
    font-size:28px;
    color:#111827;
    font-weight:700;
}

.subtitle{
    margin-top:8px;
    color:#6b7280;
    font-size:15px;
}

.section-title{
    margin:35px 0 20px;
    padding:15px 20px;
    background:#0F4C81;
    color:#ffffff;
    font-size:20px;
    font-weight:600;
    border-radius:8px;
    text-align:center;
}

p{
    color:#4b5563;
    font-size:15px;
    line-height:26px;
    margin:18px 0;
}

.otp-box{
    margin:30px auto;
    padding:22px;
    background:#0F4C81;
    color:#ffffff;
    text-align:center;
    font-size:38px;
    font-family:Courier New, monospace;
    font-weight:bold;
    letter-spacing:10px;
    border-radius:10px;
}

.notice{
    background:#FEF3C7;
    border:1px solid #FCD34D;
    border-radius:8px;
    padding:18px;
    color:#92400E;
    font-size:14px;
    margin:25px 0;
}

.info-box{
    margin-top:30px;
    padding:18px;
    background:#F8FAFC;
    border-left:4px solid #0F4C81;
}

.footer{
    border-top:1px solid #e5e7eb;
    padding:25px 40px;
    text-align:center;
    color:#9ca3af;
    font-size:13px;
}

@media only screen and (max-width:600px){

.content{
padding:25px !important;
}

.footer{
padding:20px !important;
}

h1{
font-size:24px !important;
}

.section-title{
font-size:18px !important;
}

.otp-box{
font-size:30px !important;
letter-spacing:6px !important;
padding:18px !important;
}

}
</style>

</head>

<body>

<center class="wrapper">

<table class="main" role="presentation" cellpadding="0" cellspacing="0">

<tr>
<td class="content">

<h1 align="center">Welcome to Mahir & Friends</h1>

<p class="subtitle" align="center">
Premium Fashion Store
</p>

<div class="section-title">
Email Verification
</div>

<p>

Hello,

</p>

<p>

Thank you for creating your account with Mahir & Friends.

To complete your registration and verify your email address, please use the One-Time Password (OTP) below.

</p>

<div class="otp-box">

${otp}

</div>

<div class="notice">

<strong>Verification Code Validity</strong><br><br>

This verification code is valid for <strong>15 minutes</strong>. If the code expires, you can request a new one from the verification page.

</div>

<p>

For your security, never share this verification code with anyone. Mahir & Friends will never ask you for your OTP through phone calls, emails, or messages.

</p>

<div class="info-box">

<strong>After Verification</strong>

<p style="margin:10px 0 0;">

Once your email is verified, you'll be able to securely access your account, manage your orders, save your wishlist, receive exclusive offers, and enjoy a personalized shopping experience.

</p>

</div>

<p style="margin-top:35px;">

Thank you,

<br><br>

<strong>Mahir & Friends</strong>

<br>

Premium Fashion Store

</p>

</td>

</tr>

<tr>

<td class="footer">

<p style="margin:0;">

© ${new Date().getFullYear()} Mahir & Friends. All rights reserved.

</p>

<p style="margin-top:8px;">

This is an automated email. Please do not reply to this message.

</p>

</td>

</tr>

</table>

</center>

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
      from: `"Mahir & Friends" <${EMAIL_CONFIG.from}>`,
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
          from: `"Mahir & Friends" <${sender}>`,
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
        // In production, silently fail if SMTP is blocked (Render free tier)
        if (process.env.NODE_ENV === 'production' && (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET' || error.code === 'ENETUNREACH' || error.code === 'ECONNECTION')) {
          console.log('⚠️ Email skipped (SMTP blocked in production environment)');
          return { success: false, provider: 'smtp', skipped: true };
        }

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
                socketTimeout: 20000,
                encoding: 'utf-8',
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
                },
                encoding: 'utf-8',
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
<html lang="en">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Welcome | Mahir & Friends</title>

<style>

body{
    margin:0;
    padding:0;
    background:#f4f6f9;
    font-family:Arial,Helvetica,sans-serif;
}

table{
    border-spacing:0;
}

img{
    display:block;
    border:0;
    max-width:100%;
}

.wrapper{
    width:100%;
    background:#f4f6f9;
    padding:40px 0;
}

.main{
    width:100%;
    max-width:600px;
    margin:0 auto;
    background:#ffffff;
    border-radius:12px;
    overflow:hidden;
    box-shadow:0 8px 30px rgba(0,0,0,.08);
}

.content{
    padding:40px;
}

h1{
    margin:0;
    color:#111827;
    font-size:28px;
    font-weight:700;
}

.subtitle{
    margin-top:8px;
    color:#6b7280;
    font-size:15px;
}

.hero{
    margin:35px 0;
    padding:22px;
    background:#0F4C81;
    color:#ffffff;
    border-radius:8px;
    text-align:center;
}

.hero h2{
    margin:0;
    font-size:24px;
    font-weight:600;
}

.hero p{
    margin:12px 0 0;
    color:#ffffff;
    line-height:24px;
    font-size:15px;
}

p{
    color:#4b5563;
    font-size:15px;
    line-height:26px;
}

.feature-box{

    margin:30px 0;
    background:#F8FAFC;
    border-left:4px solid #0F4C81;
    padding:24px;

}

.feature-box h3{

    margin:0 0 20px;
    color:#111827;
    font-size:20px;

}

.feature-list{

    margin:0;
    padding-left:20px;

}

.feature-list li{

    margin-bottom:16px;
    color:#4b5563;
    line-height:24px;

}

.feature-list strong{

    color:#0F4C81;

}

.button{

display:inline-block;
padding:15px 36px;
background:#0F4C81;
color:#ffffff !important;
text-decoration:none;
border-radius:6px;
font-size:16px;
font-weight:bold;

}

.support{

margin-top:35px;
background:#F8FAFC;
border-left:4px solid #0F4C81;
padding:20px;

}

.footer{

border-top:1px solid #e5e7eb;
padding:25px 40px;
text-align:center;
color:#9ca3af;
font-size:13px;

}

@media only screen and (max-width:600px){

.content{
padding:25px !important;
}

.footer{
padding:20px !important;
}

.hero h2{
font-size:22px !important;
}

h1{
font-size:24px !important;
}

}

</style>

</head>

<body>

<center class="wrapper">

<table class="main" role="presentation" cellpadding="0" cellspacing="0">

<tr>

<td class="content">

<h1 align="center">

Welcome to Mahir & Friends

</h1>

<p class="subtitle" align="center">

Premium Fashion Store

</p>

<div class="hero">

<h2>

Hello ${name || 'Valued Customer'},

</h2>

<p>

Thank you for creating your account with Mahir & Friends. We are delighted to welcome you to our community and look forward to providing you with a premium shopping experience.

</p>

</div>

<p>

Your account has been successfully created and is now ready to use. Explore our latest collections, discover exclusive offers, and enjoy a seamless shopping experience tailored just for you.

</p>

<div class="feature-box">

<h3>

What You Can Do Next

</h3>

<ul class="feature-list">

<li>
<strong>Browse Our Latest Collections</strong><br>
Discover premium fashion for every occasion.
</li>

<li>
<strong>Create Your Wishlist</strong><br>
Save your favorite products for future purchases.
</li>

<li>
<strong>Access Exclusive Member Benefits</strong><br>
Receive early access to new arrivals and special offers.
</li>

<li>
<strong>Track Your Orders</strong><br>
Monitor your purchases and delivery status from your account dashboard.
</li>

</ul>

</div>

<div align="center" style="margin:40px 0;">

<a
class="button"
href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/shop">

Start Shopping

</a>

</div>

<div class="support">

<strong style="color:#111827;">

Need Assistance?

</strong>

<p style="margin:10px 0 0;">

Our customer support team is always available to assist you with any questions regarding your account, orders, or shopping experience.

</p>

</div>

<p style="margin-top:35px;">

Thank you for choosing us.

<br><br>

<strong>

Mahir & Friends

</strong>

<br>

Premium Fashion Store

</p>

</td>

</tr>

<tr>

<td class="footer">

<p style="margin:0;">

© ${new Date().getFullYear()} Mahir & Friends. All rights reserved.

</p>

<p style="margin-top:8px;">

This is an automated email. Please do not reply to this message.

</p>

</td>

</tr>

</table>

</center>

</body>

</html>
  `;

  return await sendEmail({ to: email, subject, html });
};

export const sendOrderConfirmationEmail = async (email, name, order) => {
  const subject = `🛒 Order Confirmed - ${order.order_number}`;
  const html = `
    <!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Order Confirmation | Mahir & Friends</title>

<style>

body{
    margin:0;
    padding:0;
    background:#f4f6f9;
    font-family:Arial,Helvetica,sans-serif;
}

table{
    border-spacing:0;
}

img{
    display:block;
    border:0;
    max-width:100%;
}

.wrapper{
    width:100%;
    background:#f4f6f9;
    padding:40px 0;
}

.main{
    width:100%;
    max-width:600px;
    margin:0 auto;
    background:#ffffff;
    border-radius:12px;
    overflow:hidden;
    box-shadow:0 8px 30px rgba(0,0,0,.08);
}

.content{
    padding:40px;
}


h1{
    margin:0;
    color:#111827;
    font-size:28px;
    font-weight:700;
}

.subtitle{
    margin-top:8px;
    color:#6b7280;
    font-size:15px;
}

.hero{
    margin:35px 0;
    background:#0F4C81;
    color:#ffffff;
    padding:24px;
    border-radius:8px;
    text-align:center;
}

.hero h2{
    margin:0;
    font-size:24px;
    font-weight:600;
}

.hero p{
    margin-top:12px;
    color:#ffffff;
    line-height:24px;
    font-size:15px;
}

.section{

    margin-top:30px;

}

.card{

    background:#F8FAFC;
    border-left:4px solid #0F4C81;
    padding:22px;
    border-radius:6px;

}

.card h3{

    margin:0 0 18px;
    color:#111827;
    font-size:20px;

}

.order-row{

    display:flex;
    justify-content:space-between;
    padding:12px 0;
    border-bottom:1px solid #e5e7eb;
    font-size:15px;
    color:#4b5563;

}

.total{

    display:flex;
    justify-content:space-between;
    margin-top:18px;
    padding-top:18px;
    border-top:2px solid #d1d5db;
    font-size:22px;
    font-weight:bold;
    color:#0F4C81;

}

.button{

display:inline-block;
padding:15px 34px;
background:#0F4C81;
color:#ffffff !important;
text-decoration:none;
border-radius:6px;
font-size:16px;
font-weight:bold;

}

.info{

margin-top:35px;
padding:20px;
background:#F8FAFC;
border-left:4px solid #0F4C81;

}

.footer{

border-top:1px solid #e5e7eb;
padding:25px 40px;
text-align:center;
font-size:13px;
color:#9ca3af;

}

@media only screen and (max-width:600px){

.content{
padding:25px !important;
}

.footer{
padding:20px !important;
}

.hero h2{
font-size:22px !important;
}

.order-row{
display:block !important;
}

.total{
display:block !important;
text-align:right;
}

}

</style>

</head>

<body>

<center class="wrapper">

<table class="main" role="presentation" cellpadding="0" cellspacing="0">

<tr>

<td class="content">

<h1 align="center">

Order Confirmation

</h1>

<p class="subtitle" align="center">

Premium Fashion Store

</p>

<div class="hero">

<h2>

Hello ${name || 'Valued Customer'},

</h2>

<p>

Thank you for shopping with Mahir & Friends. Your order has been successfully placed and is now being processed.

</p>

</div>

<div class="section">

<div class="card">

<h3>

Order Details

</h3>

<p style="margin:8px 0;">

<strong>Order Number:</strong>

${order.order_number}

</p>

<p style="margin:8px 0;">

<strong>Order Date:</strong>

${new Date(order.createdAt).toLocaleDateString()}

</p>

</div>

</div>

<div class="section">

<div class="card">

<h3>

Order Summary

</h3>

${order.items.map(item => `

<div class="order-row">

<span>

${item.product_id?.name || 'Product'}

× ${item.quantity}

</span>

<span>

₹${(item.product_id?.price || item.price) * item.quantity}

</span>

</div>

`).join('')}

<div class="total">

<span>Total</span>

<span>

₹${order.total}

</span>

</div>

</div>

</div>

<div align="center" style="margin:40px 0;">

<a
class="button"
href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/track-order">

Track Your Order

</a>

</div>

<div class="info">

<strong style="color:#111827;">

What Happens Next?

</strong>

<p style="margin:12px 0 0;">

• Your order is being prepared for shipment.<br><br>

• You will receive another email once your order has been dispatched.<br><br>

• You can track the latest delivery status anytime from your account dashboard.

</p>

</div>

<p style="margin-top:35px;">

Thank you for choosing us.

<br><br>

<strong>

Mahir & Friends

</strong>

<br>

Premium Fashion Store

</p>

</td>

</tr>

<tr>

<td class="footer">

<p style="margin:0;">

© ${new Date().getFullYear()} Mahir & Friends. All rights reserved.

</p>

<p style="margin-top:8px;">

This is an automated email. Please do not reply to this message.

</p>

</td>

</tr>

</table>

</center>

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
          <img src="https://drive.google.com/uc?export=view&id=1XGs1RdNl-HJ4trhcv_YSh_T36sTLuZwk" alt="Mahir & Friends Logo" style="width: 80px; height: 80px; margin-bottom: 15px;">
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

export const sendDeliveryUpdateEmail = async (email, name, order, status) => {
  const statusMessages = {
    confirmed:
      "Your order has been confirmed and is now being prepared.",

    processing:
      "Our team is currently preparing your order for shipment.",

    shipped:
      "Your order has been shipped and is on its way.",

    out_for_delivery:
      "Your package is out for delivery and should arrive soon.",

    delivered:
      "Your order has been successfully delivered. We hope you enjoy your purchase.",

    picked_up:
      "Your package has been collected by our delivery partner.",

    in_transit:
      "Your shipment is currently in transit to your delivery address."
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
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feedback Request</title>
</head>

<body style="margin:0;padding:0;background:#f4f6f9;font-family:Segoe UI,Arial,sans-serif;color:#333333;">

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f6f9;padding:40px 20px;">
<tr>
<td align="center">

<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">

<!-- Header -->
<tr>

<h1 style="margin:0;font-size:28px;color:#111827;font-weight:600;">
Thank You for Your Order
</h1>

<p style="margin:10px 0 0;color:#6b7280;font-size:15px;">
Order #${order.order_number}
</p>

</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:40px;">

<p style="margin:0 0 20px;font-size:16px;color:#111827;">
Hello ${name},
</p>

<p style="margin:0 0 18px;line-height:1.8;color:#4b5563;font-size:15px;">
Your order has been successfully delivered.
We sincerely appreciate your trust in Mahir & Friends.
</p>

<p style="margin:0 0 25px;line-height:1.8;color:#4b5563;font-size:15px;">
Your opinion is important to us. We would appreciate it if you could take a few moments to share your experience. Your feedback helps us continuously improve our products and services.
</p>

<!-- CTA -->

<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:35px auto;">
<tr>
<td bgcolor="#2563eb" style="border-radius:6px;">

<a href="${frontendUrl}/feedback?orderId=${orderId}"
style="
display:inline-block;
padding:15px 32px;
font-size:15px;
font-weight:600;
color:#ffffff;
text-decoration:none;">
Leave Your Feedback
</a>

</td>
</tr>
</table>

<!-- Information Box -->

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;margin-top:35px;">
<tr>
<td style="padding:20px;">

<p style="margin:0;font-size:15px;font-weight:600;color:#111827;">
Feedback Availability
</p>

<p style="margin:8px 0 0;font-size:14px;line-height:1.7;color:#6b7280;">
This feedback link will remain active for <strong>7 days</strong> from the date of delivery.
</p>

</td>
</tr>
</table>

<p style="margin:35px 0 0;line-height:1.8;color:#4b5563;font-size:15px;">
Thank you for choosing Mahir & Friends. We look forward to serving you again.
</p>

<p style="margin:30px 0 0;color:#111827;font-size:15px;">
Regards,
<br>
<strong>Mahir & Friends Team</strong>
</p>

</td>
</tr>

<!-- Footer -->

<tr>
<td style="padding:25px 40px;border-top:1px solid #ececec;background:#fafafa;">

<p style="margin:0;text-align:center;font-size:13px;color:#9ca3af;">
© ${new Date().getFullYear()} Mahir & Friends. All rights reserved.
</p>

<p style="margin:10px 0 0;text-align:center;font-size:13px;color:#9ca3af;">
This is an automated email. Please do not reply to this message.
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

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
