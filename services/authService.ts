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
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.katakksa.com'}${ENDPOINTS.login}`, {
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
        // Handle specific error cases based on status code and response structure
        if (responseData.status === 'fail') {
          switch (responseData.message) {
            case 'Password is required':
            case 'Email or phone number is required':
              throw new Error('Please provide all required credentials');
            case 'Incorrect email/phone or password':
              throw new Error('Invalid credentials. Please check your email/phone and password');
            case 'Your account has been deactivated':
              throw new Error('This account has been deactivated. Please contact support');
            case 'Your account is pending confirmation':
              throw new Error('Please confirm your account before logging in');
            default:
              throw new Error(responseData.message);
          }
        } else if (responseData.status === 'error') {
          throw new Error('Server error occurred. Please try again later');
        }
        
        // Handle HTTP status codes
        switch (response.status) {
          case 400:
            throw new Error('Invalid request format');
          case 401:
            throw new Error('Authentication failed');
          case 403:
            throw new Error('Access denied');
          case 500:
            throw new Error('Server error occurred');
          default:
            throw new Error('Login failed. Please try again');
        }
      }
      
      // Handle success response
      if (responseData.status === 'success' && responseData.data?.token && responseData.data?.user) {
        const { token, user } = responseData.data;
        
        // Validate user data
        if (!user.id || !user.name || !user.phone || !user.role) {
          console.error('Invalid user data in response:', user);
          throw new Error('Invalid user data received from server');
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
      }
      
      throw new Error('Invalid response structure from server');
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
      
      const responseData = await response.json();
      console.log('Raw server response:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Registration failed');
      }
      
      // Return the response as is since it matches our expected structure
      return responseData;
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