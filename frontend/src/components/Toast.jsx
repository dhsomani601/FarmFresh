import { useEffect, useState } from 'react';
import './Toast.css';

export default function Toast({ type = 'success', message, onClose, duration = 3000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  return (
    <div className={`toast toast-${type} ${visible ? 'toast-enter' : 'toast-exit'}`}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => { setVisible(false); setTimeout(onClose, 300); }}>✕</button>
    </div>
  );
}
