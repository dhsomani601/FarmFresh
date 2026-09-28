import { queryAll, execute } from '../db/database.js';

export function submitFeedback(req, res) {
  try {
    const { name, email, rating, category, message } = req.body;
    const userId = req.userId || null;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and feedback message are required.' });
    }

    const starRating = parseInt(rating) || 5;
    const cat = category || 'General';

    const result = execute(
      'INSERT INTO feedbacks (user_id, name, email, rating, category, message) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, email, starRating, cat, message]
    );

    res.status(201).json({
      message: 'Thank you for your valuable feedback! Our team reviews every suggestion.',
      id: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Submit feedback error:', err);
    res.status(500).json({ error: 'Failed to submit feedback. Please try again.' });
  }
}

export function getAllFeedbacks(req, res) {
  try {
    const feedbacks = queryAll('SELECT * FROM feedbacks ORDER BY created_at DESC');
    res.json({ feedbacks });
  } catch (err) {
    console.error('Get all feedbacks error:', err);
    res.status(500).json({ error: 'Failed to load feedbacks.' });
  }
}
