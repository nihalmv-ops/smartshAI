import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('smartmart_token') || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('smartmart_user');
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
        localStorage.setItem('smartmart_token', token);
      } else {
        localStorage.removeItem('smartmart_token');
      }

      if (user) {
        localStorage.setItem('smartmart_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('smartmart_user');
      }
    } catch (e) {
      console.error('Failed to sync auth state to localStorage:', e);
    }
  }, [token, user]);

  // Optionally verify / refresh profile when token exists on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const data = await authService.getProfile();
          if (data && data.user) {
            setUser(prev => ({
              ...prev,
              ...data.user,
              token
            }));
          }
        } catch (err) {
          console.warn('Session verification notice:', err.message);
          // If token rejected, don't abruptly clear unless 401
          if (err.message.includes('Not authorized') || err.message.includes('jwt')) {
            logout();
          }
        }
      }
    };
    checkAuth();
  }, [token]);

  // Login with email and password
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await authService.login({ email, password });
      if (data && data.user) {
        const authToken = data.user.token;
        setToken(authToken);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      throw new Error(data.message || 'Login failed');
    } catch (error) {
      setAuthError(error.message);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Register a new user
  const register = async (name, email, password, phone, address) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await authService.register({ name, email, password, phone, address });
      if (data && data.user) {
        const authToken = data.user.token;
        setToken(authToken);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      throw new Error(data.message || 'Registration failed');
    } catch (error) {
      setAuthError(error.message);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Login
  const googleLogin = async ({ credential, client_id, userProfile }) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await authService.googleAuth({ credential, client_id, userProfile });
      if (data && data.user) {
        const authToken = data.user.token;
        setToken(authToken);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      throw new Error(data.message || 'Google login failed');
    } catch (error) {
      setAuthError(error.message);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Register a new administrator
  const registerAdmin = async ({ name, email, password, phone, address, adminSecretKey }) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await authService.registerAdmin({ name, email, password, phone, address, adminSecretKey });
      if (data && data.user) {
        const authToken = data.user.token;
        setToken(authToken);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      throw new Error(data?.message || 'Admin registration failed');
    } catch (error) {
      setAuthError(error.message);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthError(null);
    localStorage.removeItem('smartmart_token');
    localStorage.removeItem('smartmart_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isAdmin: user?.role === 'admin',
        loading,
        authError,
        login,
        register,
        registerAdmin,
        googleLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
