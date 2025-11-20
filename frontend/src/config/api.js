/**
 * api.js - Centralized API configuration
 * Manages all API endpoints and base URLs
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:6001';
const AUTH_BASE_URL = process.env.REACT_APP_AUTH_URL || 'http://localhost:4001';
const ADMIN_BASE_URL = process.env.REACT_APP_ADMIN_URL || 'http://localhost:5001';
const LLM_BASE_URL = process.env.REACT_APP_LLM_URL || 'http://localhost:7001';

export const API_ENDPOINTS = {
  // Client Service - Event Browsing
  events: `${API_BASE_URL}/api/events`,
  purchaseTicket: (id) => `${API_BASE_URL}/api/events/${id}/purchase`,

  // Auth Service - User Authentication
  auth: {
    register: `${AUTH_BASE_URL}/api/auth/register`,
    login: `${AUTH_BASE_URL}/api/auth/login`,
    refresh: `${AUTH_BASE_URL}/api/auth/refresh`,
    logout: `${AUTH_BASE_URL}/api/auth/logout`,
    logoutAll: `${AUTH_BASE_URL}/api/auth/logout-all`,
    me: `${AUTH_BASE_URL}/api/auth/me`,
  },

  // Admin Service - Event Management
  admin: {
    events: `${ADMIN_BASE_URL}/api/admin/events`,
    event: (id) => `${ADMIN_BASE_URL}/api/admin/events/${id}`,
  },

  // LLM Service - Natural Language Booking
  llm: {
    parse: `${LLM_BASE_URL}/api/llm/parse`,
    confirmBooking: `${LLM_BASE_URL}/api/llm/confirm-booking`,
    events: `${LLM_BASE_URL}/api/llm/events`,
  }
};

/**
 * Helper function to make authenticated API requests
 * Automatically includes JWT token in Authorization header
 */
export const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('accessToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle token expiration
  if (response.status === 401) {
    // Try to refresh token
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the original request with new token
      const newToken = localStorage.getItem('accessToken');
      headers['Authorization'] = `Bearer ${newToken}`;
      return fetch(url, { ...options, headers });
    } else {
      // Refresh failed, redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
};

/**
 * Refresh the access token using the refresh token
 */
export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(API_ENDPOINTS.auth.refresh, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
    
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

export default API_ENDPOINTS;
