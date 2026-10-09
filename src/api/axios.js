import axios from 'axios';

const rawBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://secretsync-backend.onrender.com'
    : 'http://localhost:5000');

const baseURL = (rawBaseUrl || '').trim().replace(/\/+$/, '');

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});


// Axios request interceptor to attach Bearer token if present
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Axios response interceptor for session expiration / 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAuthRequest = error.config?.url?.includes('/api/auth/login');
        
        if (currentPath !== '/login' && !isAuthRequest) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
