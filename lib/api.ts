import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set up interceptors only on client side
let interceptorsSetup = false;

const setupApiInterceptors = () => {
  if (typeof window === 'undefined' || interceptorsSetup) {
    return;
  }

  interceptorsSetup = true;

  // Interceptor to update token on each request
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Handle 401 errors (unauthorized)
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/admin/login';
      }
      return Promise.reject(error);
    }
  );
};

// Setup interceptors when module loads (client-side only)
if (typeof window !== 'undefined') {
  setupApiInterceptors();
}

export default api;

