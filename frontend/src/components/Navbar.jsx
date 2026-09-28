import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../utils/api';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Universal Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
    setShowSuggestions(false);
  }, [location]);

  // Live search debouncing
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const data = await api.getProducts({ search: q });
        setSuggestions((data.products || []).slice(0, 5));
        setShowSuggestions(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/products?search=${encodeURIComponent(q)}`);
      setShowSuggestions(false);
      setMobileOpen(false);
    }
  };

  const handleSelectSuggestion = (product) => {
    setSearchQuery('');
    setShowSuggestions(false);
    navigate(`/products?search=${encodeURIComponent(product.name)}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderAvatar = () => {
    if (user?.avatar) {
      if (user.avatar.startsWith('http')) {
        return <img src={user.avatar} alt="avatar" className="user-avatar-img" />;
      }
      return <span className="user-avatar-emoji">{user.avatar}</span>;
    }
    return <span className="user-avatar-initial">{user?.name?.[0]?.toUpperCase() || 'U'}</span>;
  };

  return (
    <nav className="navbar" id="main-navbar">
      <div className="container navbar-container">
        {/* Brand */}
        <Link to="/" className="nav-brand">
          <span className="brand-icon">🛒</span>
          <span>Fresh<span className="brand-highlight">Mart</span></span>
        </Link>

        {/* Universal Top Search Bar */}
        <div className="universal-search-container" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="universal-search-form">
            <svg
              className="search-icon-svg-nav"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="universal-search-input"
              placeholder="Search 29+ fresh groceries, fruits, milk, bakery..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              id="universal-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                }}
              >
                ✕
              </button>
            )}
            <button type="submit" className="search-submit-btn" aria-label="Search">
              Search
            </button>
          </form>

          {/* Live Search Suggestions Dropdown */}
          {showSuggestions && (
            <div className="search-suggestions-dropdown">
              {isSearching ? (
                <div className="suggestion-loading">⟳ Searching fresh items...</div>
              ) : suggestions.length === 0 ? (
                <div className="suggestion-empty">No products matched "{searchQuery}"</div>
              ) : (
                <div className="suggestions-list">
                  <div className="suggestions-header">Quick Results</div>
                  {suggestions.map((p) => (
                    <div
                      key={p.id}
                      className="suggestion-item"
                      onClick={() => handleSelectSuggestion(p)}
                    >
                      <span className="suggestion-emoji">{p.emoji}</span>
                      <div className="suggestion-details">
                        <span className="suggestion-name">{p.name}</span>
                        <span className="suggestion-category">{p.category}</span>
                      </div>
                      <span className="suggestion-price">₹{Number(p.price).toFixed(2)}</span>
                    </div>
                  ))}
                  <div
                    className="suggestion-view-all"
                    onClick={() => {
                      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
                      setShowSuggestions(false);
                    }}
                  >
                    View all matching results for "{searchQuery}" →
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Navigation Toggle */}
        <button
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>

        {/* Navigation Links */}
        <div className={`nav-links ${mobileOpen ? 'mobile-open' : ''}`}>
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            🏠 Home
          </Link>
          <Link to="/products" className={`nav-link ${location.pathname === '/products' ? 'active' : ''}`}>
            🛍️ Products
          </Link>
          {isAuthenticated && (
            <Link to="/orders" className={`nav-link ${location.pathname === '/orders' ? 'active' : ''}`}>
              📦 Orders
            </Link>
          )}
          <Link to="/about" className={`nav-link mobile-only-link ${location.pathname === '/about' ? 'active' : ''}`}>
            🌱 About
          </Link>
          <Link to="/customer-care" className={`nav-link mobile-only-link ${location.pathname === '/customer-care' ? 'active' : ''}`}>
            📞 Support
          </Link>
        </div>

        {/* Actions (Cart & User) */}
        <div className="nav-actions">
          <Link to="/cart" className="cart-btn" id="cart-nav-btn">
            <span className="cart-icon">🛒</span>
            <span className="cart-text">Cart</span>
            {cartCount > 0 && <span className="cart-badge" key={cartCount}>{cartCount}</span>}
          </Link>

          {isAuthenticated ? (
            <div className="user-menu" ref={dropdownRef}>
              <button
                className="user-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                id="user-menu-btn"
                aria-label="User account menu"
              >
                <div className="user-avatar-wrapper">{renderAvatar()}</div>
                <span className="user-name-label">{user?.name?.split(' ')[0]}</span>
              </button>
              {dropdownOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <div className="dropdown-avatar-preview">{renderAvatar()}</div>
                    <div className="dropdown-user-info">
                      <strong>{user?.name}</strong>
                      <span>{user?.email}</span>
                    </div>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/orders" className="dropdown-item">📦 My Orders</Link>
                  <Link to="/profile" className="dropdown-item">👤 Profile & Settings</Link>
                  <Link to="/customer-care" className="dropdown-item">📞 Help & Support</Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item danger" onClick={handleLogout}>🚪 Logout</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm" id="login-nav-btn">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
