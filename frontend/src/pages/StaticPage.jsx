import { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Toast from '../components/Toast';
import './StaticPage.css';

const FAQS = [
  {
    q: 'How fast is FreshMart delivery?',
    a: 'We deliver within 15 to 30 minutes in all supported zip codes! Our local cold-chain micro-hubs are strategically located to ensure lightning-fast doorstep arrival.'
  },
  {
    q: 'What is your refund policy if an item is damaged or not fresh?',
    a: 'We provide an unconditional 24-hour return and replacement guarantee. Simply reach out via Customer Care or Feedback, and we will issue an instant refund in Indian Rupees (₹) to your original payment method or credit your wallet.'
  },
  {
    q: 'Are your fruits and vegetables really organic and pesticide-free?',
    a: 'Yes! We partner directly with certified organic farmers across India. Every batch is lab-tested and temperature-tracked before reaching your kitchen.'
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major Credit/Debit Cards, UPI (Google Pay, PhonePe, Paytm), Net Banking, and Cash on Delivery (COD) in Indian Rupees (₹).'
  },
  {
    q: 'Can I schedule a delivery for later today or tomorrow?',
    a: 'Yes, during checkout you can select between Instant Express (15-30 mins) or choose a convenient morning or evening delivery slot.'
  }
];

export default function StaticPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { slug: paramSlug } = useParams();
  const { user } = useAuth();

  // Normalize slug from param or pathname
  const activeSlug = (paramSlug || location.pathname.replace(/^\//, '') || 'about').toLowerCase();

  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(0);

  // Policy tab state
  const [policyTab, setPolicyTab] = useState('returns');

  // Customer Care Feedback Form state
  const [fbName, setFbName] = useState('');
  const [fbEmail, setFbEmail] = useState('');
  const [fbRating, setFbRating] = useState(5);
  const [fbCategory, setFbCategory] = useState('Product Freshness');
  const [fbMessage, setFbMessage] = useState('');
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (user) {
      setFbName(user.name || '');
      setFbEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        const res = await api.getPage(activeSlug === 'support' ? 'customer-care' : activeSlug);
        setPageData(res.page);
      } catch (err) {
        console.warn('API page fetch fallback:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSlug]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!fbName.trim() || !fbEmail.trim() || !fbMessage.trim()) {
      setToast({ type: 'error', message: 'Please fill in all required feedback fields.' });
      return;
    }

    try {
      setFbSubmitting(true);
      await api.submitFeedback({
        name: fbName,
        email: fbEmail,
        rating: fbRating,
        category: fbCategory,
        message: fbMessage
      });
      setToast({
        type: 'success',
        message: 'Thank you! Your feedback & suggestions have been submitted to our team.'
      });
      setFbMessage('');
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to submit feedback.' });
    } finally {
      setFbSubmitting(false);
    }
  };

  return (
    <div className="static-page page-container">
      <div className="container">
        {/* Navigation Pills Between Mandatory Pages */}
        <div className="static-nav-pills animate-fade-in-up">
          <button
            className={`static-nav-btn ${activeSlug === 'about' ? 'active' : ''}`}
            onClick={() => navigate('/about')}
          >
            🌱 About FreshMart
          </button>
          <button
            className={`static-nav-btn ${activeSlug === 'policy' ? 'active' : ''}`}
            onClick={() => navigate('/policy')}
          >
            🛡️ Privacy & Terms
          </button>
          <button
            className={`static-nav-btn ${activeSlug === 'customer-care' || activeSlug === 'support' ? 'active' : ''}`}
            onClick={() => navigate('/customer-care')}
          >
            📞 24x7 Customer Care & FAQs
          </button>
        </div>

        {/* ================= PAGE: ABOUT US ================= */}
        {activeSlug === 'about' && (
          <div className="static-view-wrapper animate-fade-in-up">
            <div className="static-header-center">
              <span className="static-badge">🌱 Farm to Table</span>
              <h1 className="static-main-title">About FreshMart</h1>
              <p className="static-lead-desc">
                Revolutionizing everyday grocery shopping across India with crisp farm-fresh harvest, ethical pricing in Indian Rupees (₹), and 15-minute express cold-chain delivery.
              </p>
            </div>

            {/* Impact Metrics Banner */}
            <div className="about-stats-grid">
              <div className="stat-card glass-card">
                <span className="stat-number">150+</span>
                <span className="stat-label">Direct Farm Partners</span>
                <span className="stat-sub">Across 8 Indian States</span>
              </div>
              <div className="stat-card glass-card">
                <span className="stat-number">15 Min</span>
                <span className="stat-label">Avg. Delivery Speed</span>
                <span className="stat-sub">Cold-chain insulated bags</span>
              </div>
              <div className="stat-card glass-card">
                <span className="stat-number">25,000+</span>
                <span className="stat-label">Happy Families</span>
                <span className="stat-sub">4.9 / 5 Average Rating</span>
              </div>
              <div className="stat-card glass-card">
                <span className="stat-number">100%</span>
                <span className="stat-label">Rupee Transparency</span>
                <span className="stat-sub">Zero hidden surcharges</span>
              </div>
            </div>

            {/* 4 Pillars Section */}
            <div className="pillars-section">
              <h2 className="section-title text-center">Our Four Core Commitments</h2>
              <p className="section-subtitle text-center">Why thousands of conscious families choose FreshMart every morning.</p>

              <div className="pillars-grid">
                <div className="pillar-card glass-card">
                  <span className="pillar-icon">🧑‍🌾</span>
                  <h3>Direct Farm Sourcing</h3>
                  <p>
                    We bypass exploitative middle-men by purchasing directly from local growers at 15-20% higher remuneration than traditional mandi rates.
                  </p>
                </div>
                <div className="pillar-card glass-card">
                  <span className="pillar-icon">❄️</span>
                  <h3>4°C Cold-Chain Freshness</h3>
                  <p>
                    Our micro-fulfillment hubs maintain precise temperature zones so berries, greens, dairy, and exotic vegetables retain crisp nutrients.
                  </p>
                </div>
                <div className="pillar-card glass-card">
                  <span className="pillar-icon">₹</span>
                  <h3>Fair Indian Rupee (₹) Pricing</h3>
                  <p>
                    Quality nutrition shouldn’t be a luxury. We offer farm-grade produce and premium pantry staples at budget-friendly everyday rates.
                  </p>
                </div>
                <div className="pillar-card glass-card">
                  <span className="pillar-icon">🌿</span>
                  <h3>Zero Single-Use Plastics</h3>
                  <p>
                    All deliveries arrive in 100% compostable paper bags or reusable cloth totes, reducing environmental footprint with every order.
                  </p>
                </div>
              </div>
            </div>

            {/* FreshMart Story Card */}
            <div className="story-card glass-card">
              <div className="story-content">
                <span className="story-badge">Our Origin Story</span>
                <h2>Born from a Desire for Real, Unadulterated Food</h2>
                <p>
                  In 2021, our founders realized that the fruits and vegetables found in urban supermarkets had spent 4 to 6 days in stale transit, losing their natural fragrance and vital vitamins. FreshMart was started with a simple belief:
                  <strong> harvested this morning, cooked in your kitchen this evening.</strong>
                </p>
                <p>
                  Today, FreshMart connects hundreds of regional organic farmers directly with urban households, creating a sustainable ecosystem where farmers thrive and families enjoy peak vitality.
                </p>
                <div className="story-cta-row">
                  <Link to="/products" className="btn btn-primary btn-lg">
                    🛒 Taste the Freshness — Shop Now
                  </Link>
                  <Link to="/customer-care" className="btn btn-secondary btn-lg">
                    💬 Have Questions? Contact Care
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= PAGE: PRIVACY & POLICIES ================= */}
        {activeSlug === 'policy' && (
          <div className="static-view-wrapper animate-fade-in-up">
            <div className="static-header-center">
              <span className="static-badge">🛡️ Security & Guarantees</span>
              <h1 className="static-main-title">Policies, Terms & Trust</h1>
              <p className="static-lead-desc">
                Clear, transparent guidelines designed to safeguard your privacy, transactions in Indian Rupees (₹), and customer rights.
              </p>
            </div>

            {/* Policy Sub Tabs */}
            <div className="policy-tabs-row">
              <button
                className={`policy-pill ${policyTab === 'returns' ? 'active' : ''}`}
                onClick={() => setPolicyTab('returns')}
              >
                🔄 24-Hr Refund & Return Guarantee
              </button>
              <button
                className={`policy-pill ${policyTab === 'privacy' ? 'active' : ''}`}
                onClick={() => setPolicyTab('privacy')}
              >
                🔒 Data Privacy & Protection
              </button>
              <button
                className={`policy-pill ${policyTab === 'payments' ? 'active' : ''}`}
                onClick={() => setPolicyTab('payments')}
              >
                💳 Payment & Rupee (₹) Security
              </button>
              <button
                className={`policy-pill ${policyTab === 'terms' ? 'active' : ''}`}
                onClick={() => setPolicyTab('terms')}
              >
                📜 Terms of Service
              </button>
            </div>

            <div className="policy-display-box glass-card">
              {policyTab === 'returns' && (
                <div className="policy-block animate-fade-in">
                  <div className="policy-block-header">
                    <span className="policy-icon">🔄</span>
                    <div>
                      <h2>24-Hour Freshness Guarantee & Instant ₹ Refunds</h2>
                      <p>No questions asked if your order does not meet 100% freshness standards.</p>
                    </div>
                  </div>
                  <div className="policy-points">
                    <div className="point-item">
                      <strong>✅ Instant Replacement or Credit:</strong> If any fruit, vegetable, dairy product, or bakery item is spoiled, bruised, or unsatisfactory, simply notify us within 24 hours of delivery.
                    </div>
                    <div className="point-item">
                      <strong>✅ Direct Rupee (₹) Reversal:</strong> Refunds are processed immediately back to your original payment method (UPI, Debit/Credit Card, or Net Banking) within 2-4 business hours.
                    </div>
                    <div className="point-item">
                      <strong>✅ Zero Hassle Returns:</strong> For perishable produce, you do not need to ship items back to our hub; our delivery partner will verify digitally or during their next visit.
                    </div>
                    <div className="point-item">
                      <strong>✅ Free Order Cancellation:</strong> You can cancel any order free of charge before it is dispatched from our local fulfillment store.
                    </div>
                  </div>
                </div>
              )}

              {policyTab === 'privacy' && (
                <div className="policy-block animate-fade-in">
                  <div className="policy-block-header">
                    <span className="policy-icon">🔒</span>
                    <div>
                      <h2>Personal Data Protection & Privacy Policy</h2>
                      <p>How we respect, encrypt, and secure your personal and location records.</p>
                    </div>
                  </div>
                  <div className="policy-points">
                    <div className="point-item">
                      <strong>🛡️ Minimal Data Collection:</strong> We collect only necessary details (Name, delivery address, contact number, order preferences) required to pack and dispatch your grocery cart.
                    </div>
                    <div className="point-item">
                      <strong>🚫 Zero Third-Party Sharing:</strong> FreshMart strictly never sells, rents, or monetizes your private information or browsing history to advertisers.
                    </div>
                    <div className="point-item">
                      <strong>🔑 Multi-Factor OTP Security:</strong> Sensitive account operations like password resets and delivery profile updates require One-Time Password (OTP) verification.
                    </div>
                    <div className="point-item">
                      <strong>🗑️ Right to Deletion:</strong> You have full rights to request complete deletion of your account and delivery records at any time through our Customer Care portal.
                    </div>
                  </div>
                </div>
              )}

              {policyTab === 'payments' && (
                <div className="policy-block animate-fade-in">
                  <div className="policy-block-header">
                    <span className="policy-icon">💳</span>
                    <div>
                      <h2>Payment Security & RBI Regulatory Compliance</h2>
                      <p>Industry-standard 256-bit SSL encryption for all transactions in Indian Rupees (₹).</p>
                    </div>
                  </div>
                  <div className="policy-points">
                    <div className="point-item">
                      <strong>🔒 PCI-DSS Compliant Gateways:</strong> We never store full credit or debit card numbers, CVVs, or bank PINs on our servers. All financial operations pass directly through certified payment gateways.
                    </div>
                    <div className="point-item">
                      <strong>🇮🇳 Official Rupee (₹) Currency:</strong> All prices, item discounts, and delivery fees are strictly computed in Indian Rupees (₹) with zero foreign transaction markups.
                    </div>
                    <div className="point-item">
                      <strong>📱 UPI & Cash on Delivery:</strong> Enjoy seamless, zero-contact one-click UPI checkout via Google Pay, PhonePe, and Paytm, or choose Cash on Delivery (COD).
                    </div>
                  </div>
                </div>
              )}

              {policyTab === 'terms' && (
                <div className="policy-block animate-fade-in">
                  <div className="policy-block-header">
                    <span className="policy-icon">📜</span>
                    <div>
                      <h2>Terms of Service & Delivery Guidelines</h2>
                      <p>Guidelines ensuring fair and equitable access for all community members.</p>
                    </div>
                  </div>
                  <div className="policy-points">
                    <div className="point-item">
                      <strong>📦 Order Limits & Fair Stock:</strong> To prevent hoarding and ensure equal availability of seasonal produce, certain high-demand essentials may have per-household quantity caps.
                    </div>
                    <div className="point-item">
                      <strong>📍 Accurate Delivery Location:</strong> Please provide valid landmark information and an active phone number to ensure our delivery champions can reach your residence on time.
                    </div>
                    <div className="point-item">
                      <strong>⚖️ Legal Jurisdiction:</strong> FreshMart services and agreements are governed by the Consumer Protection Acts and electronic commerce regulations of India.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= PAGE: CUSTOMER CARE & FEEDBACK ================= */}
        {(activeSlug === 'customer-care' || activeSlug === 'support') && (
          <div className="static-view-wrapper animate-fade-in-up">
            <div className="static-header-center">
              <span className="static-badge">📞 We Are Here 24x7</span>
              <h1 className="static-main-title">Customer Care & Support</h1>
              <p className="static-lead-desc">
                Have a question about your order, delivery timing, or want to share feedback? Our customer delight team is available round the clock.
              </p>
            </div>

            {/* Direct Contact Cards */}
            <div className="care-cards-grid">
              <a href="tel:18003737462" className="care-contact-card glass-card">
                <span className="care-icon-large">📞</span>
                <h3>Toll-Free Helpline</h3>
                <span className="care-primary-val">1800-FRESH-MART</span>
                <span className="care-sub-val">(1800-373-7462) • Click to Call</span>
              </a>

              <a href="mailto:support@freshmart.in" className="care-contact-card glass-card">
                <span className="care-icon-large">📧</span>
                <h3>Email Support</h3>
                <span className="care-primary-val">support@freshmart.in</span>
                <span className="care-sub-val">Avg. reply time &lt; 15 mins</span>
              </a>

              <div className="care-contact-card glass-card">
                <span className="care-icon-large">💬</span>
                <h3>Live WhatsApp Desk</h3>
                <span className="care-primary-val">+91 98765 43210</span>
                <span className="care-sub-val">Daily 6:00 AM - 11:00 PM IST</span>
              </div>

              <div className="care-contact-card glass-card">
                <span className="care-icon-large">📍</span>
                <h3>National Headquarters</h3>
                <span className="care-primary-val">FreshMart Hub, Sector 42</span>
                <span className="care-sub-val">Green Valley Tech City, India</span>
              </div>
            </div>

            {/* Split Grid: FAQ Accordion + Feedback / Suggestion Form */}
            <div className="care-split-grid">
              {/* Left Column: FAQ Accordion */}
              <div className="faq-column">
                <div className="column-header">
                  <span className="col-badge">❓ Common Questions</span>
                  <h2>Frequently Asked Questions</h2>
                </div>

                <div className="faq-accordion-list">
                  {FAQS.map((item, index) => (
                    <div
                      key={index}
                      className={`faq-item glass-card ${openFaq === index ? 'open' : ''}`}
                    >
                      <button
                        className="faq-question-btn"
                        onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                      >
                        <span>{item.q}</span>
                        <span className="faq-arrow">{openFaq === index ? '▲' : '▼'}</span>
                      </button>
                      {openFaq === index && (
                        <div className="faq-answer-body animate-fade-in">
                          <p>{item.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Feedback & Suggestions Form */}
              <div className="feedback-column">
                <div className="column-header">
                  <span className="col-badge">💬 We Value Your Voice</span>
                  <h2>Send Feedback & Suggestions</h2>
                </div>

                <form className="glass-card feedback-form-card" onSubmit={handleFeedbackSubmit}>
                  <p className="feedback-intro">
                    Help us improve your FreshMart experience. Tell us what you love or what products you’d like to see next!
                  </p>

                  {/* Star Rating Selector */}
                  <div className="star-rating-group">
                    <label className="input-label-strong">Your Overall Rating</label>
                    <div className="stars-row">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star-btn ${fbRating >= star ? 'filled' : ''}`}
                          onClick={() => setFbRating(star)}
                          title={`${star} Star${star > 1 ? 's' : ''}`}
                        >
                          ⭐
                        </button>
                      ))}
                      <span className="star-score-text">
                        {fbRating === 5 ? 'Excellent! 🌟' : fbRating === 4 ? 'Very Good 👍' : fbRating === 3 ? 'Average 😐' : 'Needs Improvement ⚠️'}
                      </span>
                    </div>
                  </div>

                  {/* Category Selector */}
                  <div className="input-group">
                    <label htmlFor="fb-cat">Topic / Category *</label>
                    <select
                      id="fb-cat"
                      className="input-field"
                      value={fbCategory}
                      onChange={(e) => setFbCategory(e.target.value)}
                    >
                      <option value="Product Freshness">🥑 Product Freshness & Quality</option>
                      <option value="Delivery Speed">⚡ Delivery Speed & Packaging</option>
                      <option value="New Product Request">🛒 New Product / Variety Request</option>
                      <option value="Website & App Experience">📱 Website & App Experience</option>
                      <option value="Pricing & Discounts">₹ Pricing & Discounts</option>
                      <option value="Customer Support">📞 Customer Support</option>
                      <option value="General Suggestion">💡 General Suggestion</option>
                    </select>
                  </div>

                  {/* Name & Email Row */}
                  <div className="feedback-two-col">
                    <div className="input-group">
                      <label htmlFor="fb-name">Your Name *</label>
                      <input
                        type="text"
                        id="fb-name"
                        className="input-field"
                        placeholder="e.g. Rahul Sharma"
                        value={fbName}
                        onChange={(e) => setFbName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="fb-email">Email Address *</label>
                      <input
                        type="email"
                        id="fb-email"
                        className="input-field"
                        placeholder="e.g. rahul@example.com"
                        value={fbEmail}
                        onChange={(e) => setFbEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Message / Suggestions */}
                  <div className="input-group">
                    <label htmlFor="fb-msg">Your Suggestion / Message *</label>
                    <textarea
                      id="fb-msg"
                      className="input-field"
                      rows="4"
                      placeholder="Share your thoughts, suggestions, or grocery requests with our team..."
                      value={fbMessage}
                      onChange={(e) => setFbMessage(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg feedback-submit-btn"
                    disabled={fbSubmitting}
                  >
                    {fbSubmitting ? '⟳ Submitting...' : '🚀 Send Feedback & Suggestions'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
