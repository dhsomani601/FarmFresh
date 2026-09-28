import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer" id="main-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Col 1: Brand & Bio */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand">
              <span className="brand-icon">🛒</span>
              <span>Fresh<span className="brand-highlight">Mart</span></span>
            </Link>
            <p className="footer-bio">
              Farm-fresh groceries, organic produce, dairy, and daily essentials delivered to your doorstep in minutes. Serving freshness across India with zero delivery compromises.
            </p>
            <div className="footer-currency-tag">
              <span>🇮🇳 Indian Rupees (₹) Store</span>
            </div>
          </div>

          {/* Col 2: Mandatory Pages */}
          <div className="footer-col">
            <h4 className="footer-heading">Company & Legal</h4>
            <ul className="footer-links">
              <li>
                <Link to="/about" className="footer-link">🌱 About FreshMart</Link>
              </li>
              <li>
                <Link to="/policy" className="footer-link">🛡️ Privacy Policy & Terms</Link>
              </li>
              <li>
                <Link to="/customer-care" className="footer-link">📞 Customer Care & Support</Link>
              </li>
              <li>
                <Link to="/orders" className="footer-link">📦 Track Orders</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Categories */}
          <div className="footer-col">
            <h4 className="footer-heading">Fresh Categories</h4>
            <ul className="footer-links">
              <li><Link to="/products" className="footer-link">🍎 Fresh Fruits</Link></li>
              <li><Link to="/products" className="footer-link">🥦 Organic Vegetables</Link></li>
              <li><Link to="/products" className="footer-link">🥛 Pure Farm Dairy</Link></li>
              <li><Link to="/products" className="footer-link">🍞 Artisan Bakery</Link></li>
              <li><Link to="/products" className="footer-link">🧃 Cold Beverages</Link></li>
            </ul>
          </div>

          {/* Col 4: Support & Trust */}
          <div className="footer-col">
            <h4 className="footer-heading">Customer Delight</h4>
            <p className="footer-contact-item">
              <strong>Helpline:</strong> 1800-FRESH-MART
            </p>
            <p className="footer-contact-item">
              <strong>Email:</strong> support@freshmart.in
            </p>
            <p className="footer-contact-item">
              <strong>Hours:</strong> Mon - Sun (6 AM - 11 PM)
            </p>
            <div className="footer-badge-pill">
              🔒 100% Secure SSL Checkout
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} FreshMart Grocery Technologies Inc. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/about">About Us</Link>
            <span>•</span>
            <Link to="/policy">Privacy Policy</Link>
            <span>•</span>
            <Link to="/customer-care">24x7 Customer Care</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
