import axios from 'axios';

// Get API URL from environment variable
// Next.js automatically loads .env.local in development and .env.production in production
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Log the API URL in development mode for debugging
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  console.log('API URL:', API_URL);
}

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

  // Handle 401/403 errors (unauthorized/forbidden)
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if ((error.response?.status === 401 || error.response?.status === 403) && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        
        // Don't redirect if we're already on a login page or signup page
        // Let the login page handle the error display
        if (currentPath.includes('/login') || currentPath.includes('/signup')) {
          // Only remove token, don't redirect - let the page show the error
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
          }
          return Promise.reject(error);
        }
        
        // Only redirect to admin login if we're not on provider pages
        if (!currentPath.includes('/provider')) {
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/admin/login';
          }
        } else {
          // For provider pages, just remove token but don't redirect
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
          }
        }
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

