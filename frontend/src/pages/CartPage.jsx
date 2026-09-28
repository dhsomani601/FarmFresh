import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Toast from '../components/Toast';
import './CartPage.css';

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { items, loading, cartTotal, deliveryFee, grandTotal, fetchCart, updateQuantity, removeItem, clearCart } = useCart();
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated, fetchCart]);

  const handleQuantityChange = async (itemId, newQty) => {
    try {
      await updateQuantity(itemId, newQty);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleRemove = async (itemId, name) => {
    try {
      await removeItem(itemId);
      setToast({ type: 'success', message: `${name} removed from cart` });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleClear = async () => {
    try {
      await clearCart();
      setToast({ type: 'success', message: 'Cart cleared!' });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="cart-page page-container">
        <div className="container">
          <div className="empty-cart animate-fade-in-up">
            <span className="empty-cart-icon">🔒</span>
            <h2>Sign in to view your cart</h2>
            <p>You need to be logged in to manage your cart</p>
            <Link to="/login" className="btn btn-primary">Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page page-container">
      <div className="container">
        <div className="cart-header animate-fade-in-up">
          <h1 className="page-title">🛒 Shopping Cart</h1>
          {items.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleClear} id="clear-cart-btn">
              Clear Cart
            </button>
          )}
        </div>

        {loading ? (
          <div className="cart-skeleton">
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12, marginBottom: 12 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-cart animate-fade-in-up">
            <span className="empty-cart-icon">🛒</span>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any items yet</p>
            <Link to="/products" className="btn btn-primary">Browse Products</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {items.map((item, i) => (
                <div
                  className="cart-item glass-card animate-fade-in-up"
                  key={item.id}
                  style={{ animationDelay: `${i * 0.05}s` }}
                  id={`cart-item-${item.id}`}
                >
                  <div className="cart-item-emoji" style={{ background: `rgba(34,197,94,0.08)` }}>
                    <span>{item.emoji}</span>
                  </div>
                  <div className="cart-item-info">
                    <h3 className="cart-item-name">{item.name}</h3>
                    <span className="cart-item-price">₹{Number(item.price).toFixed(2)} / {item.unit}</span>
                    <span className="cart-item-category badge badge-green">{item.category}</span>
                  </div>
                  <div className="cart-item-controls">
                    <div className="qty-control">
                      <button
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >−</button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                      >+</button>
                    </div>
                    <span className="cart-item-total">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                    <button className="remove-btn" onClick={() => handleRemove(item.id, item.name)} id={`remove-${item.id}`}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary glass-card animate-fade-in-up" style={{ animationDelay: '0.2s' }} id="cart-summary">
              <h3 className="summary-title">Order Summary</h3>
              <div className="summary-rows">
                <div className="summary-row">
                  <span>Subtotal ({items.length} items)</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? <span className="free-badge">FREE</span> : `₹${deliveryFee.toFixed(2)}`}</span>
                </div>
                {deliveryFee > 0 && (
                  <p className="free-delivery-hint">Add ₹{(299 - cartTotal).toFixed(2)} more for FREE delivery</p>
                )}
                <div className="summary-divider" />
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => navigate('/checkout')} id="checkout-btn">
                Proceed to Checkout — ₹{grandTotal.toFixed(2)} →
              </button>
            </div>
          </div>
        )}
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
