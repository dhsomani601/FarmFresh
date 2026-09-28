import { useState, useEffect, useRef } from 'react';
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
  const [serverOtp, setServerOtp] = useState(null);
  const [emailDelivered, setEmailDelivered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [toast, setToast] = useState(null);

  // Timers for forgot password verification
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins
  const [resendCooldown, setResendCooldown] = useState(30);
  const resetOtpInputRef = useRef(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Countdown timer for password reset OTP validity (10 minutes)
  useEffect(() => {
    let timer;
    if (mode === 'forgot_verify' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, timeLeft]);

  useEffect(() => {
    if (mode === 'forgot_verify' && resetOtpInputRef.current) {
      resetOtpInputRef.current.focus();
    }
  }, [mode]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
      setServerOtp(data.otp || null);
      setEmailDelivered(!!data.emailDelivered);
      setTimeLeft(600);
      setResendCooldown(30);
      setOtp('');
      setMode('forgot_verify');

      if (data.emailDelivered) {
        setToast({ type: 'success', message: `✉️ Reset code sent to ${resetEmail}! Please check your email.` });
      } else {
        setToast({ type: 'info', message: `🔑 Password reset code generated! (Valid for 10 minutes)` });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to send reset code.' });
    } finally {
      setLoading(false);
    }
  };

  // Resend Reset OTP
  const handleResendResetOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      setResending(true);
      const data = await api.requestOtp(resetEmail);
      setServerOtp(data.otp || null);
      setEmailDelivered(!!data.emailDelivered);
      setTimeLeft(600);
      setResendCooldown(30);
      setOtp('');
      setToast({
        type: 'success',
        message: data.emailDelivered
          ? `Fresh reset code sent to ${resetEmail}!`
          : `Fresh reset code generated!`
      });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setResending(false);
    }
  };

  // Step 2 of Forgot Password: Enter OTP and Set New Password
  const handleVerifyResetOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setToast({ type: 'error', message: 'Please enter the 6-digit OTP' });
      return;
    }
    if (newPassword.length < 6) {
      setToast({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }
    if (timeLeft <= 0) {
      setToast({ type: 'error', message: 'Reset code has expired. Please click Resend Code.' });
      return;
    }
    try {
      setLoading(true);
      const data = await api.verifyOtpChangePassword({
        email: resetEmail,
        otp: otp.trim(),
        newPassword
      });
      setToast({ type: 'success', message: data.message || 'Password reset successful! You can now sign in.' });
      setEmail(resetEmail);
      setPassword('');
      setMode('login');
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update password.' });
    } finally {
      setLoading(false);
    }
  };

  // Quick fill test code helper
  const handleQuickFill = () => {
    if (serverOtp) {
      setOtp(serverOtp);
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
                      onClick={() => {
                        setResetEmail(email);
                        setMode('forgot_request');
                      }}
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
                <p>Enter your email to receive a 6-digit verification code</p>
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
                {/* Active Countdown Timer */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: timeLeft > 60 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: `1px solid ${timeLeft > 60 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  borderRadius: '10px',
                  marginBottom: '14px'
                }}>
                  <span style={{ fontSize: '13px', color: timeLeft > 60 ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
                    ⏱️ OTP Valid For: <strong>{formatTimer(timeLeft)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setMode('forgot_request')}
                    style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
                  >
                    Change Email
                  </button>
                </div>

                {/* Email Delivery or Test Code Banner */}
                {emailDelivered ? (
                  <div style={{ padding: '8px 12px', background: 'rgba(34, 197, 94, 0.08)', borderRadius: '8px', fontSize: '12px', textAlign: 'center', color: '#22c55e', marginBottom: '14px' }}>
                    📬 Real email sent to <strong>{resetEmail}</strong>. Check inbox or spam folder.
                  </div>
                ) : serverOtp ? (
                  <div style={{
                    padding: '10px 12px',
                    background: 'rgba(255, 122, 0, 0.12)',
                    border: '1px solid rgba(255, 122, 0, 0.3)',
                    borderRadius: '10px',
                    textAlign: 'center',
                    marginBottom: '14px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#ff7a00', marginBottom: '6px' }}>
                      🔑 Code: <strong style={{ fontSize: '16px', letterSpacing: '2px' }}>{serverOtp}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleQuickFill}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '12px', padding: '4px 10px' }}
                    >
                      ⚡ Auto-Fill Code
                    </button>
                  </div>
                ) : null}

                <div className="input-group">
                  <label>6-Digit Verification Code</label>
                  <input
                    ref={resetOtpInputRef}
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

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginBottom: '12px' }}
                  disabled={loading || otp.length !== 6 || timeLeft <= 0}
                >
                  {loading ? '⟳ Updating Password...' : 'Reset & Save Password 🚀'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setMode('login')}
                  >
                    Cancel
                  </button>

                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {resendCooldown > 0 ? (
                      <span>Resend in <strong>{resendCooldown}s</strong></span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendResetOtp}
                        disabled={resending}
                        style={{ background: 'none', border: 'none', color: '#16a34a', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {resending ? 'Sending...' : 'Resend Code'}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
