import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem('velora_token') || localStorage.getItem('nexacart_token') || null
  );
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Load user profile on initial mount if token exists
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data && response.data.user) {
          setUser(response.data.user);
          localStorage.setItem('velora_user', JSON.stringify(response.data.user));
        }
      } catch (err) {
        console.warn('Session expired or invalid token. Logging out.');
        logout(false);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem('velora_token', receivedToken);
      localStorage.setItem('velora_user', JSON.stringify(receivedUser));

      toast.success(`Welcome back, ${receivedUser.name}!`);
      return { success: true, user: receivedUser };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const register = async (name, email, password, role = 'user') => {
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      const { token: receivedToken, user: receivedUser } = response.data;

      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem('velora_token', receivedToken);
      localStorage.setItem('velora_user', JSON.stringify(receivedUser));

      toast.success('Registration successful! Welcome to Velora.');
      return { success: true, user: receivedUser };
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const logout = (showToast = true) => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('velora_token');
    localStorage.removeItem('velora_user');
    localStorage.removeItem('nexacart_token');
    localStorage.removeItem('nexacart_user');
    if (showToast) {
      toast.info('You have been signed out.');
    }
  };

  // Demo 1-Click Login Shortcuts for Interviews & College Demos
  const loginAsDemoUser = () => {
    return login('demo@example.com', 'Demo123!');
  };

  const loginAsAdmin = () => {
    return login('admin@example.com', 'Admin123!');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        loginAsDemoUser,
        loginAsAdmin,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
