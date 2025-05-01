'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';
import { FaSpinner } from 'react-icons/fa';
import { apiClient } from '@/utils/apiClient';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import TranslatedText from '@/components/TranslatedText';

export default function OrdersHistoryPage() {
  const { user, isDriver, isClient } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const fetchOrderHistory = async (isRefresh = false) => {
    if (!user) return;
    
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      console.log('Fetching order history for:', user.role);
      
      let response;
      
      // Use different endpoints based on user role
      if (isDriver()) {
        // For drivers, fetch completed orders that were assigned to them
        // Query each status separately to avoid the enum array issue
        const deliveredResponse = await apiClient.get(`/api/orders?driverId=${user.id}&status=DELIVERED`);
        const cancelledResponse = await apiClient.get(`/api/orders?driverId=${user.id}&status=CANCELLED`);
        
        console.log('Driver delivered response:', deliveredResponse);
        console.log('Driver cancelled response:', cancelledResponse);
        
        // Combine the results
        if (deliveredResponse.status === 'success' && cancelledResponse.status === 'success') {
          // Extract orders from responses
          const deliveredOrders = extractOrdersFromResponse(deliveredResponse);
          const cancelledOrders = extractOrdersFromResponse(cancelledResponse);
          
          response = {
            status: 'success',
            data: [...deliveredOrders, ...cancelledOrders]
          };
        } else {
          // If either request failed, use the successful one or an empty array
          response = {
            status: 'success',
            data: deliveredResponse.status === 'success' 
              ? extractOrdersFromResponse(deliveredResponse)
              : cancelledResponse.status === 'success'
                ? extractOrdersFromResponse(cancelledResponse)
                : []
          };
        }
      } else if (isClient()) {
        // For clients, fetch their completed orders
        // Query each status separately to avoid the enum array issue
        const deliveredResponse = await apiClient.get(`/api/orders?clientId=${user.id}&status=DELIVERED`);
        const cancelledResponse = await apiClient.get(`/api/orders?clientId=${user.id}&status=CANCELLED`);
        
        console.log('Client delivered response:', deliveredResponse);
        console.log('Client cancelled response:', cancelledResponse);
        
        // Combine the results
        if (deliveredResponse.status === 'success' && cancelledResponse.status === 'success') {
          // Extract orders from responses
          const deliveredOrders = extractOrdersFromResponse(deliveredResponse);
          const cancelledOrders = extractOrdersFromResponse(cancelledResponse);
          
          response = {
            status: 'success',
            data: [...deliveredOrders, ...cancelledOrders]
          };
        } else {
          // If either request failed, use the successful one or an empty array
          response = {
            status: 'success',
            data: deliveredResponse.status === 'success' 
              ? extractOrdersFromResponse(deliveredResponse)
              : cancelledResponse.status === 'success'
                ? extractOrdersFromResponse(cancelledResponse)
                : []
          };
        }
      } else {
        // For admins, fetch all completed orders
        // Query each status separately to avoid the enum array issue
        const deliveredResponse = await apiClient.get('/api/orders?status=DELIVERED');
        const cancelledResponse = await apiClient.get('/api/orders?status=CANCELLED');
        
        console.log('Admin delivered response:', deliveredResponse);
        console.log('Admin cancelled response:', cancelledResponse);
        
        // Combine the results
        if (deliveredResponse.status === 'success' && cancelledResponse.status === 'success') {
          // Extract orders from responses
          const deliveredOrders = extractOrdersFromResponse(deliveredResponse);
          const cancelledOrders = extractOrdersFromResponse(cancelledResponse);
          
          response = {
            status: 'success',
            data: [...deliveredOrders, ...cancelledOrders]
          };
        } else {
          // If either request failed, use the successful one or an empty array
          response = {
            status: 'success',
            data: deliveredResponse.status === 'success' 
              ? extractOrdersFromResponse(deliveredResponse)
              : cancelledResponse.status === 'success'
                ? extractOrdersFromResponse(cancelledResponse)
                : []
          };
        }
      }

      console.log('Order history response:', response);
      
      if (response.status === 'success') {
        // Sort orders by date (latest first)
        const sortedOrders = response.data.sort((a, b) => {
          const dateA = a.actualDeliveryTime ? new Date(a.actualDeliveryTime) : new Date(a.updatedAt);
          const dateB = b.actualDeliveryTime ? new Date(b.actualDeliveryTime) : new Date(b.updatedAt);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Set the sorted orders to state
        setCompletedOrders(sortedOrders);
      } else {
        console.error('API response was not successful:', response);
        setCompletedOrders([]);
      }
    } catch (err) {
      console.error('Error fetching order history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      setCompletedOrders([]);
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

  // Initial fetch of orders
  useEffect(() => {
    fetchOrderHistory();
  }, [user]); // Depend on user to refetch when user changes

  // Handle manual refresh
  const handleRefresh = () => {
    fetchOrderHistory(true);
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
              <h2 className="card-title mb-0"><TranslatedText text="orders.history" /></h2>
              <button 
                className="btn btn-light btn-sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <FaSpinner className={`me-2 ${isRefreshing ? 'fa-spin' : ''}`} />
                {isRefreshing ? <TranslatedText text="orders.refreshing" /> : <TranslatedText text="admin.refresh" />}
              </button>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {completedOrders.length === 0 ? (
                <div className="text-center py-5">
                  <h3 className="text-muted"><TranslatedText text="orders.noCompletedOrders" /></h3>
                  <p className="text-muted"><TranslatedText text="orders.noOrdersInHistory" /></p>
                  {isClient() && (
                    <button 
                      className="btn btn-primary mt-3"
                      onClick={() => window.location.href = '/dashboard/new-order'}
                    >
                      <TranslatedText text="orders.new" />
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
                        <th><TranslatedText text="orders.completedDate" /></th>
                        <th><TranslatedText text="orders.actions" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedOrders.map((order) => (
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
                          <td>{
                            order.actualDeliveryTime 
                              ? new Date(order.actualDeliveryTime).toLocaleDateString() 
                              : new Date(order.updatedAt).toLocaleDateString()
                          }</td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                            >
                              <TranslatedText text="dashboard.viewDetails" />
                            </button>
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