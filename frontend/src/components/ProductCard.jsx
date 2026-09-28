import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Toast from './Toast';
import './ProductCard.css';

const categoryColors = {
  Fruits: '#ef4444',
  Vegetables: '#22c55e',
  Dairy: '#3b82f6',
  Bakery: '#f59e0b',
  Beverages: '#8b5cf6',
  Snacks: '#f97316',
};

export default function ProductCard({ product, index = 0 }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { isAuthenticated } = useAuth();
  const { getItemQuantity, incrementItem, decrementItem } = useCart();
  const navigate = useNavigate();

  const quantity = isAuthenticated ? getItemQuantity(product.id) : 0;
  const isSoldOut = product.status === 'sold_out' || product.stock === 0;
  const isComingSoon = product.status === 'coming_soon';

  const handleAddFirstTime = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isSoldOut || isComingSoon) return;

    try {
      setLoading(true);
      await incrementItem(product.id);
      setToast({ type: 'success', message: `${product.name} added to cart!` });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = async () => {
    try {
      setLoading(true);
      await incrementItem(product.id);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDecrement = async () => {
    try {
      setLoading(true);
      await decrementItem(product.id);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const color = categoryColors[product.category] || '#22c55e';

  return (
    <>
      <div
        className={`product-card animate-fade-in-up ${isSoldOut ? 'card-sold-out' : ''} ${isComingSoon ? 'card-coming-soon' : ''}`}
        style={{ animationDelay: `${index * 0.05}s` }}
        id={`product-card-${product.id}`}
      >
        <div className="product-emoji-bg" style={{ background: `linear-gradient(135deg, ${color}15, ${color}08)` }}>
          <span className="product-emoji">{product.emoji}</span>
          <span className="product-category-tag" style={{ background: `${color}20`, color }}>{product.category}</span>
          
          {/* Status Badges */}
          {isSoldOut && <span className="product-badge badge-sold-out">Sold Out</span>}
          {isComingSoon && <span className="product-badge badge-coming-soon">Coming Soon</span>}
        </div>

        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-desc">{product.description}</p>
          <div className="product-meta">
            <span className="product-price">₹{Number(product.price).toFixed(2)}</span>
            <span className="product-unit">/ {product.unit}</span>
          </div>

          <div className="product-footer">
            <span className={`stock-indicator ${product.stock < 20 && !isSoldOut && !isComingSoon ? 'low' : ''}`}>
              {isSoldOut
                ? 'Out of Stock'
                : isComingSoon
                ? 'Arriving Soon'
                : product.stock < 20
                ? `Only ${product.stock} left`
                : 'In Stock'}
            </span>

            {/* Action Button: Stepper or Add or Disabled */}
            {isSoldOut ? (
              <button className="add-to-cart-btn disabled" disabled>
                Sold Out
              </button>
            ) : isComingSoon ? (
              <button className="add-to-cart-btn disabled coming-soon-btn" disabled>
                Coming Soon
              </button>
            ) : quantity > 0 ? (
              <div className="qty-stepper-btn" id={`qty-stepper-${product.id}`}>
                <button
                  type="button"
                  className="stepper-action-btn minus"
                  onClick={handleDecrement}
                  disabled={loading}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="stepper-count">{quantity}</span>
                <button
                  type="button"
                  className="stepper-action-btn plus"
                  onClick={handleIncrement}
                  disabled={loading || quantity >= product.stock}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                className="add-to-cart-btn"
                onClick={handleAddFirstTime}
                disabled={loading}
                id={`add-to-cart-${product.id}`}
              >
                {loading ? <span className="btn-spinner">⟳</span> : '+ Add'}
              </button>
            )}
          </div>
        </div>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
}
