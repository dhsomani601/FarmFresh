import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne, execute } from '../db/database.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { sendOtpEmail } from '../utils/mailer.js';

// Send OTP to user's real email for registration
export async function requestRegisterOtp(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store in otps table
    execute('DELETE FROM otps WHERE email = ?', [email.trim().toLowerCase()]);
    execute(
      'INSERT INTO otps (email, otp, type, expires_at) VALUES (?, ?, ?, ?)',
      [email.trim().toLowerCase(), otp, 'registration', expiresAt]
    );

    console.log(`\n🔑 [REGISTRATION OTP] Generated for ${email}: ${otp} (10 min expiry)`);

    // Dispatch real email via nodemailer safely with timeout so response is never stuck
    let emailDelivered = false;
    try {
      const emailResult = await Promise.race([
        sendOtpEmail(email.trim().toLowerCase(), otp, 'registration'),
        new Promise((resolve) => setTimeout(() => resolve({ success: false, timeout: true }), 3500))
      ]);
      emailDelivered = !!emailResult?.success;
    } catch (e) {
      console.warn('Email dispatch notice:', e.message);
    }

    res.json({
      message: `A 6-digit verification code has been dispatched to ${email}.`,
      emailDelivered,
      expiresIn: '10 minutes',
      expiresAt
    });
  } catch (err) {
    console.error('RequestRegisterOtp error:', err);
    res.status(500).json({ error: 'Failed to generate registration OTP.' });
  }
}

// Verify OTP and complete account creation
export async function verifyRegisterOtp(req, res) {
  try {
    const { name, email, password, otp, avatar } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ error: 'All fields including the verification OTP are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify OTP record
    const record = queryOne(
      "SELECT * FROM otps WHERE email = ? AND type = 'registration' ORDER BY id DESC LIMIT 1",
      [cleanEmail]
    );

    if (!record) {
      return res.status(400).json({ error: 'No active verification code found. Please request a new code.' });
    }

    if (Date.now() > record.expires_at) {
      execute('DELETE FROM otps WHERE email = ?', [cleanEmail]);
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    if (record.otp.trim() !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification code. Please check your email and try again.' });
    }

    // Check existing email one more time
    const existing = queryOne('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Create user
    const userAvatar = avatar || '🧑‍🍳';
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = execute(
      'INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)',
      [name.trim(), cleanEmail, hashedPassword, userAvatar]
    );

    // Delete used OTP
    execute('DELETE FROM otps WHERE email = ?', [cleanEmail]);

    const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account verified and created successfully!',
      token,
      user: { id: result.lastInsertRowid, name: name.trim(), email: cleanEmail, avatar: userAvatar }
    });
  } catch (err) {
    console.error('VerifyRegisterOtp error:', err);
    res.status(500).json({ error: 'Failed to complete registration.' });
  }
}

export function register(req, res) {
  try {
    const { name, email, password, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const userAvatar = avatar || '🧑‍🍳';
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = execute('INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, userAvatar]);

    const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: result.lastInsertRowid, name, email, avatar: userAvatar }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to create account.' });
  }
}

export function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful!',
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone || '', address: user.address || '', avatar: user.avatar || '🧑‍🍳' }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
}

export function getMe(req, res) {
  try {
    const user = queryOne('SELECT id, name, email, phone, address, avatar, created_at FROM users WHERE id = ?', [req.userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: { ...user, avatar: user.avatar || '🧑‍🍳' } });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ error: 'Failed to get user info.' });
  }
}

export function updateProfile(req, res) {
  try {
    const { name, phone, address, avatar } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    const current = queryOne('SELECT avatar FROM users WHERE id = ?', [req.userId]);
    const chosenAvatar = avatar || current?.avatar || '🧑‍🍳';

    execute(
      'UPDATE users SET name = ?, phone = ?, address = ?, avatar = ? WHERE id = ?',
      [name, phone || '', address || '', chosenAvatar, req.userId]
    );

    const user = queryOne('SELECT id, name, email, phone, address, avatar, created_at FROM users WHERE id = ?', [req.userId]);
    res.json({ message: 'Profile updated successfully!', user });
  } catch (err) {
    console.error('UpdateProfile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
}

export async function requestOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = queryOne('SELECT id, name, email FROM users WHERE email = ?', [cleanEmail]);
    if (!user) {
      return res.status(404).json({ error: 'No user registered with this email address.' });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store in otps table
    execute('DELETE FROM otps WHERE email = ?', [cleanEmail]);
    execute('INSERT INTO otps (email, otp, type, expires_at) VALUES (?, ?, ?, ?)', [cleanEmail, otp, 'password_reset', expiresAt]);

    console.log(`\n🔑 [PASSWORD RESET OTP] Generated for ${cleanEmail}: ${otp} (10 min expiry)`);

    // Dispatch real email via nodemailer safely with timeout so response is never stuck
    let emailDelivered = false;
    try {
      const emailResult = await Promise.race([
        sendOtpEmail(cleanEmail, otp, 'password_reset'),
        new Promise((resolve) => setTimeout(() => resolve({ success: false, timeout: true }), 3500))
      ]);
      emailDelivered = !!emailResult?.success;
    } catch (e) {
      console.warn('Email dispatch notice:', e.message);
    }

    res.json({
      message: `A 6-digit password reset code has been dispatched to ${cleanEmail}.`,
      emailDelivered,
      expiresIn: '10 minutes',
      expiresAt
    });
  } catch (err) {
    console.error('RequestOtp error:', err);
    res.status(500).json({ error: 'Failed to generate reset OTP.' });
  }
}

export function verifyOtpAndChangePassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const record = queryOne(
      "SELECT * FROM otps WHERE email = ? AND (type = 'password_reset' OR type IS NULL) ORDER BY id DESC LIMIT 1",
      [cleanEmail]
    );
    if (!record) {
      return res.status(400).json({ error: 'No active OTP found. Please request a new one.' });
    }

    if (Date.now() > record.expires_at) {
      execute('DELETE FROM otps WHERE email = ?', [cleanEmail]);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp.trim() !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    }

    // Hash and update user password
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, cleanEmail]);

    // Clean up used OTP
    execute('DELETE FROM otps WHERE email = ?', [cleanEmail]);

    res.json({ message: 'Password changed successfully! You can now log in with your new password.' });
  } catch (err) {
    console.error('VerifyOtpAndChangePassword error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
}
