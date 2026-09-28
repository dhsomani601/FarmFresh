import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Toast from '../components/Toast';
import './AuthPage.css';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'forgot_request' | 'forgot_verify'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(email, password);
      navigate('/products');
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Step 1 of Forgot Password: Request OTP
  const handleRequestResetOtp = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setToast({ type: 'error', message: 'Please enter your registered email' });
      return;
    }
    try {
      setLoading(true);
      const data = await api.requestOtp(resetEmail);
      setPreviewUrl(data.previewUrl || null);
      setToast({ type: 'success', message: data.message || `Reset code sent to ${resetEmail}` });
      setMode('forgot_verify');
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Step 2 of Forgot Password: Enter OTP and Set New Password
  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setToast({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }
    try {
      setLoading(true);
      const data = await api.verifyOtpChangePassword({
        email: resetEmail,
        otp: otp.trim(),
        newPassword
      });
      setToast({ type: 'success', message: data.message || 'Password reset successful!' });
      setEmail(resetEmail);
      setPassword('');
      setMode('login');
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-container">
      <div className="auth-bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>
      <div className="container auth-container">
        <div className="auth-card glass-card animate-fade-in-up" id="login-form">
          {mode === 'login' && (
            <>
              <div className="auth-header">
                <span className="auth-icon">👋</span>
                <h1>Welcome Back</h1>
                <p>Sign in to your FreshMart account</p>
              </div>

              <form onSubmit={handleLogin} className="auth-form">
                <div className="input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    id="login-email"
                  />
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ margin: 0 }}>Password</label>
                    <button
                      type="button"
                      onClick={() => { setResetEmail(email); setMode('forgot_request'); }}
                      style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    id="login-password"
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading} id="login-submit">
                  {loading ? '⟳ Signing in...' : 'Sign In'}
                </button>
              </form>

              <p className="auth-switch">
                Don't have an account? <Link to="/register" className="auth-link">Create one</Link>
              </p>
            </>
          )}

          {mode === 'forgot_request' && (
            <>
              <div className="auth-header">
                <span className="auth-icon">🔐</span>
                <h1>Reset Password</h1>
                <p>Enter your email to receive a 6-digit OTP</p>
              </div>

              <form onSubmit={handleRequestResetOtp} className="auth-form">
                <div className="input-group">
                  <label>Registered Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    autoFocus
                    id="reset-email"
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: '12px' }} disabled={loading}>
                  {loading ? '⟳ Sending Reset Code...' : 'Send OTP to Email ✉️'}
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ width: '100%' }}
                  onClick={() => setMode('login')}
                >
                  ← Back to Sign In
                </button>
              </form>
            </>
          )}

          {mode === 'forgot_verify' && (
            <>
              <div className="auth-header">
                <span className="auth-icon">🔑</span>
                <h1>Enter OTP & New Password</h1>
                <p>Code sent to <strong>{resetEmail}</strong></p>
              </div>

              <form onSubmit={handleVerifyResetOtp} className="auth-form">
                <div className="input-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>6-Digit Verification Code</span>
                    <button
                      type="button"
                      onClick={() => setMode('forgot_request')}
                      style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
                    >
                      Change Email
                    </button>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    className="input-field"
                    placeholder="• • • • • •"
                    style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '6px', fontWeight: 'bold' }}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                    id="reset-otp"
                  />
                </div>

                {previewUrl && (
                  <div style={{ padding: '8px 12px', background: 'rgba(22, 163, 74, 0.1)', border: '1px solid rgba(22, 163, 74, 0.3)', borderRadius: '8px', fontSize: '13px', textAlign: 'center', color: '#16a34a', marginBottom: '12px' }}>
                    📬 Test Inbox Active: <a href={previewUrl} target="_blank" rel="noreferrer" style={{ color: '#16a34a', fontWeight: 'bold', textDecoration: 'underline' }}>View Test Email OTP</a>
                  </div>
                )}

                <div className="input-group">
                  <label>New Password (min 6 chars)</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Enter new strong password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    id="reset-new-password"
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: '12px' }} disabled={loading || otp.length !== 6}>
                  {loading ? '⟳ Updating Password...' : 'Reset & Save Password 🚀'}
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ width: '100%' }}
                  onClick={() => setMode('login')}
                >
                  Cancel
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
