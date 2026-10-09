import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('bloodlink_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize user from token or localStorage on app mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('bloodlink_token');
      const storedUser = localStorage.getItem('bloodlink_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Verify with backend
          const res = await authService.getCurrentUser();
          if (res.data) {
            setUser(res.data);
            localStorage.setItem('bloodlink_user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.warn('Session verification failed, clearing auth:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.success && res.data) {
      const { token: jwtToken, user: userData } = res.data;
      setToken(jwtToken);
      setUser(userData);
      localStorage.setItem('bloodlink_token', jwtToken);
      localStorage.setItem('bloodlink_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (formData) => {
    const res = await authService.register(formData);
    if (res.success && res.data) {
      const { token: jwtToken, user: userData } = res.data;
      setToken(jwtToken);
      setUser(userData);
      localStorage.setItem('bloodlink_token', jwtToken);
      localStorage.setItem('bloodlink_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bloodlink_token');
    localStorage.removeItem('bloodlink_user');
  };

  const refreshUser = async () => {
    try {
      const res = await authService.getCurrentUser();
      if (res.data) {
        setUser(res.data);
        localStorage.setItem('bloodlink_user', JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn('Failed to refresh user:', err);
    }
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
