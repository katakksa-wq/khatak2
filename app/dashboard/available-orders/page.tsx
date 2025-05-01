'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaTruck, FaMapMarkerAlt, FaBox, FaCheckCircle, FaExclamationTriangle, FaDollarSign } from 'react-icons/fa';
import { apiClient } from '@/utils/apiClient';
import { Order } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import TranslatedText from '@/components/TranslatedText';

// Extended order interface for available orders
interface AvailableOrder extends Order {
  estimatedDistance?: number;
  estimatedTime?: number;
}

export default function AvailableOrders() {
  const router = useRouter();
  const { user, isDriver } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [hasActiveOrder, setHasActiveOrder] = useState<boolean>(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [hasUnconfirmedPayments, setHasUnconfirmedPayments] = useState<boolean>(false);
  const [unconfirmedPaymentsCount, setUnconfirmedPaymentsCount] = useState<number>(0);
  
  useEffect(() => {
    // Redirect if not a driver
    if (user && !isDriver()) {
      router.push('/dashboard');
      return;
    }
    
    const checkActiveOrders = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/orders/driver/${user.id}/current`);
        
        if (response.status === 'success' && Array.isArray(response.data)) {
          const currentOrders = response.data;
          if (currentOrders.length > 0) {
            setHasActiveOrder(true);
            setActiveOrder(currentOrders[0]); // Store the active order
          } else {
            // Check for unconfirmed payments before fetching available orders
            checkUnconfirmedPayments();
          }
        } else {
          throw new Error('Failed to fetch current orders');
        }
      } catch (err) {
        console.error('Error checking active orders:', err);
        setError('Failed to check your current orders status');
        setLoading(false);
      }
    };
    
    const checkUnconfirmedPayments = async () => {
      try {
        // Fetch payments that are unconfirmed
        const response = await apiClient.get('/api/payments/driver-pending');
        
        if (response.status === 'success' && Array.isArray(response.data)) {
          const unconfirmedPayments = response.data.filter(payment => !payment.driverConfirmed);
          setUnconfirmedPaymentsCount(unconfirmedPayments.length);
          
          if (unconfirmedPayments.length >= 3) {
            setHasUnconfirmedPayments(true);
            setLoading(false);
          } else {
            // If less than 3 unconfirmed payments, fetch available orders
            fetchAvailableOrders();
          }
        } else {
          // If response isn't as expected, still try to fetch orders
          fetchAvailableOrders();
        }
      } catch (err) {
        console.error('Error checking unconfirmed payments:', err);
        // Even if this check fails, try to fetch orders
        fetchAvailableOrders();
      }
    };
    
    const fetchAvailableOrders = async () => {
      try {
        const response = await apiClient.get('/api/orders?status=PENDING');
        
        if (response.status === 'success') {
          // Handle different response structures
          if (Array.isArray(response.data)) {
            // Direct array response
            setOrders(response.data as AvailableOrder[]);
          } else if (response.data && typeof response.data === 'object' && 'orders' in response.data && Array.isArray(response.data.orders)) {
            // Nested orders in data.orders
            setOrders(response.data.orders as AvailableOrder[]);
          } else if (response.data && typeof response.data === 'object' && 'data' in response.data && 
                    typeof response.data.data === 'object' && response.data.data && 'orders' in response.data.data && 
                    Array.isArray(response.data.data.orders)) {
            // Double-nested in data.data.orders (for handling potential nested ApiResponse)
            setOrders(response.data.data.orders as AvailableOrder[]);
          } else {
            console.error('Unexpected response structure:', response);
            throw new Error('Failed to fetch available orders');
          }
          setError(null);
        } else {
          throw new Error('Failed to fetch available orders');
        }
      } catch (err) {
        console.error('Error fetching available orders:', err);
        setError('Failed to load available orders');
      } finally {
        setLoading(false);
      }
    };
    
    if (user && isDriver()) {
      checkActiveOrders();
    }
  }, [user, isDriver, router]);
  
  const handleAcceptOrder = async (orderId: string) => {
    setAcceptingOrderId(orderId);
    setError(null);
    
    try {
      console.log(`Driver ${user?.id} attempting to accept order ${orderId}`);
      
      // Use the dedicated acceptOrder endpoint with PATCH method
      const response = await apiClient.patch(`/api/orders/${orderId}/accept`, {});
      
      // Check if the request was successful
      if (response.status === 'success') {
        console.log('Order successfully accepted:', response.data);
        
        // Remove the order from available list
        setOrders(prev => prev.filter(order => order.id !== orderId));
        
        // Show success message
        alert(`Order #${orderId.substring(0, 8)} accepted successfully! You can now view it in your Current Orders.`);
        
        // Redirect to current orders page
        router.push('/dashboard/current-orders');
      } else {
        throw new Error(response.message || 'Failed to accept order - server returned an error');
      }
    } catch (err: any) {
      console.error('Error accepting order:', err);
      let errorMessage = 'Failed to accept order. Please try again.';
      
      // Check for specific error about unconfirmed payments
      if (err.response?.data?.message?.includes('unconfirmed payments')) {
        errorMessage = 'You have 3 or more unconfirmed payments. Please confirm your pending payments before accepting new orders.';
        setHasUnconfirmedPayments(true);
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      
      // Log additional details for debugging
      if (err.response) {
        console.error('Response details:', err.response);
      }
    } finally {
      setAcceptingOrderId(null);
    }
  };
  
  // Display unconfirmed payments warning if driver has 3+ unconfirmed payments
  if (hasUnconfirmedPayments) {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0"><TranslatedText text="orders.available" /></h1>
        </div>
        
        <div className="card border-0 shadow-sm">
          <div className="card-body py-5">
            <div className="text-center">
              <FaDollarSign size={48} className="text-warning mb-3" />
              <h4><TranslatedText text="payment.unconfirmedLimit" /></h4>
              <p className="text-muted">
                {t('payment.unconfirmedDescription').replace('{0}', unconfirmedPaymentsCount.toString())}
              </p>
              <button 
                className="btn btn-primary mt-3"
                onClick={() => router.push('/dashboard/payment-confirmation')}
              >
                <TranslatedText text="payment.viewPending" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Display active order alert with option to go to current orders
  if (hasActiveOrder) {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0"><TranslatedText text="orders.available" /></h1>
        </div>
        
        <div className="card border-0 shadow-sm">
          <div className="card-body py-5">
            <div className="text-center">
              <FaExclamationTriangle size={48} className="text-warning mb-3" />
              <h4><TranslatedText text="orders.haveActiveOrder" /></h4>
              <p className="text-muted">
                <TranslatedText text="orders.oneOrderAtTime" />
              </p>
              
              {activeOrder && (
                <div className="card mt-4 mb-4 mx-auto" style={{ maxWidth: '500px' }}>
                  <div className="card-header bg-light">
                    <h5 className="mb-0"><TranslatedText text="orders.orderNumber" translation={false}>Order #{activeOrder.trackingNumber || activeOrder.id?.substring(0, 8)}</TranslatedText></h5>
                  </div>
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <div className="badge bg-primary me-2">{activeOrder.status}</div>
                      <div className="text-muted">
                        <p className="text-lg font-semibold mb-1">
                          {typeof activeOrder.price === 'number' ? activeOrder.price.toFixed(2) : '0.00'} ريال سعودي
                        </p>
                      </div>
                    </div>
                    
                    <div className="d-flex mb-2">
                      <div className="flex-shrink-0 me-2">
                        <FaMapMarkerAlt className="text-danger" />
                      </div>
                      <div>
                        <p className="mb-0 small"><TranslatedText text="orders.pickup" />: {activeOrder.pickupAddress?.street}, {activeOrder.pickupAddress?.city}</p>
                      </div>
                    </div>
                    
                    <div className="d-flex mb-2">
                      <div className="flex-shrink-0 me-2">
                        <FaMapMarkerAlt className="text-success" />
                      </div>
                      <div>
                        <p className="mb-0 small"><TranslatedText text="orders.delivery" />: {activeOrder.deliveryAddress?.street}, {activeOrder.deliveryAddress?.city}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <button 
                className="btn btn-primary mt-3"
                onClick={() => router.push('/dashboard/current-orders')}
              >
                <TranslatedText text="orders.viewCurrentOrders" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0"><TranslatedText text="orders.available" /></h1>
      </div>
      
      <div className="alert alert-info mb-4" role="alert">
        <div className="d-flex align-items-center">
          <FaTruck className="me-2" />
          <div>
            <p className="mb-0"><strong><TranslatedText text="orders.lookingToAccept" /></strong></p>
            <p className="mb-0 small"><TranslatedText text="orders.pendingDescription" /></p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden"><TranslatedText text="loading.message" /></span>
          </div>
          <p className="mt-3 text-muted"><TranslatedText text="orders.loadingAvailable" /></p>
        </div>
      ) : orders.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body py-5 text-center">
            <FaTruck size={48} className="text-muted mb-3" />
            <h5><TranslatedText text="orders.noAvailable" /></h5>
            <p className="text-muted"><TranslatedText text="orders.checkBackLater" /></p>
          </div>
        </div>
      ) : (
        <div className="row">
          {orders.map(order => (
            <div className="col-lg-4 col-md-6 mb-4" key={order.id}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">
                    <TranslatedText text="orders.orderNumber" translation={false}>Order #{order.trackingNumber || order.id?.substring(0, 8)}</TranslatedText>
                  </h5>
                  <span className="badge bg-primary">
                    <p className="text-success fw-bold mb-0">
                      {typeof order.price === 'number' ? order.price.toFixed(2) : '0.00'} ريال سعودي
                    </p>
                  </span>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <div className="d-flex mb-2">
                      <div className="flex-shrink-0 me-2">
                        <FaMapMarkerAlt className="text-danger" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted small"><TranslatedText text="orders.pickup" /></p>
                        <p className="mb-0">{order.pickupAddress?.street}</p>
                        <p className="mb-0">
                          {order.pickupAddress?.city}, {order.pickupAddress?.state} {order.pickupAddress?.zipCode}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex mb-2">
                      <div className="flex-shrink-0 me-2">
                        <FaMapMarkerAlt className="text-success" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted small"><TranslatedText text="orders.delivery" /></p>
                        <p className="mb-0">{order.deliveryAddress?.street}</p>
                        <p className="mb-0">
                          {order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.zipCode}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex mb-2">
                      <div className="flex-shrink-0 me-2">
                        <FaBox className="text-primary" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted small"><TranslatedText text="orders.package" /></p>
                        <p className="mb-0">
                          {order.packageDetails?.weight} <TranslatedText text="orders.weightUnit" />
                          {order.packageDetails?.description ? `, ${order.packageDetails.description}` : ''}
                        </p>
                        {order.packageDetails?.fragile && (
                          <p className="mb-0 small text-danger"><TranslatedText text="orders.fragileWarning" /></p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {(order.estimatedDistance || order.estimatedTime) && (
                    <div className="row text-center text-muted small mb-3">
                      {order.estimatedDistance !== undefined && (
                        <div className="col-6">
                          <div className="border-end">
                            <p className="mb-0 fw-bold">{order.estimatedDistance} <TranslatedText text="orders.distanceUnit" /></p>
                            <p className="mb-0"><TranslatedText text="orders.distance" /></p>
                          </div>
                        </div>
                      )}
                      {order.estimatedTime !== undefined && (
                        <div className="col-6">
                          <p className="mb-0 fw-bold">{order.estimatedTime} <TranslatedText text="orders.timeUnit" /></p>
                          <p className="mb-0"><TranslatedText text="orders.estimatedTime" /></p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="card-footer bg-white border-0">
                  <button 
                    className="btn btn-success w-100"
                    onClick={() => handleAcceptOrder(order.id!)}
                    disabled={acceptingOrderId === order.id || !order.id}
                  >
                    {acceptingOrderId === order.id ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : (
                      <FaCheckCircle className="me-2" />
                    )}
                    {acceptingOrderId === order.id ? 
                      <TranslatedText text="orders.acceptingOrder" /> : 
                      <TranslatedText text="orders.acceptOrder" />
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 