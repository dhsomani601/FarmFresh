import nodemailer from 'nodemailer';

let transporter = null;

// Initialize or get transporter
export async function getMailerTransporter() {
  if (transporter) return transporter;

  // Check if SMTP environment variables are provided (e.g. Gmail App Password, Brevo, SendGrid, Mailgun)
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;

  if (smtpUser && smtpPass) {
    try {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        connectionTimeout: 4000,
        greetingTimeout: 3000,
        socketTimeout: 5000
      });
      console.log(`📧 [Mailer] Configured SMTP transporter for ${smtpUser} via ${smtpHost}:${smtpPort}`);
      return transporter;
    } catch (e) {
      console.error('Failed to initialize custom SMTP:', e);
    }
  }

  // If no custom SMTP credentials provided, return null to avoid hanging network calls
  return null;
}

/**
 * Sends a real HTML OTP email to the user's inbox
 * @param {string} toEmail 
 * @param {string} otp 
 * @param {'registration'|'password_reset'} purpose 
 * @returns {Promise<{success: boolean, previewUrl?: string}>}
 */
export async function sendOtpEmail(toEmail, otp, purpose = 'registration') {
  const isRegistration = purpose === 'registration';
  const subject = isRegistration 
    ? '🌿 FreshMart — Verify Your Email (Registration OTP)' 
    : '🔑 FreshMart — Reset Your Password (Verification OTP)';

  const title = isRegistration ? 'Verify Your Account' : 'Password Reset Request';
  const lead = isRegistration
    ? 'Welcome to FreshMart! To complete your registration, please verify your email using the 6-digit code below:'
    : 'We received a request to reset your FreshMart password. Enter the 6-digit code below to set your new password:';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0e12; color: #f1f5f9; margin: 0; padding: 20px; }
        .wrapper { max-width: 520px; margin: 0 auto; background: #161920; border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .logo-row { text-align: center; margin-bottom: 24px; }
        .logo-icon { font-size: 40px; display: inline-block; margin-bottom: 8px; }
        .logo-brand { font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px; }
        .title { color: #f8fafc; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 8px; }
        .lead { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 20px; }
        .otp-box { display: inline-block; background: linear-gradient(135deg, #ff7a00, #ea580c); color: #ffffff !important; font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 12px 28px; border-radius: 12px; margin: 0 auto; box-shadow: 0 8px 24px rgba(255,122,0,0.35); text-decoration: none; }
        .timer { color: #64748b; font-size: 13px; margin-top: 16px; margin-bottom: 0; }
        .footer { text-align: center; color: #64748b; font-size: 12px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="logo-row">
          <div class="logo-icon">🛒</div>
          <div class="logo-brand">FreshMart</div>
          <div style="color: #ff7a00; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-top: 4px;">Farm-Fresh Harvests in 15 Minutes</div>
        </div>
        <div class="card">
          <h2 class="title">${title}</h2>
          <p class="lead">${lead}</p>
          <div class="otp-box">${otp}</div>
          <p class="timer">⏱️ Valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
        </div>
        <div class="footer">
          If you did not request this email, you can safely ignore it. Your account is completely secure.<br/>
          &copy; ${new Date().getFullYear()} FreshMart Organic Farms Inc.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const mailer = await getMailerTransporter();
    if (mailer) {
      const fromAddr = process.env.SMTP_FROM || `FreshMart <${process.env.SMTP_USER || 'no-reply@freshmart.in'}>`;
      const info = await mailer.sendMail({
        from: fromAddr,
        to: toEmail,
        subject,
        html,
        text: `Your FreshMart OTP code is: ${otp}. It will expire in 10 minutes.`
      });

      console.log(`\n📨 [REAL EMAIL SENT] To: ${toEmail} | MessageId: ${info.messageId}`);
      return { success: true };
    } else {
      console.log(`\n🔑 [EMAIL OTP READY] Recipient: ${toEmail} | Code: ${otp} (Valid 10 mins)`);
      console.log(`💡 [Mailer Tip] To deliver directly to external mailboxes, set SMTP_USER and SMTP_PASS in backend/.env\n`);
      return { success: false, notConfigured: true };
    }
  } catch (err) {
    console.error('Failed to send email:', err.message);
    return { success: false, error: err.message };
  }
}
