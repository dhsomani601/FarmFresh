import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Toast from '../components/Toast';
import './ProfilePage.css';

const AVATAR_OPTIONS = [
  { emoji: '🧑‍🍳', label: 'Chef' },
  { emoji: '🥑', label: 'Avocado' },
  { emoji: '🍓', label: 'Berry' },
  { emoji: '🥦', label: 'Broccoli' },
  { emoji: '🍎', label: 'Apple' },
  { emoji: '🍇', label: 'Grapes' },
  { emoji: '🥕', label: 'Carrot' },
  { emoji: '🥖', label: 'Bakery' },
  { emoji: '👨‍🌾', label: 'Farmer' },
  { emoji: '👩‍🍳', label: 'Cook' },
  { emoji: '🦊', label: 'Fox' },
  { emoji: '🐼', label: 'Panda' },
  { emoji: '🦁', label: 'Lion' },
  { emoji: '⚡', label: 'Fast' },
  { emoji: '👑', label: 'VIP' },
  { emoji: '☕', label: 'Coffee' },
];

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'security'

  // Profile Details State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState('🧑‍🍳');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // OTP & Password Change State
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      if (user.avatar) {
        setAvatar(user.avatar);
        if (user.avatar.startsWith('http')) {
          setCustomAvatarUrl(user.avatar);
        }
      }
    }
    // Fetch latest user info
    api.getMe().then(res => {
      if (res.user) {
        setName(res.user.name || '');
        setPhone(res.user.phone || '');
        setAddress(res.user.address || '');
        if (res.user.avatar) {
          setAvatar(res.user.avatar);
          if (res.user.avatar.startsWith('http')) {
            setCustomAvatarUrl(res.user.avatar);
          }
        }
      }
    }).catch(err => console.error(err));
  }, [isAuthenticated, user, navigate]);

  const handleSelectAvatar = (selectedEmoji) => {
    setAvatar(selectedEmoji);
    setCustomAvatarUrl('');
  };

  const handleCustomAvatarChange = (url) => {
    setCustomAvatarUrl(url);
    if (url.trim()) {
      setAvatar(url.trim());
    } else {
      setAvatar('🧑‍🍳');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setToast({ type: 'error', message: 'Name cannot be empty.' });
      return;
    }

    try {
      setSavingProfile(true);
      const res = await api.updateProfile({ name, phone, address, avatar });
      setToast({ type: 'success', message: 'Profile updated successfully!' });
      if (res.user && updateUser) {
        updateUser(res.user);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!user?.email) return;
    try {
      setRequestingOtp(true);
      const res = await api.requestOtp(user.email);
      setOtpSent(true);
      setGeneratedOtp(res.otp || '');
      setToast({
        type: 'success',
        message: `OTP sent to ${user.email}! (Test Code: ${res.otp})`
      });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to send OTP.' });
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleVerifyOtpAndChangePassword = async (e) => {
    e.preventDefault();
    if (!enteredOtp || enteredOtp.length !== 6) {
      setToast({ type: 'error', message: 'Please enter a valid 6-digit OTP.' });
      return;
    }
    if (newPassword.length < 6) {
      setToast({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    try {
      setChangingPassword(true);
      await api.verifyOtpChangePassword({
        email: user.email,
        otp: enteredOtp,
        newPassword
      });
      setToast({ type: 'success', message: 'Password updated successfully! Please login with your new password next time.' });
      setOtpSent(false);
      setEnteredOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setGeneratedOtp('');
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'OTP verification failed.' });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="profile-page page-container">
      <div className="container">
        <div className="profile-header animate-fade-in-up">
          <div className="profile-avatar-large">
            {avatar && avatar.startsWith('http') ? (
              <img src={avatar} alt="Profile" className="profile-avatar-img-round" />
            ) : (
              <span className="profile-avatar-emoji-round">{avatar || '🧑‍🍳'}</span>
            )}
          </div>
          <div>
            <h1 className="profile-name-title">{name || user?.name || 'User Profile'}</h1>
            <p className="profile-email-sub">{user?.email}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="profile-tabs-wrapper animate-fade-in-up">
          <button
            className={`profile-tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            👤 Personal Details & Avatar
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔐 Security & OTP Password Reset
          </button>
        </div>

        <div className="profile-content-grid animate-fade-in-up">
          {/* Tab 1: Edit Details */}
          {activeTab === 'details' && (
            <form className="glass-card profile-card" onSubmit={handleSaveProfile}>
              <h2 className="profile-section-title">Edit Account & Avatar</h2>
              <p className="profile-section-desc">Personalize your avatar and keep your delivery address up to date for fast grocery deliveries.</p>

              {/* Avatar Selector */}
              <div className="avatar-selection-container">
                <label className="input-label-strong">Choose Your Profile Picture / Avatar</label>
                <div className="avatar-picker-grid">
                  {AVATAR_OPTIONS.map((opt) => (
                    <button
                      key={opt.emoji}
                      type="button"
                      className={`avatar-choice-btn ${avatar === opt.emoji ? 'active' : ''}`}
                      onClick={() => handleSelectAvatar(opt.emoji)}
                      title={opt.label}
                    >
                      <span className="avatar-choice-emoji">{opt.emoji}</span>
                      <span className="avatar-choice-name">{opt.label}</span>
                    </button>
                  ))}
                </div>

                <div className="custom-avatar-row">
                  <input
                    type="url"
                    className="input-field"
                    placeholder="Or enter a custom image URL (https://...)"
                    value={customAvatarUrl}
                    onChange={(e) => handleCustomAvatarChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="prof-email">Email Address</label>
                <input
                  type="email"
                  id="prof-email"
                  className="input-field disabled-input"
                  value={user?.email || ''}
                  disabled
                />
                <span className="input-hint">Email address cannot be modified directly.</span>
              </div>

              <div className="input-group">
                <label htmlFor="prof-name">Full Name *</label>
                <input
                  type="text"
                  id="prof-name"
                  className="input-field"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="prof-phone">Phone Number</label>
                <input
                  type="tel"
                  id="prof-phone"
                  className="input-field"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label htmlFor="prof-address">Default Delivery Address</label>
                <textarea
                  id="prof-address"
                  className="input-field"
                  rows="3"
                  placeholder="House/Flat number, Street name, City, Pin code"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg save-profile-btn"
                disabled={savingProfile}
              >
                {savingProfile ? '⟳ Saving Changes...' : 'Save Profile Changes'}
              </button>
            </form>
          )}

          {/* Tab 2: Security & OTP Change Password */}
          {activeTab === 'security' && (
            <div className="glass-card profile-card">
              <h2 className="profile-section-title">Change Password with OTP Authentication</h2>
              <p className="profile-section-desc">
                For your security, we will generate a secure 6-digit One-Time Password (OTP) to authenticate this request.
              </p>

              {!otpSent ? (
                <div className="otp-request-box">
                  <div className="otp-info-banner">
                    <span className="otp-banner-icon">📩</span>
                    <div>
                      <strong>Authenticate via Email OTP</strong>
                      <p>Click below to receive a 6-digit authentication code on <strong>{user?.email}</strong>.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={handleRequestOtp}
                    disabled={requestingOtp}
                  >
                    {requestingOtp ? '⟳ Generating OTP...' : '🔑 Send OTP to My Email'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOtpAndChangePassword} className="otp-verify-form">
                  {generatedOtp && (
                    <div className="live-otp-pill">
                      <span>🔑 Test Authentication Code: <strong>{generatedOtp}</strong></span>
                      <small>(Valid for 10 minutes)</small>
                    </div>
                  )}

                  <div className="input-group">
                    <label htmlFor="prof-otp">Enter 6-Digit OTP *</label>
                    <input
                      type="text"
                      id="prof-otp"
                      className="input-field otp-input"
                      maxLength="6"
                      placeholder="• • • • • •"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="new-pass">New Password (min 6 characters) *</label>
                    <input
                      type="password"
                      id="new-pass"
                      className="input-field"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="confirm-pass">Confirm New Password *</label>
                    <input
                      type="password"
                      id="confirm-pass"
                      className="input-field"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="otp-action-row">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={changingPassword}
                    >
                      {changingPassword ? '⟳ Verifying OTP...' : 'Verify OTP & Change Password'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleRequestOtp}
                      disabled={requestingOtp}
                    >
                      Resend OTP
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
