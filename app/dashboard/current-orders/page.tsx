'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrderContext';
import { Order } from '@/types';
import { FaSpinner, FaCheck, FaTruck, FaBoxOpen, FaArrowRight, FaTrash } from 'react-icons/fa';
import { apiClient } from '@/utils/apiClient';
import { useRouter } from 'next/navigation';
import { orderService, OrderStatus } from '@/services/orderService';
import { toast } from 'react-toastify';
import { useLanguage } from '@/contexts/LanguageContext';
import TranslatedText from '@/components/TranslatedText';

export default function CurrentOrdersPage() {
  const { user, isDriver, isClient } = useAuth();
  const { fetchOrders, orders, loading: ordersLoading } = useOrders();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentOrders, setCurrentOrders] = useState<Order[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const router = useRouter();

  // Function to fetch current orders from the API
  const fetchCurrentOrders = async (isRefresh = false) => {
    if (!user) return;
    
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      console.log('Fetching current orders for:', user.role);
      
      let response;
      
      // Use different endpoints based on user role
      if (isDriver()) {
        // For drivers, use the specific driver current orders endpoint
        const driverResponse = await apiClient.get(`/api/orders/driver/${user.id}/current`);
        console.log('Driver current orders response:', driverResponse);
        
        response = {
          status: 'success',
          data: extractOrdersFromResponse(driverResponse)
        };
      } else if (isClient()) {
        // For clients, fetch active orders separately and combine them
        const pendingResponse = await apiClient.get(`/api/orders?clientId=${user.id}&status=PENDING`);
        const acceptedResponse = await apiClient.get(`/api/orders?clientId=${user.id}&status=ACCEPTED`);
        const pickedUpResponse = await apiClient.get(`/api/orders?clientId=${user.id}&status=PICKED_UP`);
        const inTransitResponse = await apiClient.get(`/api/orders?clientId=${user.id}&status=IN_TRANSIT`);
        
        console.log('Client responses:', { pending: pendingResponse, accepted: acceptedResponse, pickedUp: pickedUpResponse, inTransit: inTransitResponse });
        
        // Extract orders from each response and combine them
        const orders = [
          ...extractOrdersFromResponse(pendingResponse),
          ...extractOrdersFromResponse(acceptedResponse),
          ...extractOrdersFromResponse(pickedUpResponse),
          ...extractOrdersFromResponse(inTransitResponse)
        ];
        
        response = {
          status: 'success',
          data: orders
        };
      } else {
        // For admins, fetch active orders separately and combine them
        const pendingResponse = await apiClient.get('/api/orders?status=PENDING');
        const acceptedResponse = await apiClient.get('/api/orders?status=ACCEPTED');
        const pickedUpResponse = await apiClient.get('/api/orders?status=PICKED_UP');
        const inTransitResponse = await apiClient.get('/api/orders?status=IN_TRANSIT');
        
        console.log('Admin responses:', { pending: pendingResponse, accepted: acceptedResponse, pickedUp: pickedUpResponse, inTransit: inTransitResponse });
        
        // Extract orders from each response and combine them
        const orders = [
          ...extractOrdersFromResponse(pendingResponse),
          ...extractOrdersFromResponse(acceptedResponse),
          ...extractOrdersFromResponse(pickedUpResponse),
          ...extractOrdersFromResponse(inTransitResponse)
        ];
        
        response = {
          status: 'success',
          data: orders
        };
      }

      console.log('Combined current orders response:', response);
      
      if (response.status === 'success') {
        setCurrentOrders(response.data);
      } else {
        console.error('API response was not successful:', response);
        setCurrentOrders([]);
      }
    } catch (err) {
      console.error('Error fetching current orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      setCurrentOrders([]);
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };
  
  // Helper function to extract orders from API response
  const extractOrdersFromResponse = (response: any): Order[] => {
    if (!response || !response.data) {
      return [];
    }
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (typeof response.data === 'object') {
      // Check for nested data structures
      if (Array.isArray(response.data.orders)) {
        return response.data.orders;
      }
      
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // If data is directly in the data property and it's an array
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // Handle case where single order is returned
      if (response.data.id) {
        return [response.data];
      }
    }
    
    console.warn('Could not extract orders from response:', response);
    return [];
  };

  // Handle status update for driver
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!user) return;
    
    try {
      setUpdatingOrderId(orderId);
      
      // Update order status using the orderService
      const response = await orderService.updateOrderStatus(orderId, newStatus as OrderStatus);
      
      if (response.status === 'success') {
        // Update the order in the local state
        if (newStatus === 'CANCELLED') {
          // Remove cancelled order from current orders list
          setCurrentOrders(prev => prev.filter(order => order.id !== orderId));
          toast.success('Order cancelled successfully');
        } else {
          // Update status for other status changes
          setCurrentOrders(prev => 
            prev.map(order => 
              order.id === orderId 
                ? { ...order, status: newStatus as any } 
                : order
            )
          );
          toast.success(`Order status updated to ${newStatus}`);
        }
        
        // If the order is marked as delivered, redirect to payment confirmation
        if (newStatus === 'DELIVERED') {
          router.push('/dashboard/payment-confirmation');
        }
      } else {
        throw new Error(response.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error('Failed to update order status. Please try again.');
    } finally {
      setUpdatingOrderId(null);
    }
  };
  
  // Check if order can be cancelled
  const canCancelOrder = (order: Order) => {
    if (!user) return false;

    // Client can cancel orders in PENDING or ACCEPTED state
    if (isClient() && order.clientId === user.id) {
      return ['PENDING', 'ACCEPTED'].includes(order.status);
    }

    // Driver can cancel orders in ACCEPTED or PICKED_UP state
    if (isDriver() && order.driverId === user.id) {
      return ['ACCEPTED', 'PICKED_UP'].includes(order.status);
    }

    // Admin can cancel any order that's not delivered or cancelled
    if (user.role === 'ADMIN') {
      return !['DELIVERED', 'CANCELLED'].includes(order.status);
    }

    return false;
  };

  // Handle order cancellation with better error handling
  const handleCancelOrder = async (orderId: string) => {
    if (!user) return;

    const order = currentOrders.find(o => o.id === orderId);
    if (!order) return;

    const confirmMessage = isClient() 
      ? t('orders.confirmClientCancel')
      : isDriver()
      ? t('orders.confirmDriverCancel')
      : t('orders.confirmAdminCancel');

    if (window.confirm(confirmMessage)) {
      try {
        setUpdatingOrderId(orderId);
        
        // Use the new cancelOrder method
        const response = await orderService.cancelOrder(orderId);
        
        if (response.status === 'success') {
          // Remove cancelled order from current orders list
          setCurrentOrders(prev => prev.filter(order => order.id !== orderId));
          
          // Show success message based on user role
          const successMessage = isClient()
            ? t('orders.clientCancelSuccess')
            : isDriver()
            ? t('orders.driverCancelSuccess')
            : t('orders.adminCancelSuccess');
            
          toast.success(successMessage);
        } else {
          throw new Error(response.message || t('orders.cancelFailed'));
        }
      } catch (err) {
        console.error('Error cancelling order:', err);
        toast.error(t('orders.cancelError'));
      } finally {
        setUpdatingOrderId(null);
      }
    }
  };

  // Initial fetch of orders
  useEffect(() => {
    fetchCurrentOrders();
  }, [user]); // Depend on user to refetch when user changes

  // Handle manual refresh
  const handleRefresh = () => {
    fetchCurrentOrders(true);
  };

  if (!user) {
    return <div><TranslatedText text="loading.message" /></div>;
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden"><TranslatedText text="loading.message" /></span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h2 className="card-title mb-0"><TranslatedText text="orders.current" /></h2>
              <button 
                className="btn btn-light btn-sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <FaSpinner className={`me-2 ${isRefreshing ? 'fa-spin' : ''}`} />
                {isRefreshing ? <TranslatedText text="orders.refreshing" /> : <TranslatedText text="button.refresh" />}
              </button>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {currentOrders.length === 0 ? (
                <div className="text-center py-5">
                  <h3 className="text-muted"><TranslatedText text="orders.noActiveOrders" /></h3>
                  <p className="text-muted">
                    {isDriver() 
                      ? <TranslatedText text="orders.noDriverOrders" />
                      : <TranslatedText text="orders.noClientOrders" />}
                  </p>
                  {isClient() && (
                    <button 
                      className="btn btn-primary mt-3"
                      onClick={() => window.location.href = '/dashboard/new-order'}
                    >
                      <TranslatedText text="orders.new" />
                    </button>
                  )}
                  {isDriver() && (
                    <button 
                      className="btn btn-primary mt-3"
                      onClick={() => window.location.href = '/dashboard/available-orders'}
                    >
                      <TranslatedText text="orders.findAvailable" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th><TranslatedText text="orders.trackingNumber" /></th>
                        <th><TranslatedText text="orders.status" /></th>
                        <th><TranslatedText text="orders.pickupAddress" /></th>
                        <th><TranslatedText text="orders.deliveryAddress" /></th>
                        <th><TranslatedText text="orders.price" /></th>
                        <th><TranslatedText text="orders.createdAt" /></th>
                        <th><TranslatedText text="orders.actions" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOrders.map((order) => (
                        <tr key={order.id}>
                          <td>{order.trackingNumber}</td>
                          <td>
                            <span className={`badge bg-${getStatusColor(order.status)}`}>
                              <TranslatedText text={`dashboard.orderStatus.${order.status}`} />
                            </span>
                          </td>
                          <td>
                            <div>
                              <div>{order.pickupAddress.street}</div>
                              <div>
                                {order.pickupAddress.city}, {order.pickupAddress.state} {order.pickupAddress.zipCode}
                              </div>
                              <div>{order.pickupAddress.country}</div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div>{order.deliveryAddress.street}</div>
                              <div>
                                {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                              </div>
                              <div>{order.deliveryAddress.country}</div>
                            </div>
                          </td>
                          <td>{order.price.toFixed(2)} ريال سعودي</td>
                          <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div className="d-flex flex-column gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                              >
                                <TranslatedText text="dashboard.viewDetails" />
                              </button>
                              
                              {/* Driver-specific actions */}
                              {isDriver() && order.status === 'ACCEPTED' && (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => updateOrderStatus(order.id, 'PICKED_UP')}
                                  disabled={updatingOrderId === order.id}
                                >
                                  {updatingOrderId === order.id ? (
                                    <FaSpinner className="fa-spin me-1" />
                                  ) : (
                                    <FaBoxOpen className="me-1" />
                                  )}
                                  <TranslatedText text="orders.markAsPickedUp" />
                                </button>
                              )}
                              
                              {isDriver() && order.status === 'PICKED_UP' && (
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => updateOrderStatus(order.id, 'IN_TRANSIT')}
                                  disabled={updatingOrderId === order.id}
                                >
                                  {updatingOrderId === order.id ? (
                                    <FaSpinner className="fa-spin me-1" />
                                  ) : (
                                    <FaTruck className="me-1" />
                                  )}
                                  <TranslatedText text="orders.startTransit" />
                                </button>
                              )}
                              
                              {isDriver() && order.status === 'IN_TRANSIT' && (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                                  disabled={updatingOrderId === order.id}
                                >
                                  {updatingOrderId === order.id ? (
                                    <FaSpinner className="fa-spin me-1" />
                                  ) : (
                                    <FaCheck className="me-1" />
                                  )}
                                  <TranslatedText text="orders.markAsDelivered" />
                                </button>
                              )}
                              
                              {/* Cancel button - for both client and driver */}
                              {canCancelOrder(order) && (
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleCancelOrder(order.id)}
                                  disabled={updatingOrderId === order.id}
                                >
                                  {updatingOrderId === order.id ? (
                                    <FaSpinner className="fa-spin me-1" />
                                  ) : (
                                    <FaTrash className="me-1" />
                                  )}
                                  <TranslatedText text="orders.cancelOrder" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'ACCEPTED':
      return 'info';
    case 'PICKED_UP':
      return 'primary';
    case 'IN_TRANSIT':
      return 'success';
    case 'DELIVERED':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'secondary';
  }
} 