import { apiClient, ApiResponse } from '@/utils/apiClient';

// Types
export interface Order {
  id: string;
  trackingNumber: string;
  status: OrderStatus;
  pickupAddress: Address;
  deliveryAddress: Address;
  packageDetails: PackageDetails;
  clientId: string;
  driverId?: string;
  price: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  commissionPaid: boolean;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
  client?: User;
  driver?: User;
  payment?: Payment;
}

export interface PackageDetails {
  weight: string | number;
  dimensions: string;
  isFragile: boolean;
  description?: string;
  additionalDetails?: {
    recipientMobileNumber?: string;
    [key: string]: any;
  };
}

export interface Payment {
  id: string;
  status: string;
  amount: number;
  paymentMethod: string;
  paymentReference: string;
  driverConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export type OrderStatus = 
  | 'PENDING'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentOrders: Order[];
}

// API endpoints
const ENDPOINTS = {
  orders: '/api/orders',
  ordersByRole: (role: string, userId: string) => `/api/orders/${role}/${userId}`,
  orderById: (id: string) => `/api/orders/${id}`,
  dashboard: (role: string, userId: string) => `/api/orders/${role}/${userId}/dashboard`,
  currentOrders: (role: string, userId: string) => `/api/orders/${role}/${userId}/current`,
  orderHistory: (role: string, userId: string) => `/api/orders/${role}/${userId}/history`
};

// Order service with all API methods
export const orderService = {
  // Get dashboard data
  getDashboardData: async (
    role: 'ADMIN' | 'CLIENT' | 'DRIVER',
    userId: string
  ): Promise<ApiResponse<DashboardData>> => {
    const roleLowerCase = role.toLowerCase();
    const endpoint = `/api/orders/${roleLowerCase}/${userId}/dashboard`;
    
    console.log('Fetching dashboard data from endpoint:', endpoint);
    console.log('Current auth token:', localStorage.getItem('token')?.substring(0, 20) + '...');
    
    try {
      const response = await apiClient.get<any>(endpoint);
      console.log('Dashboard response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Get current orders
  getCurrentOrders: async (role: string, userId: string): Promise<ApiResponse<Order[]>> => {
    return apiClient.get<Order[]>(ENDPOINTS.currentOrders(role.toLowerCase(), userId));
  },

  // Get order history
  getOrderHistory: async (role: string, userId: string): Promise<ApiResponse<Order[]>> => {
    return apiClient.get<Order[]>(ENDPOINTS.orderHistory(role.toLowerCase(), userId));
  },

  // Get single order
  getOrder: async (orderId: string): Promise<ApiResponse<Order>> => {
    return apiClient.get<Order>(ENDPOINTS.orderById(orderId));
  },

  // Create order
  createOrder: async (orderData: Partial<Order>): Promise<ApiResponse<Order>> => {
    return apiClient.post<Order>(ENDPOINTS.orders, orderData);
  },

  // Update order
  updateOrder: async (orderId: string, orderData: Partial<Order>): Promise<ApiResponse<Order>> => {
    return apiClient.put<Order>(ENDPOINTS.orderById(orderId), orderData);
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<ApiResponse<Order>> => {
    return apiClient.patch<Order>(`${ENDPOINTS.orderById(orderId)}/status`, { status });
  },

  // Accept an order (for drivers)
  acceptOrder: async (orderId: string): Promise<ApiResponse<Order>> => {
    return apiClient.patch<Order>(`${ENDPOINTS.orderById(orderId)}/accept`, {});
  },

  // Delete order
  deleteOrder: async (orderId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(ENDPOINTS.orderById(orderId));
  },

  async cancelOrder(orderId: string): Promise<ApiResponse<Order>> {
    try {
      const response = await apiClient.patch(`/api/orders/${orderId}/cancel`);
      return response;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }
}; 