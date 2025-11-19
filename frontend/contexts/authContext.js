/**
 * AuthContext.js - Authentication Context Provider
 * Manages user authentication state and provides auth methods throughout the app
 */

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { API_ENDPOINTS, refreshAccessToken } from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch current user profile
   */
  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.auth.me, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 401) {
        // Try to refresh token
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          // Retry fetching user
          return fetchCurrentUser();
        } else {
          // Refresh failed, clear tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Setup token refresh interval (every 14 minutes for 15-minute tokens)
   */
  useEffect(() => {
    fetchCurrentUser();

    // Refresh token every 14 minutes (before 15-minute expiry)
    const refreshInterval = setInterval(async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await refreshAccessToken();
      }
    }, 14 * 60 * 1000); // 14 minutes

    return () => clearInterval(refreshInterval);
  }, [fetchCurrentUser]);

  /**
   * Register a new user
   */
  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.auth.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store tokens
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      
      // Set user
      setUser(data.user);
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login user
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.auth.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store tokens
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      
      // Set user
      setUser(data.user);
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');

    try {
      if (refreshToken) {
        await fetch(API_ENDPOINTS.auth.logout, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken })
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and user state regardless of API call success
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  /**
   * Logout from all devices
   */
  const logoutAll = async () => {
    const token = localStorage.getItem('accessToken');

    try {
      await fetch(API_ENDPOINTS.auth.logoutAll, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = () => {
    return user !== null && localStorage.getItem('accessToken') !== null;
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role) => {
    return user && user.role === role;
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    logoutAll,
    isAuthenticated,
    hasRole,
    refreshUser: fetchCurrentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
