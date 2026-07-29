import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('uni_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('uni_auth_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.user);
          localStorage.setItem('uni_user', JSON.stringify(res.user));
        } catch (e) {
          console.warn('[AuthContext] Verification failed, logging out');
          logout();
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.token) {
      localStorage.setItem('uni_auth_token', res.token);
      localStorage.setItem('uni_user', JSON.stringify(res.user));
      setUser(res.user);
    }
    return res;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.token) {
      localStorage.setItem('uni_auth_token', res.token);
      localStorage.setItem('uni_user', JSON.stringify(res.user));
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('uni_auth_token');
    localStorage.removeItem('uni_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
