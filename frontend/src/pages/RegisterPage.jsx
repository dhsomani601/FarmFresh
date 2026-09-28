import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Toast from '../components/Toast';
import './AuthPage.css';

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: Info, 2: OTP Verification
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [toast, setToast] = useState(null);
  const { verifyRegister } = useAuth();
  const navigate = useNavigate();

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setToast({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }
    try {
      setLoading(true);
      const data = await api.requestRegisterOtp({ name, email, password });
      setPreviewUrl(data.previewUrl || null);
      setToast({ 
        type: 'success', 
        message: data.message || `Verification code sent to ${email}` 
      });
      setStep(2);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Complete Registration
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setToast({ type: 'error', message: 'Please enter the 6-digit verification code' });
      return;
    }
    try {
      setLoading(true);
      await verifyRegister(name, email, password, otp.trim());
      setToast({ type: 'success', message: 'Account verified! Welcome to FreshMart!' });
      setTimeout(() => navigate('/products'), 1000);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    try {
      setResending(true);
      const data = await api.requestRegisterOtp({ name, email, password });
      setPreviewUrl(data.previewUrl || null);
      setToast({ type: 'info', message: 'A fresh verification code has been sent to your email.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setResending(false);
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
        <div className="auth-card glass-card animate-fade-in-up" id="register-form">
          <div className="auth-header">
            <span className="auth-icon">{step === 1 ? '🌿' : '📩'}</span>
            <h1>{step === 1 ? 'Create Account' : 'Verify Your Email'}</h1>
            <p>
              {step === 1 
                ? 'Join FreshMart for fresh, organic groceries' 
                : `We sent a 6-digit code to ${email}`}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="auth-form">
              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  id="register-name"
                />
              </div>

              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  id="register-email"
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  id="register-password"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-lg" 
                style={{ width: '100%' }} 
                disabled={loading} 
                id="register-submit"
              >
                {loading ? '⟳ Sending Verification Code...' : 'Get Verification Code ✉️'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="auth-form">
              <div className="input-group">
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Enter 6-Digit OTP</span>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}
                  >
                    Change Email
                  </button>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  className="input-field"
                  placeholder="• • • • • •"
                  style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 'bold' }}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  id="register-otp"
                />
              </div>

              {previewUrl && (
                <div style={{ padding: '10px 14px', background: 'rgba(22, 163, 74, 0.1)', border: '1px solid rgba(22, 163, 74, 0.3)', borderRadius: '8px', fontSize: '13px', textAlign: 'center', color: '#16a34a', marginBottom: '12px' }}>
                  📬 Test Inbox Active: <a href={previewUrl} target="_blank" rel="noreferrer" style={{ color: '#16a34a', fontWeight: 'bold', textDecoration: 'underline' }}>View Test Email OTP</a>
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary btn-lg" 
                style={{ width: '100%', marginBottom: '10px' }} 
                disabled={loading || otp.length !== 6} 
                id="register-verify-submit"
              >
                {loading ? '⟳ Verifying OTP...' : 'Verify & Create Account 🚀'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '14px' }}>
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  style={{ background: 'none', border: 'none', color: '#16a34a', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {resending ? 'Sending...' : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          <p className="auth-switch">
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
