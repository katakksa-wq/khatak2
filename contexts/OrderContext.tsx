'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/utils/apiClient';
import { authService } from '@/services/authService';
import { Order, OrderStatus, ApiResponse, Address, User, PaymentStatus } from '@/types';

// Extended Order type with client and driver information
export interface OrderWithUserInfo extends Order {
  client?: {
    name: string;
    email: string;
    phone: string;
  };
  driver?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface OrderContextType {
  orders: OrderWithUserInfo[];
  currentOrder: OrderWithUserInfo | null;
  loading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  fetchCurrentOrder: (orderId?: string) => Promise<void>;
  createOrder: (orderData: Partial<Order>) => Promise<OrderWithUserInfo | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<boolean>;
  refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<OrderWithUserInfo[]>([]);
  const [currentOrder, setCurrentOrder] = useState<OrderWithUserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setError(null);
      
      const user = authService.getUser();
      if (!user) return;
      
      console.log('Fetching orders from OrderContext for:', user);
      
      let endpoint = '';
      
      // Get the correct endpoint based on user role
      if (user.role === 'CLIENT') {
        endpoint = `/api/orders/client/${user.id}/current`;
      } else if (user.role === 'ADMIN') {
        endpoint = `/api/admin/orders`;
      } else if (user.role === 'DRIVER') {
        // For drivers, use a different approach - get orders assigned to them
        endpoint = `/api/orders/driver/${user.id}/current`;
      }
      
      console.log('Using endpoint:', endpoint);
      
      interface ResponseType {
        status: string;
        data: any;
        message?: string;
        results?: number;
        totalPages?: number;
        currentPage?: number;
      }
      
      const response = await apiClient.get<ResponseType>(endpoint);
      
      if (user.role === 'ADMIN' && response.data && response.data.data) {
        // Admin receives an array of orders directly
        console.log('Orders fetched successfully:', response.data.data);
        // Ensure we're setting an array
        const ordersData = Array.isArray(response.data.data) 
          ? response.data.data 
          : [];
        setOrders(ordersData);
      } else if (response.data && response.data.data) {
        // Client and driver receive a single order or null
        const order = response.data.data as unknown as OrderWithUserInfo;
        console.log('Order fetched successfully:', order);
        if (order) {
          setOrders([order]);
        } else {
          setOrders([]);
        }
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
      setOrders([]);
    }
  };

  const fetchCurrentOrder = async (orderId?: string) => {
    try {
      setError(null);
      
      const user = authService.getUser();
      if (!user) return;
      
      console.log('Fetching current order for:', user);
      
      let endpoint = '';
      
      // If an order ID is specified, get that specific order
      if (orderId) {
        if (user.role === 'CLIENT') {
          endpoint = `/api/orders/client/${user.id}/orders/${orderId}`;
        } else if (user.role === 'ADMIN') {
          endpoint = `/api/admin/orders/${orderId}`;
        } else if (user.role === 'DRIVER') {
          endpoint = `/api/orders/driver/${user.id}/orders/${orderId}`;
        }
      } else {
        // Get the current active order based on user role
        if (user.role === 'CLIENT') {
          endpoint = `/api/orders/client/${user.id}/current`;
        } else if (user.role === 'ADMIN') {
          endpoint = `/api/admin/orders`;
        } else if (user.role === 'DRIVER') {
          endpoint = `/api/orders?assigned=true`;
        }
      }
      
      console.log('Using endpoint:', endpoint);
      
      interface ResponseType {
        status: string;
        data: any;
        message?: string;
        results?: number;
        totalPages?: number;
        currentPage?: number;
      }
      
      const response = await apiClient.get<ResponseType>(endpoint);
      
      if (user.role === 'ADMIN' && !orderId && response.data && response.data.data) {
        // For admin without specific orderId, we get an array of orders
        const orders = Array.isArray(response.data.data) 
          ? response.data.data as OrderWithUserInfo[]
          : [];
        console.log('Current order response:', orders);
        
        // Set the most recent order as current if there are any
        if (orders && orders.length > 0) {
          setCurrentOrder(orders[0]);
        } else {
          setCurrentOrder(null);
        }
      } else if (response.data && response.data.data) {
        // For client, driver, or admin with specific orderId
        const order = response.data.data as OrderWithUserInfo;
        console.log('Current order response:', order);
        setCurrentOrder(order || null);
      } else {
        setCurrentOrder(null);
      }
    } catch (err: any) {
      console.error('Error fetching current order:', err);
      setError('Failed to fetch current order');
      setCurrentOrder(null);
    }
  };

  const createOrder = async (orderData: Partial<Order>): Promise<OrderWithUserInfo | null> => {
    const user = authService.getUser();
    if (!user) {
      console.error('User not logged in, cannot create order');
      setError('You must be logged in to create an order');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
      console.log('User ID:', user.id);
      console.log('User role:', user.role);
      
      // Make sure clientId is set if not present in orderData
      const orderWithClient = {
        ...orderData,
        clientId: orderData.clientId || user.id
      };
      
      console.log('Final order data with clientId:', orderWithClient);
      
      // Use the apiClient utility for consistent error handling and authentication
      const response = await apiClient.post<ApiResponse<OrderWithUserInfo>>('/api/orders', orderWithClient);
      
      console.log('Order creation response:', response);

      // Check if response was successful and contains data
      if (response.status === 'success' && response.data) {
        // Get the new order from the response
        const newOrder = response.data as unknown as OrderWithUserInfo;
        
        console.log('New order created:', newOrder);
        
        // Normalize status fields if they're strings
        if (typeof newOrder.status === 'string') {
          newOrder.status = newOrder.status.toUpperCase() as OrderStatus;
        }
        
        if (typeof newOrder.paymentStatus === 'string') {
          newOrder.paymentStatus = newOrder.paymentStatus.toUpperCase() as PaymentStatus;
        }

        // Update the orders state with the new order
        setOrders(prevOrders => [newOrder, ...prevOrders]);
        
        // Set as current order
        setCurrentOrder(newOrder);
        
        return newOrder;
      } else {
        console.error('Order creation failed:', response.message, response);
        setError(response.message || 'Failed to create order');
        return null;
      }
    } catch (err: any) {
      console.error('Error creating order:', err);
      
      // More detailed logging of error
      console.error('Error details:', JSON.stringify(err, null, 2));
      
      // Handle different error types
      if (err.type === 'network') {
        const errorMsg = `Network error: ${err.message}. Please check your internet connection.`;
        console.error(errorMsg);
        setError(errorMsg);
      } else if (err.type === 'api') {
        const errorMsg = `API error (${err.status}): ${err.message}`;
        console.error(errorMsg);
        console.error('API error details:', err.details);
        setError(errorMsg);
      } else if (err.type === 'auth') {
        const errorMsg = 'Authentication error. Please log in again.';
        console.error(errorMsg);
        setError(errorMsg);
        // Clear auth data on auth errors
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else {
        const errorMsg = err.message || 'An unexpected error occurred';
        console.error('Unexpected error:', errorMsg);
        setError(errorMsg);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<boolean> => {
    if (!authService.getUser()) return false;

    try {
      setLoading(true);
      setError(null);

      const user = authService.getUser();

      // Admin, update order's status when panel user updates it
      if (user?.role === 'ADMIN') {
        console.log(`Updating order ${orderId} status to ${status}`);
        const response = await apiClient.patch<OrderWithUserInfo>(`/api/admin/orders/${orderId}/status`, { status });
        
        console.log('Update order status response:', response);
        return !!response.data;
      }

      // Client, update order's status when client updates it
      if (user?.role === 'CLIENT') {
        console.log(`Updating order ${orderId} status to ${status}`);
        const response = await apiClient.patch<OrderWithUserInfo>(`/api/orders/client/${user.id}/orders/${orderId}/status`, { status });
        
        console.log('Update order status response:', response);
        return !!response.data;
      }

      // Driver, update order's status when driver updates it
      if (user?.role === 'DRIVER') {
        console.log(`Updating order ${orderId} status to ${status}`);
        const response = await apiClient.patch<OrderWithUserInfo>(`/api/orders/driver/${user.id}/orders/${orderId}/status`, { status });
        
        console.log('Update order status response:', response);
        return !!response.data;
      }

      // If no valid role is found, return false
      setError('Invalid role for updating order status');
      return false;
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.message || 'Failed to update order status');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = authService.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      console.log('Refreshing orders for:', {
        role: user.role,
        userId: user.id
      });
      
      // Get the correct endpoint based on user role - same logic as fetchOrders
      let endpoint;
      if (user.role === 'CLIENT') {
        endpoint = `/api/orders/client/${user.id}/current`;
      } else if (user.role === 'ADMIN') {
        endpoint = `/api/admin/orders`;
      } else if (user.role === 'DRIVER') {
        endpoint = `/api/orders?assigned=true`;
      } else {
        throw new Error(`Unsupported role: ${user.role}`);
      }
      
      console.log('Using endpoint for refresh:', endpoint);
      
      const response = await apiClient.get<OrderWithUserInfo[]>(endpoint);
      
      if (response.status === 'success' && response.data) {
        const orders = Array.isArray(response.data) ? response.data : [];
        console.log('Orders refreshed successfully:', orders);
        setOrders(orders);
      } else {
        throw new Error(response.message || 'Failed to refresh orders');
      }
    } catch (err) {
      console.error('Error refreshing orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCurrentOrder();
  }, []);

  return (
    <OrderContext.Provider value={{
      orders,
      currentOrder,
      loading,
      error,
      fetchOrders,
      fetchCurrentOrder,
      createOrder,
      updateOrderStatus,
      refreshOrders
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}

export default OrderContext; 