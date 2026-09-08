import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('smartmart_admin_token') || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('smartmart_admin_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Sync token and user to localStorage
  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem('smartmart_admin_token', token);
      } else {
        localStorage.removeItem('smartmart_admin_token');
      }

      if (user) {
        localStorage.setItem('smartmart_admin_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('smartmart_admin_user');
      }
    } catch (e) {
      console.error('Failed to sync admin auth state:', e);
    }
  }, [token, user]);

  // Login administrator
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await api.post('/users/login', { email, password });
      const data = res.data;

      if (data && data.user) {
        if (data.user.role !== 'admin') {
          throw new Error('Access Denied: This account does not possess Administrator clearance.');
        }
        setToken(data.user.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      throw new Error('Invalid administrator response from server');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Administrator login failed';
      setAuthError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Register a new administrator with secret key
  const registerAdmin = async ({ name, email, password, phone, address, adminSecretKey }) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await api.post('/users/admin/register', {
        name,
        email,
        password,
        phone,
        address,
        adminSecretKey
      });
      const data = res.data;

      if (data && data.user) {
        setToken(data.user.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      throw new Error(data?.message || 'Admin registration failed');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Registration failed';
      setAuthError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Logout administrator
  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthError(null);
    localStorage.removeItem('smartmart_admin_token');
    localStorage.removeItem('smartmart_admin_user');
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token && user.role === 'admin'),
        isAdmin: user?.role === 'admin',
        loading,
        authError,
        login,
        registerAdmin,
        logout
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
export default AdminAuthContext;

