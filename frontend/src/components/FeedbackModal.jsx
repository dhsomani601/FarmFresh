import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Toast from './Toast';
import './FeedbackModal.css';

export default function FeedbackModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState('Product Freshness');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setToast({ type: 'error', message: 'Please fill in name, email, and your suggestion.' });
      return;
    }

    try {
      setSubmitting(true);
      await api.submitFeedback({
        name,
        email,
        rating,
        category,
        message
      });
      setToast({
        type: 'success',
        message: 'Thank you! Your feedback has been sent to our team.'
      });
      setMessage('');
      setTimeout(() => {
        setIsOpen(false);
      }, 1200);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to submit feedback.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        className="floating-feedback-btn"
        onClick={() => setIsOpen(true)}
        aria-label="Give Feedback"
        title="Share your feedback & suggestions"
      >
        <span className="floating-feedback-icon">💬</span>
        <span className="floating-feedback-text">Feedback</span>
      </button>

      {/* Modal Backdrop & Dialog */}
      {isOpen && (
        <div className="feedback-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div
            className="feedback-modal-card glass-card animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="feedback-modal-header">
              <div>
                <span className="modal-badge">💬 Feedback & Suggestions</span>
                <h3 className="feedback-modal-title">Help Us Improve FreshMart</h3>
              </div>
              <button
                type="button"
                className="feedback-modal-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="feedback-modal-form">
              {/* Star Rating */}
              <div className="modal-star-group">
                <label className="modal-label">How would you rate your experience?</label>
                <div className="modal-stars-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`modal-star-btn ${rating >= star ? 'filled' : ''}`}
                      onClick={() => setRating(star)}
                      title={`${star} Star`}
                    >
                      ⭐
                    </button>
                  ))}
                  <span className="modal-star-label">
                    {rating === 5 ? 'Exceptional! 🌟' : rating === 4 ? 'Great 👍' : rating === 3 ? 'Fair 😐' : 'Needs work ⚠️'}
                  </span>
                </div>
              </div>

              {/* Category */}
              <div className="input-group">
                <label htmlFor="modal-cat">Topic</label>
                <select
                  id="modal-cat"
                  className="input-field"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Product Freshness">🥑 Product Freshness & Quality</option>
                  <option value="Delivery Speed">⚡ Delivery Speed</option>
                  <option value="New Product Request">🛒 New Product Request</option>
                  <option value="Website & App Experience">📱 Website & Mobile Experience</option>
                  <option value="Pricing & Discounts">₹ Pricing & Discounts</option>
                  <option value="General Suggestion">💡 General Suggestion</option>
                </select>
              </div>

              {/* Name & Email Row */}
              <div className="modal-two-col">
                <div className="input-group">
                  <label htmlFor="modal-name">Your Name *</label>
                  <input
                    type="text"
                    id="modal-name"
                    className="input-field"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="modal-email">Email Address *</label>
                  <input
                    type="email"
                    id="modal-email"
                    className="input-field"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Message */}
              <div className="input-group">
                <label htmlFor="modal-msg">Your Suggestion or Message *</label>
                <textarea
                  id="modal-msg"
                  className="input-field"
                  rows="3"
                  placeholder="Tell us what you loved or what we can do better..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? '⟳ Sending...' : 'Submit Suggestion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
}
