import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './LogoutSuccessPage.css';

export default function LogoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get('role') || 'user';
  const isAdmin = role === 'admin';

  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="logout-success-page page-container">
      <div className="logout-bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      <div className="container logout-container">
        <div className="logout-card glass-card animate-fade-in-up">
          <div className="logout-icon-wrapper">
            <span className="logout-icon">{isAdmin ? '🛡️' : '🌿'}</span>
            <span className="logout-badge-check">✓</span>
          </div>

          <h1 className="logout-title">
            {isAdmin ? 'Admin Session Ended' : 'Successfully Logged Out'}
          </h1>

          <p className="logout-desc">
            {isAdmin
              ? 'You have safely exited the FreshMart Admin Portal. All administrative cookies and credentials have been revoked.'
              : 'You have been safely logged out of your FreshMart account. All session cookies have been cleared from your browser.'}
          </p>

          {/* 5-Second Countdown Box */}
          <div className="countdown-box">
            <div className="countdown-pill">
              <span className="countdown-pulse" />
              <span>Redirecting to Home in <strong>{timeLeft}</strong>s</span>
            </div>
            <div className="countdown-progress-bar">
              <div 
                className="countdown-progress-fill" 
                style={{ width: `${(timeLeft / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="logout-actions">
            <Link to="/" className="btn btn-primary btn-lg logout-btn">
              🏠 Return to Home Now
            </Link>
            <Link 
              to={isAdmin ? '/admin' : '/login'} 
              className="btn btn-secondary btn-lg logout-btn"
            >
              🔑 {isAdmin ? 'Admin Sign In' : 'Sign In Again'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
