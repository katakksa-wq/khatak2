import { useEffect } from 'react';

// For tracking active requests
let activeRequests: AbortController[] = [];

// API configuration
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://api.kataakksa.com:5000',
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Error types
type NetworkError = {
  type: 'network';
  message: string;
};

type ApiError = {
  type: 'api';
  status: number;
  message: string;
  details?: any;
};

type AuthError = {
  type: 'auth';
  message: string;
};

export type ApiClientError = NetworkError | ApiError | AuthError;

// Standard response type
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

// Get the auth token from localStorage (client-side only)
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') {
    console.log('Running on server side, no token available');
    return null;
  }
  
  const token = localStorage.getItem('token');
  console.log('Retrieved token:', token ? 'Token exists' : 'No token found');
  return token;
};

// Get headers with auth token if available
const getHeaders = (customHeaders?: Record<string, string>): Record<string, string> => {
  const token = getAuthToken();
  const hasAuthHeader = !!token;
  
  if (hasAuthHeader) {
    // Check if token already has Bearer prefix
    const finalToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    console.log('Adding auth token to request headers');
    
    return {
      ...API_CONFIG.defaultHeaders,
      'Authorization': finalToken,
      ...customHeaders
    };
  } else {
    console.log('No auth token available for request');
    
    return {
      ...API_CONFIG.defaultHeaders,
      ...customHeaders
    };
  }
};

// Check if user is logged out
const isUserLoggedOut = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('userLoggedOut') === 'true';
};

// Cancel all active requests
export const cancelAllRequests = (): void => {
  activeRequests.forEach(controller => controller.abort());
  activeRequests = [];
};

// Generic request function
const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    // Don't make requests if user is logged out
    if (isUserLoggedOut()) {
      throw { type: 'auth', message: 'User is logged out' };
    }

    const controller = new AbortController();
    activeRequests.push(controller);

    const headers = getHeaders(options.headers as Record<string, string>);
    console.log('API Request:', options.method || 'GET', endpoint, { hasAuthHeader: !!headers.Authorization });

    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    // Remove this request from active requests
    activeRequests = activeRequests.filter(c => c !== controller);

    // Log response status
    console.log('API Response status:', response.status);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw {
        type: 'api',
        status: response.status,
        message: 'Server returned non-JSON response'
      };
    }

    const data = await response.json();
    console.log('Raw API Response:', data);

    // Handle error responses
    if (!response.ok) {
      throw {
        type: 'api',
        status: response.status,
        message: data.message || 'An error occurred',
        details: data
      };
    }

    // Check if the response is already in our expected format
    if (typeof data === 'object' && ('status' in data) && data.status === 'success') {
      return data as ApiResponse<T>;
    }
    
    // Auth endpoints (/api/auth/login and /api/auth/register) return a direct response
    // For these endpoints, wrap the data in our standard format
    if (endpoint.startsWith('/api/auth/')) {
      return {
        status: 'success',
        data: data as T
      };
    }
    
    // Otherwise, assume the data is the actual content and wrap it
    return {
      status: 'success',
      data: data as T
    };
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
};

// HTTP method wrappers
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => 
    request<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T>(endpoint: string, data?: any, options?: RequestInit) => 
    request<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  put: <T>(endpoint: string, data?: any, options?: RequestInit) => 
    request<T>(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  patch: <T>(endpoint: string, data?: any, options?: RequestInit) => 
    request<T>(endpoint, { 
      ...options, 
      method: 'PATCH', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  delete: <T>(endpoint: string, options?: RequestInit) => 
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

// Authentication helper
export const useAuthCheck = (router?: any) => {
  useEffect(() => {
    const token = getAuthToken();
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    
    if (!token || !userStr) {
      console.log('Auth check failed - redirecting to login', { hasToken: !!token, hasUser: !!userStr });
      if (router) {
        router.push('/login');
      } else if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } else {
      console.log('Auth check passed - user is authenticated');
    }
  }, [router]);
};

// Export the API Config for references
export const apiConfig = API_CONFIG; 