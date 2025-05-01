import axios from 'axios';

// Get API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.katakksa.com';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for auth
});

// Create a separate client for bank account endpoints that doesn't use credentials
export const bankApiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Don't include credentials to avoid CORS issues
});

// Request interceptor to add auth token (for both clients)
const addAuthToken = (config: any) => {
  // Get token from localStorage if it exists
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // If token exists, add it to headers
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
};

// Apply interceptors to both clients
apiClient.interceptors.request.use(addAuthToken, error => Promise.reject(error));
bankApiClient.interceptors.request.use(addAuthToken, error => Promise.reject(error));

// Response interceptor to handle errors globally (for both clients)
const handleResponseError = async (error: any) => {
  // Handle 401 Unauthorized errors (token expired)
  if (error.response && error.response.status === 401) {
    // Clear auth data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }
  
  return Promise.reject(error);
};

apiClient.interceptors.response.use(response => response, handleResponseError);
bankApiClient.interceptors.response.use(response => response, handleResponseError);

export default apiClient; 