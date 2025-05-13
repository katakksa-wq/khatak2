import { apiClient, ApiResponse, cancelAllRequests } from '@/utils/apiClient';
import { User } from '@/types';


// Types
export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface RegisterData {
  name: string;
  phone: string;
  password: string;
  role: string;
  plateNumber?: string;
  carMake?: string;
  carModel?: string;
  carYear?: string;
  carColor?: string;
  licenseDocumentUrl?: string;
  registrationDocumentUrl?: string;
  driverPhotoUrl?: string;
  driverDocuments?: any;
  tempRegistrationId?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface DriverRegistrationData {
  plateNumber: string;
  carMake: string;
  carModel: string;
  carYear: string;
  carColor: string;
  licenseDocumentUrl: string;
  registrationDocumentUrl: string;
  driverPhotoUrl: string;
  driverDocuments?: any;
  tempRegistrationId?: string;
}

// API endpoints
const ENDPOINTS = {
  login: '/api/auth/login',
  register: '/api/auth/register',
  driverRegister: '/api/auth/driver-register',
  logout: '/api/auth/logout',
  me: '/api/auth/me',
  verifyEmail: (token: string) => `/api/auth/verify/${token}`,
  resetPassword: '/api/auth/reset-password',
  forgotPassword: '/api/auth/forgot-password'
};

// Generate a temporary token for development
const generateTempToken = (user: User): string => {
  const timestamp = Date.now();
  return `Bearer ${Buffer.from(`${user.id}:${user.role}:${timestamp}`).toString('base64')}`;
};

// Auth service with all API methods
export const authService = {
  // Login user with either email or phone
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    try {
      console.log('Attempting login with identifier:', credentials.phone);
      
      // Format phone number only if it's not an email
      let phone = credentials.phone;
      
      // Format the request body based on identifier type
      const requestBody = {
        password: credentials.password,
        phone: phone
      };
      
      console.log('Sending login request with:', requestBody);
      
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const responseData = await response.json();
      console.log('Server response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Login failed');
      }

      return {
        status: 'success',
        data: responseData
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Register new user
  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    try {
      console.log('Attempting registration with:', data.phone);
      console.log('Registration data being sent to server:', data);
      
      const response = await fetch(`/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const responseData = await response.json();
      console.log('Server response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Registration failed');
      }

      return {
        status: 'success',
        data: responseData
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Register driver additional info
  registerDriver: async (driverId: string, data: DriverRegistrationData): Promise<ApiResponse<any>> => {
    return apiClient.post(`${ENDPOINTS.driverRegister}/${driverId}`, data);
  },

  // Verify email
  verifyEmail: async (token: string): Promise<ApiResponse<void>> => {
    return apiClient.get(ENDPOINTS.verifyEmail(token));
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<ApiResponse<void>> => {
    return apiClient.post(ENDPOINTS.forgotPassword, { email });
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<void>> => {
    return apiClient.post(ENDPOINTS.resetPassword, { token, password: newPassword });
  },

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return apiClient.get<User>(ENDPOINTS.me);
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      // Cancel all in-flight API requests
      cancelAllRequests();
      
      // Set logout flag to prevent new requests
      localStorage.setItem('userLoggedOut', 'true');
      
      // Attempt to call logout endpoint if it exists
      await apiClient.post(ENDPOINTS.logout);
    } catch (error) {
      console.warn('Logout endpoint failed:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userLoggedOut'); // Clean up flag after logout process
      
      // Force reload to clear any application state
      window.location.href = '/login';
    }
  },

  // Check if user is logged in
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!token && !!user;
  },

  // Get current user from localStorage
  getUser: (): User | null => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;

      const user = JSON.parse(userStr) as User;
      return user;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Get token from localStorage
  getToken: (): string | null => {
    return localStorage.getItem('token');
  }
}; 