import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../utils/api';
import Toast from '../components/Toast';
import './CheckoutPage.css';

export default function CheckoutPage() {
  const { isAuthenticated, user } = useAuth();
  const { items, cartTotal, deliveryFee, grandTotal, fetchCart } = useCart();
  const navigate = useNavigate();

  // Shipping State
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState('standard'); // standard or express

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('card'); // card, upi, cod, netbanking
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState(user?.name || '');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  
  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');

  // Processing & Status
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isAuthenticated) fetchCart();
    if (user?.phone && !phone) setPhone(user.phone);
    if (user?.address && !address) setAddress(user.address);
  }, [isAuthenticated, fetchCart, user]);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Calculate totals
  const extraExpressFee = deliveryType === 'express' ? 29 : 0;
  const currentDelivery = deliveryFee + extraExpressFee;
  const discountAmount = Math.round(cartTotal * discountPercent * 100) / 100;
  const finalTotal = Math.max(0, Math.round((cartTotal - discountAmount + currentDelivery) * 100) / 100);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === 'FRESH10') {
      setDiscountPercent(0.10);
      setCouponMessage('🎉 Coupon FRESH10 applied! 10% discount');
    } else if (code === 'SAVE20') {
      setDiscountPercent(0.20);
      setCouponMessage('🔥 Coupon SAVE20 applied! 20% discount');
    } else {
      setCouponMessage('❌ Invalid coupon code. Try FRESH10');
      setDiscountPercent(0);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/[^0-9]/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();

    if (!address.trim()) {
      setToast({ type: 'error', message: 'Please enter your delivery street address.' });
      return;
    }

    if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        setToast({ type: 'error', message: 'Please enter a valid 16-digit card number.' });
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setToast({ type: 'error', message: 'Please enter card expiry MM/YY.' });
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setToast({ type: 'error', message: 'Please enter a valid 3-digit CVV.' });
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setToast({ type: 'error', message: 'Please enter a valid UPI ID (e.g. name@okhdfcbank).' });
        return;
      }
    }

    try {
      setIsProcessing(true);
      setProcessingStep('Connecting to secure payment gateway...');
      await new Promise(r => setTimeout(r, 700));

      setProcessingStep('Authorizing transaction...');
      await new Promise(r => setTimeout(r, 800));

      setProcessingStep('Confirming order with FreshMart fulfillment...');

      const fullAddress = `${address}, ${city || ''} ${postalCode || ''}`.trim();
      let paymentLabel = 'Credit Card';
      if (paymentMethod === 'card') {
        paymentLabel = `Card (ending in ${cardNumber.slice(-4) || '4242'})`;
      } else if (paymentMethod === 'upi') {
        paymentLabel = `UPI (${upiId})`;
      } else if (paymentMethod === 'cod') {
        paymentLabel = 'Cash on Delivery (COD)';
      } else if (paymentMethod === 'netbanking') {
        paymentLabel = `Net Banking (${selectedBank})`;
      }

      const res = await api.placeOrder({
        address: fullAddress,
        phone,
        paymentMethod: paymentLabel
      });

      setProcessingStep('Payment Verified! Generating your receipt...');
      await new Promise(r => setTimeout(r, 600));

      setOrderPlaced({
        ...res.order,
        paymentMethod: paymentLabel,
        deliveryType: deliveryType === 'express' ? '15-Min Express' : 'Standard 30-45 Mins',
        address: fullAddress,
        phone
      });
      await fetchCart();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Payment failed. Please try again.' });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // Order Confirmed View
  if (orderPlaced) {
    return (
      <div className="checkout-page page-container">
        <div className="container">
          <div className="order-success animate-fade-in-up" id="order-success">
            <div className="success-badge-icon">🎉</div>
            <h1 className="success-title">Payment Confirmed & Order Placed!</h1>
            <p className="success-subtitle">
              Thank you for shopping with FreshMart. Your groceries are being hand-picked fresh!
            </p>

            <div className="receipt-card glass-card">
              <div className="receipt-header">
                <div>
                  <span className="receipt-tag">Order Receipt</span>
                  <div className="receipt-id">#{orderPlaced.id}</div>
                </div>
                <span className="badge badge-green">✓ Confirmed</span>
              </div>

              <div className="receipt-divider" />

              <div className="receipt-grid">
                <div className="receipt-row">
                  <span className="r-label">Payment Method</span>
                  <span className="r-val">{orderPlaced.paymentMethod}</span>
                </div>
                <div className="receipt-row">
                  <span className="r-label">Amount Paid</span>
                  <span className="r-val font-bold text-accent">₹{Number(orderPlaced.total).toFixed(2)}</span>
                </div>
                <div className="receipt-row">
                  <span className="r-label">Estimated Delivery</span>
                  <span className="r-val">{orderPlaced.deliveryType}</span>
                </div>
                <div className="receipt-row">
                  <span className="r-label">Delivery Address</span>
                  <span className="r-val text-right">{orderPlaced.address}</span>
                </div>
                {orderPlaced.phone && (
                  <div className="receipt-row">
                    <span className="r-label">Contact Phone</span>
                    <span className="r-val">{orderPlaced.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="success-actions">
              <Link to="/orders" className="btn btn-primary btn-lg">
                📦 View Order in History
              </Link>
              <Link to="/products" className="btn btn-secondary btn-lg">
                🛍️ Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart guard
  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="checkout-page page-container">
        <div className="container">
          <div className="empty-cart animate-fade-in-up">
            <span className="empty-cart-icon">🛒</span>
            <h2>Your cart is currently empty</h2>
            <p>Add some fresh groceries before proceeding to checkout</p>
            <Link to="/products" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Browse Grocery Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page page-container">
      <div className="container">
        {/* Processing Overlay */}
        {isProcessing && (
          <div className="checkout-processing-overlay">
            <div className="processing-modal">
              <div className="spinner-large" />
              <h3>Processing Your Payment</h3>
              <p className="processing-step-text">{processingStep}</p>
              <div className="secure-badge">🔒 256-bit SSL Bank Encrypted</div>
            </div>
          </div>
        )}

        <div className="checkout-page-header animate-fade-in-up">
          <h1 className="page-title">💳 Secure Payment & Checkout</h1>
          <p className="page-subtitle">Complete your delivery and payment details to place your grocery order.</p>
        </div>

        <div className="checkout-layout">
          {/* Main Checkout Form */}
          <form className="checkout-form glass-card animate-fade-in-up" onSubmit={handleSubmitPayment} id="checkout-form">
            {/* Step 1: Delivery Details */}
            <div className="checkout-section">
              <div className="section-header-row">
                <span className="section-number">1</span>
                <div>
                  <h2 className="form-section-title">Delivery & Contact Details</h2>
                  <p className="form-section-sub">Where should we deliver your fresh groceries?</p>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label htmlFor="checkout-name">Recipient Name</label>
                  <input
                    type="text"
                    className="input-field"
                    id="checkout-name"
                    value={user?.name || ''}
                    disabled
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="checkout-phone">Phone Number *</label>
                  <input
                    type="tel"
                    className="input-field"
                    id="checkout-phone"
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="checkout-address">Street Address *</label>
                <input
                  type="text"
                  className="input-field"
                  id="checkout-address"
                  placeholder="e.g. Flat 402, Shanti Heights, MG Road, Koramangala"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label htmlFor="checkout-city">City</label>
                  <input
                    type="text"
                    className="input-field"
                    id="checkout-city"
                    placeholder="e.g. Mumbai, Bengaluru, Delhi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="checkout-zip">PIN Code *</label>
                  <input
                    type="text"
                    className="input-field"
                    id="checkout-zip"
                    placeholder="e.g. 560034 / 400001"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
              </div>

              {/* Delivery Speed Options */}
              <div className="delivery-speed-selector">
                <label className="delivery-option">
                  <input
                    type="radio"
                    name="deliverySpeed"
                    checked={deliveryType === 'standard'}
                    onChange={() => setDeliveryType('standard')}
                  />
                  <div className="delivery-info">
                    <strong>Standard Delivery (30-45 Mins)</strong>
                    <span>{deliveryFee === 0 ? 'FREE with your order' : '₹49'}</span>
                  </div>
                </label>
                <label className="delivery-option">
                  <input
                    type="radio"
                    name="deliverySpeed"
                    checked={deliveryType === 'express'}
                    onChange={() => setDeliveryType('express')}
                  />
                  <div className="delivery-info">
                    <strong>⚡ Priority Express (15-20 Mins)</strong>
                    <span>+₹29 express rush</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="section-divider" />

            {/* Step 2: Payment Method */}
            <div className="checkout-section">
              <div className="section-header-row">
                <span className="section-number">2</span>
                <div>
                  <h2 className="form-section-title">Select Payment Method</h2>
                  <p className="form-section-sub">All transactions are encrypted with bank-grade security.</p>
                </div>
              </div>

              {/* Payment Tabs */}
              <div className="payment-methods-grid">
                <button
                  type="button"
                  className={`payment-method-card ${paymentMethod === 'card' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <span className="payment-icon">💳</span>
                  <strong>Card</strong>
                  <span className="payment-sub">Credit / Debit</span>
                </button>

                <button
                  type="button"
                  className={`payment-method-card ${paymentMethod === 'upi' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('upi')}
                >
                  <span className="payment-icon">📱</span>
                  <strong>UPI / QR</strong>
                  <span className="payment-sub">Instant Pay</span>
                </button>

                <button
                  type="button"
                  className={`payment-method-card ${paymentMethod === 'cod' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <span className="payment-icon">💵</span>
                  <strong>Cash</strong>
                  <span className="payment-sub">On Delivery</span>
                </button>

                <button
                  type="button"
                  className={`payment-method-card ${paymentMethod === 'netbanking' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('netbanking')}
                >
                  <span className="payment-icon">🏦</span>
                  <strong>Net Banking</strong>
                  <span className="payment-sub">All Banks</span>
                </button>
              </div>

              {/* Card Form */}
              {paymentMethod === 'card' && (
                <div className="payment-inputs-panel animate-fade-in">
                  <div className="card-brands-row">
                    <span className="brand-chip">VISA</span>
                    <span className="brand-chip">Mastercard</span>
                    <span className="brand-chip">RuPay</span>
                    <span className="brand-chip">AMEX</span>
                  </div>

                  <div className="input-group">
                    <label htmlFor="card-number">Card Number</label>
                    <input
                      type="text"
                      className="input-field"
                      id="card-number"
                      maxLength="19"
                      placeholder="4532 •••• •••• ••••"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    />
                  </div>

                  <div className="form-grid-3">
                    <div className="input-group">
                      <label htmlFor="card-expiry">Expires</label>
                      <input
                        type="text"
                        className="input-field"
                        id="card-expiry"
                        maxLength="5"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="card-cvv">CVV</label>
                      <input
                        type="password"
                        className="input-field"
                        id="card-cvv"
                        maxLength="4"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))}
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="card-name">Name on Card</label>
                      <input
                        type="text"
                        className="input-field"
                        id="card-name"
                        placeholder="Cardholder Name"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* UPI Form */}
              {paymentMethod === 'upi' && (
                <div className="payment-inputs-panel animate-fade-in">
                  <div className="upi-apps-row">
                    <span className="upi-badge">Google Pay</span>
                    <span className="upi-badge">PhonePe</span>
                    <span className="upi-badge">Paytm</span>
                    <span className="upi-badge">BHIM UPI</span>
                  </div>

                  <div className="input-group">
                    <label htmlFor="upi-id">UPI ID / VPA</label>
                    <input
                      type="text"
                      className="input-field"
                      id="upi-id"
                      placeholder="e.g. mobile@okhdfcbank or name@paytm"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>

                  <div className="qr-preview-box">
                    <div className="qr-code-graphic">
                      <div className="qr-inner">
                        <span>📱 QR Code Ready</span>
                        <small>Scan with any UPI app</small>
                      </div>
                    </div>
                    <div className="qr-text">
                      <strong>Instant UPI QR</strong>
                      <p>You can also complete payment by authorizing the request on your phone.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* COD Form */}
              {paymentMethod === 'cod' && (
                <div className="payment-inputs-panel cod-panel animate-fade-in">
                  <div className="cod-alert">
                    <span className="cod-icon">💵</span>
                    <div>
                      <strong>Pay with Cash or UPI upon Delivery</strong>
                      <p>
                        Keep exact change handy or pay the delivery partner using Google Pay / PhonePe QR on delivery.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Net Banking Form */}
              {paymentMethod === 'netbanking' && (
                <div className="payment-inputs-panel animate-fade-in">
                  <div className="input-group">
                    <label htmlFor="bank-select">Choose Bank</label>
                    <select
                      id="bank-select"
                      className="input-field select-field"
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                    >
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="State Bank of India">State Bank of India (SBI)</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="Axis Bank">Axis Bank</option>
                      <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                      <option value="Chase Bank">Chase Bank</option>
                      <option value="Bank of America">Bank of America</option>
                    </select>
                  </div>
                  <p className="bank-redirect-text">
                    You will be directed to your bank's secure authorization portal upon clicking confirm.
                  </p>
                </div>
              )}
            </div>

            {/* Place Order CTA */}
            <button
              type="submit"
              className="btn btn-primary btn-lg pay-now-btn"
              disabled={isProcessing}
              id="place-order-btn"
            >
              🔒 Pay ₹{finalTotal.toFixed(2)} & Confirm Order
            </button>
            <div className="ssl-guarantee">
              <span>🔒 256-bit SSL Encrypted</span>
              <span>•</span>
              <span>100% Satisfaction Guarantee</span>
            </div>
          </form>

          {/* Right Column: Order Summary */}
          <div className="checkout-summary-column">
            <div className="checkout-summary glass-card animate-fade-in-up">
              <h3 className="summary-title">Order Summary ({items.length} items)</h3>
              
              <div className="checkout-items">
                {items.map((item) => (
                  <div className="checkout-item" key={item.id}>
                    <span className="checkout-item-emoji">{item.emoji}</span>
                    <div className="checkout-item-info">
                      <span className="checkout-item-name">{item.name}</span>
                      <span className="checkout-item-qty">
                        Qty: {item.quantity} × ₹{Number(item.price).toFixed(2)}
                      </span>
                    </div>
                    <span className="checkout-item-price">
                      ₹{(Number(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Form */}
              <div className="coupon-card">
                <form className="coupon-form" onSubmit={handleApplyCoupon}>
                  <input
                    type="text"
                    placeholder="Enter Promo Code (FRESH10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="coupon-input"
                  />
                  <button type="submit" className="btn btn-secondary btn-sm coupon-btn">
                    Apply
                  </button>
                </form>
                {couponMessage && (
                  <p className={`coupon-msg ${discountPercent > 0 ? 'success' : 'error'}`}>
                    {couponMessage}
                  </p>
                )}
              </div>

              <div className="summary-divider" />

              <div className="summary-rows">
                <div className="summary-row">
                  <span>Groceries Subtotal</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="summary-row text-green">
                    <span>Promo Discount ({(discountPercent * 100).toFixed(0)}%)</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Delivery ({deliveryType === 'express' ? 'Priority Express' : 'Standard'})</span>
                  <span>
                    {currentDelivery === 0 ? (
                      <span className="free-badge">FREE</span>
                    ) : (
                      `₹${currentDelivery.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="summary-divider" />
                <div className="summary-row total">
                  <span>Total Amount</span>
                  <span className="total-amount">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
