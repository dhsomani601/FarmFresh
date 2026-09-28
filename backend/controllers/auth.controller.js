import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne, execute } from '../db/database.js';
import { JWT_SECRET } from '../middleware/auth.js';

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

export function requestOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = queryOne('SELECT id, name, email FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ error: 'No user registered with this email address.' });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store in otps table
    execute('DELETE FROM otps WHERE email = ?', [email]);
    execute('INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?)', [email, otp, expiresAt]);

    console.log(`\n🔑 [OTP AUTHENTICATION] Generated OTP for ${email}: ${otp} (Valid for 10 mins)\n`);

    res.json({
      message: `OTP sent successfully to ${email}.`,
      otp, // Provided in response for easy testing
      expiresIn: '10 minutes'
    });
  } catch (err) {
    console.error('RequestOtp error:', err);
    res.status(500).json({ error: 'Failed to generate OTP.' });
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

    const record = queryOne('SELECT * FROM otps WHERE email = ? ORDER BY id DESC LIMIT 1', [email]);
    if (!record) {
      return res.status(400).json({ error: 'No active OTP found. Please request a new one.' });
    }

    if (Date.now() > record.expires_at) {
      execute('DELETE FROM otps WHERE email = ?', [email]);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp.trim() !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    }

    // Hash and update user password
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

    // Clean up used OTP
    execute('DELETE FROM otps WHERE email = ?', [email]);

    res.json({ message: 'Password changed successfully! You can now log in with your new password.' });
  } catch (err) {
    console.error('VerifyOtpAndChangePassword error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
}
