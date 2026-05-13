import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Configure axios base for auth if needed, or just use full paths
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stockiq_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('stockiq_token');
        const savedUser = localStorage.getItem('stockiq_user');
        
        if (token && savedUser) {
          // In a real app, you'd verify the token with a /me endpoint
          // For now, we trust the localStorage if it exists
          setUser(JSON.parse(savedUser));
          
          // Set global axios header for subsequent requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      } catch (err) {
        console.error('Auth check failed', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      
      setUser(userData);
      localStorage.setItem('stockiq_user', JSON.stringify(userData));
      localStorage.setItem('stockiq_token', access_token);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      return userData;
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Login failed');
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, { name, email, password });
      const { access_token, user: userData } = response.data;
      
      setUser(userData);
      localStorage.setItem('stockiq_user', JSON.stringify(userData));
      localStorage.setItem('stockiq_token', access_token);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      return userData;
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Registration failed');
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('stockiq_user');
    localStorage.removeItem('stockiq_token');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
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
