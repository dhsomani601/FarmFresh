import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const savedUser = localStorage.getItem('grocery_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch { /* ignore */ }
      } else {
        // Attempt session rehydration via httpOnly cookie
        try {
          const res = await api.getMe();
          if (res?.user) {
            localStorage.setItem('grocery_user', JSON.stringify(res.user));
            setUser(res.user);
          }
        } catch {
          // No active cookie session
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    if (data.token) localStorage.setItem('grocery_token', data.token);
    localStorage.setItem('grocery_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password, phone) => {
    const data = await api.register({ name, email, password, phone });
    if (data.token) localStorage.setItem('grocery_token', data.token);
    localStorage.setItem('grocery_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const verifyRegister = async (name, email, password, phone, otp) => {
    const data = await api.verifyRegisterOtp({ name, email, password, phone, otp });
    if (data.token) localStorage.setItem('grocery_token', data.token);
    localStorage.setItem('grocery_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    api.logout();
    localStorage.removeItem('grocery_token');
    localStorage.removeItem('grocery_user');
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser(prev => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('grocery_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyRegister, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
