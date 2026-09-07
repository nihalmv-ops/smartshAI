import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10s timeout
});

// Request Interceptor: Attach JWT Token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartmart_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Format error responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If token expired / unauthorized (401), clean up if appropriate
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on login or register endpoints
      const url = error.config ? error.config.url : '';
      if (!url.includes('/login') && !url.includes('/register') && !url.includes('/google')) {
        console.warn('Session expired or unauthorized. Token may need renewal.');
      }
    }
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      'An unexpected network error occurred';

    return Promise.reject(new Error(message));
  }
);

export default api;

