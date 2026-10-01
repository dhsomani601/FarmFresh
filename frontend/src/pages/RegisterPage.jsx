import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Toast from '../components/Toast';
import './AuthPage.css';

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: Info, 2: OTP Verification
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [toast, setToast] = useState(null);

  // Timers
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600s)
  const [resendCooldown, setResendCooldown] = useState(30); // 30s cooldown before resend
  const otpInputRef = useRef(null);

  const { verifyRegister } = useAuth();
  const navigate = useNavigate();

  // Countdown timer for OTP validity (10 minutes) and Resend cooldown
  useEffect(() => {
    let timer;
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Focus OTP input when moving to Step 2
  useEffect(() => {
    if (step === 2 && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setToast({ type: 'error', message: 'Please enter a valid 10-digit mobile number' });
      return;
    }
    if (password.length < 6) {
      setToast({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }
    try {
      setLoading(true);
      const data = await api.requestRegisterOtp({ name, email, password, phone });
      
      setTimeLeft(600);
      setResendCooldown(30);
      setStep(2);

      setToast({
        type: 'success',
        message: data.message || `✉️ Verification code sent to ${email}! Please check your email inbox.`
      });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to send verification code.' });
    } finally {
      setLoading(false);
    }
  };

  // Verification Logic (used by both manual submit and auto-submit)
  const triggerVerify = async (codeToVerify) => {
    const cleanCode = (codeToVerify || otp).trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setToast({ type: 'error', message: 'Please enter the 6-digit verification code' });
      return;
    }
    if (timeLeft <= 0) {
      setToast({ type: 'error', message: 'Verification code has expired. Please click Resend Code.' });
      return;
    }
    try {
      setLoading(true);
      await verifyRegister(name, email, password, phone, cleanCode);
      setToast({ type: 'success', message: '✅ Account verified! Logged in successfully. Redirecting...' });
      setTimeout(() => navigate('/products'), 800);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Invalid verification code.' });
      setLoading(false);
    }
  };

  // Step 2: Manual Form Submit
  const handleVerifySubmit = (e) => {
    e.preventDefault();
    triggerVerify(otp);
  };

  // Auto-submit when 6 digits are typed or pasted
  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
    if (val.length === 6 && !loading) {
      triggerVerify(val);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      setResending(true);
      const data = await api.requestRegisterOtp({ name, email, password, phone });
      setTimeLeft(600);
      setResendCooldown(30);
      setOtp('');
      setToast({
        type: 'success',
        message: data.message || `Fresh verification code sent to ${email}!`
      });
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
                : `We sent a 6-digit verification code to ${email}`}
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
                <label>Phone Number *</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  id="register-phone"
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
            <form onSubmit={handleVerifySubmit} className="auth-form">
              {/* Active Timer Pill */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: timeLeft > 60 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${timeLeft > 60 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                borderRadius: '10px',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '13px', color: timeLeft > 60 ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
                  ⏱️ OTP Valid For: <strong>{formatTimer(timeLeft)}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
                >
                  Edit Email
                </button>
              </div>

              <div style={{ padding: '10px 14px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '10px', fontSize: '13px', textAlign: 'center', color: '#86efac', marginBottom: '16px' }}>
                📬 A 6-digit verification code has been dispatched to <strong>{email}</strong>.<br />
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Please check your inbox and spam folder.</span>
              </div>

              <div className="input-group">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Enter 6-Digit OTP</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Auto-submits on 6th digit</span>
                </label>
                <input
                  ref={otpInputRef}
                  type="text"
                  maxLength={6}
                  className="input-field"
                  placeholder="• • • • • •"
                  style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 'bold' }}
                  value={otp}
                  onChange={handleOtpChange}
                  required
                  autoFocus
                  id="register-otp"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginBottom: '12px' }}
                disabled={loading || otp.length !== 6 || timeLeft <= 0}
                id="register-verify-submit"
              >
                {loading ? '⟳ Verifying & Logging in...' : 'Verify & Log In 🚀'}
              </button>

              <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                Didn't get the code?{' '}
                {resendCooldown > 0 ? (
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                    Resend in <strong>{resendCooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#16a34a',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {resending ? 'Sending...' : 'Resend Code'}
                  </button>
                )}
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
