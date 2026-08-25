import axios from 'axios';

let API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// In production builds, override any leftover localhost VITE_API_URL to relative '/api'
if (import.meta.env.PROD && API_BASE_URL.includes('localhost')) {
  API_BASE_URL = '/api';
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT Bearer Token if logged in
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('velora_token') || localStorage.getItem('nexacart_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('velora_token');
        localStorage.removeItem('velora_user');
        localStorage.removeItem('nexacart_token');
        localStorage.removeItem('nexacart_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
