import { apiClient, ApiResponse, cancelAllRequests } from '@/utils/apiClient';


// Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'CLIENT' | 'DRIVER';
  isConfirmed: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  address?: string;
  lastLogin?: string;
  profileImage?: string;
  driverProfile?: {
    vehicleType: string;
    vehicleModel: string;
    licenseNumber: string;
    insuranceNumber: string;
    isVerified: boolean;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'CLIENT' | 'DRIVER';
}

export interface DriverRegistrationData {
  vehicleDetails: {
    type: string;
    model: string;
    plateNumber: string;
    year: number;
  };
  licenseNumber: string;
  insuranceNumber: string;
}

export interface AuthResponse {
  token: string;
  user: User;
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
  // Login user
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    try {
      console.log('Attempting login...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.katakksa.com'}${ENDPOINTS.login}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const responseData = await response.json();
      console.log('Raw server response:', responseData);
      
      // Extract token and user based on response structure
      let token, user;
      
      // Handle different response structures
      if (responseData.status === 'success') {
        // Case 1: Fully nested - {status: 'success', data: {token, user}}
        if (responseData.data?.token && responseData.data?.user) {
          token = responseData.data.token;
          user = responseData.data.user;
        }
        // Case 2: Mixed - {status: 'success', token: '...', data: {user}}
        else if (responseData.token && responseData.data?.user) {
          token = responseData.token;
          user = responseData.data.user;
        }
        // Case 3: Flat with status - {status: 'success', token: '...', user: {...}}
        else if (responseData.token && responseData.user) {
          token = responseData.token;
          user = responseData.user;
        }
      }
      // Case 4: Completely flat without status - {token: '...', user: {...}}
      else if (responseData.token && responseData.user) {
        token = responseData.token;
        user = responseData.user;
      }
      
      // Validate extracted data
      if (!token || !user || !user.id) {
        console.error('Invalid response structure:', responseData);
        throw new Error('Login failed: Invalid response from server');
      }
      
      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Return formatted response
      return {
        status: 'success',
        data: {
          user,
          token
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      // Clear any partial auth data if login fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    }
  },

  // Register user
  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    try {
      console.log('Attempting registration...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.katakksa.com'}${ENDPOINTS.register}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const responseData = await response.json();
      console.log('Raw server response:', responseData);
      
      // Extract token and user based on response structure
      let token, user;
      
      // Handle different response structures
      if (responseData.status === 'success') {
        // Case 1: Fully nested - {status: 'success', data: {token, user}}
        if (responseData.data?.token && responseData.data?.user) {
          token = responseData.data.token;
          user = responseData.data.user;
        }
        // Case 2: Mixed - {status: 'success', token: '...', data: {user}}
        else if (responseData.token && responseData.data?.user) {
          token = responseData.token;
          user = responseData.data.user;
        }
        // Case 3: Flat with status - {status: 'success', token: '...', user: {...}}
        else if (responseData.token && responseData.user) {
          token = responseData.token;
          user = responseData.user;
        }
      }
      // Case 4: Completely flat without status - {token: '...', user: {...}}
      else if (responseData.token && responseData.user) {
        token = responseData.token;
        user = responseData.user;
      }
      
      // Validate extracted data
      if (!token || !user || !user.id) {
        console.error('Invalid response structure:', responseData);
        throw new Error('Registration failed: Invalid response from server');
      }
      
      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Show a confirmation message based on the user role
      if (user.role === 'DRIVER') {
        alert('Driver registered successfully! Please complete your driver profile.');
      } else {
        alert('Registration successful! You are now logged in.');
      }
      
      // Return formatted response
      return {
        status: 'success',
        data: {
          user,
          token
        }
      };
    } catch (error) {
      console.error('Registration error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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