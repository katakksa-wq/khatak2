'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Order, orderService, OrderStatus } from '@/services/orderService';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { FaTruck, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const orderId = params?.id as string || '';
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setError(t('orders.missingOrderId'));
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching order details for ID: ${orderId}`);
      
      const response = await orderService.getOrder(orderId);
      console.log('Order details response:', response);
      
      if (response.status === 'success' && response.data) {
        setOrder(response.data);
      } else {
        throw new Error(response.message || t('orders.fetchDetailsFailed'));
      }
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      setError(err.message || t('orders.fetchDetailsFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async () => {
    if (!user || !order) return;
    
    try {
      setUpdating(true);
      const response = await orderService.acceptOrder(order.id);
      
      if (response.status === 'success') {
        toast.success(t('orders.acceptSuccess'));
        fetchOrderDetails();
      } else {
        throw new Error(response.message || t('orders.acceptFailed'));
      }
    } catch (err: any) {
      console.error('Error accepting order:', err);
      toast.error(err.message || t('orders.acceptFailed'));
    } finally {
      setUpdating(false);
    }
  };

  const handlePickupOrder = async () => {
    if (!order) return;
    
    try {
      setUpdating(true);
      const response = await orderService.updateOrderStatus(order.id, 'PICKED_UP');
      
      if (response.status === 'success') {
        toast.success(t('orders.pickedUpSuccess'));
        fetchOrderDetails();
      } else {
        throw new Error(response.message || t('orders.updateStatusFailed'));
      }
    } catch (err: any) {
      console.error('Error updating order status:', err);
      toast.error(err.message || t('orders.updateStatusFailed'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeliverOrder = async () => {
    if (!order) return;
    
    try {
      setUpdating(true);
      const response = await orderService.updateOrderStatus(order.id, 'DELIVERED');
      
      if (response.status === 'success') {
        toast.success(t('orders.deliveredSuccess'));
        fetchOrderDetails();
      } else {
        throw new Error(response.message || t('orders.updateStatusFailed'));
      }
    } catch (err: any) {
      console.error('Error updating order status:', err);
      toast.error(err.message || t('orders.updateStatusFailed'));
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    try {
      setUpdating(true);
      await orderService.updateOrderStatus(order.id, 'CANCELLED');
      
      toast.success(t('orders.cancelSuccess'));
      fetchOrderDetails();
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      toast.error(err.message || t('orders.cancelFailed'));
    } finally {
      setUpdating(false);
    }
  };
  
  const isDriver = user?.role === 'DRIVER';
  const isClient = user?.role === 'CLIENT';
  const canAccept = isDriver && order?.status === 'PENDING' && !order.driverId;
  const canPickup = isDriver && order?.status === 'ACCEPTED' && order.driverId === user.id;
  const canDeliver = isDriver && order?.status === 'PICKED_UP' && order.driverId === user.id;
  const canCancel = (isClient && order?.clientId === user.id && ['PENDING', 'ACCEPTED'].includes(order?.status || '')) || 
                   (isDriver && order?.driverId === user.id && ['ACCEPTED', 'PICKED_UP'].includes(order?.status || ''));

  const formatDateTime = (dateString: string) => {
    if (!dateString) return t('general.notApplicable');
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-warning';
      case 'ACCEPTED': return 'bg-info';
      case 'PICKED_UP': return 'bg-primary';
      case 'DELIVERED': return 'bg-success';
      case 'CANCELLED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('loading.message')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger my-5" role="alert">
        <h4 className="alert-heading">{t('orders.error')}</h4>
        <p>{error}</p>
        <button className="btn btn-outline-danger" onClick={fetchOrderDetails}>
          {t('orders.retry')}
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="alert alert-warning my-5" role="alert">
        <h4 className="alert-heading">{t('orders.notFound')}</h4>
        <p>{t('orders.noPermission')}</p>
        <button className="btn btn-primary" onClick={() => router.back()}>
          {t('button.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="container mb-5">
      <div className="card shadow">
        <div className="card-header bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="m-0 font-weight-bold">{t('orders.orderNumber')} #{order.trackingNumber}</h2>
            <span className={`badge ${getStatusBadgeClass(order.status)} fs-6`}>
              {order.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-6">
              <h5 className="border-bottom pb-2">{t('orders.orderInfo')}</h5>
              <div className="mb-3">
                <p className="mb-1"><strong>{t('orders.created')}:</strong> {formatDateTime(order.createdAt)}</p>
                <p className="mb-1"><strong>{t('orders.updated')}:</strong> {formatDateTime(order.updatedAt)}</p>
                <p className="mb-1"><strong>{t('orders.price')}:</strong> {order.price?.toFixed(2)} {t('general.currency')}</p>
                {order.estimatedDeliveryTime && (
                  <p className="mb-1"><strong>{t('orders.estimatedDelivery')}:</strong> {formatDateTime(order.estimatedDeliveryTime)}</p>
                )}
              </div>
            </div>
            
            <div className="col-md-6">
              <h5 className="border-bottom pb-2">{t('orders.packageDetails')}</h5>
              <div className="mb-3">
                <p className="mb-1"><strong>{t('orders.weight')}:</strong> {order.packageDetails?.weight} kg</p>
                <p className="mb-1"><strong>{t('orders.dimensions')}:</strong> {order.packageDetails?.dimensions}</p>
                <p className="mb-1"><strong>{t('orders.fragile')}:</strong> {order.packageDetails?.isFragile ? t('orders.yes') : t('orders.no')}</p>
                {order.packageDetails?.additionalDetails && order.packageDetails.additionalDetails.recipientMobileNumber && (
                  <p className="mb-1"><strong>{t('orders.recipientMobile')}:</strong> {order.packageDetails.additionalDetails.recipientMobileNumber}</p>
                )}
                {order.packageDetails?.description && (
                  <p className="mb-1"><strong>{t('orders.description')}:</strong> {order.packageDetails.description}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="row mb-4">
            <div className="col-md-6">
              <h5 className="border-bottom pb-2">{t('orders.pickupAddress')}</h5>
              <div className="mb-3">
                <p className="mb-1"><strong>{t('orders.street')}:</strong> {order.pickupAddress?.street}</p>
                <p className="mb-1"><strong>{t('orders.city')}:</strong> {order.pickupAddress?.city}</p>
                <p className="mb-1"><strong>{t('orders.state')}:</strong> {order.pickupAddress?.state}</p>
                <p className="mb-1"><strong>{t('orders.country')}:</strong> {order.pickupAddress?.country}</p>
              </div>
            </div>
            
            <div className="col-md-6">
              <h5 className="border-bottom pb-2">{t('orders.deliveryAddress')}</h5>
              <div className="mb-3">
                <p className="mb-1"><strong>{t('orders.street')}:</strong> {order.deliveryAddress?.street}</p>
                <p className="mb-1"><strong>{t('orders.city')}:</strong> {order.deliveryAddress?.city}</p>
                <p className="mb-1"><strong>{t('orders.state')}:</strong> {order.deliveryAddress?.state}</p>
                <p className="mb-1"><strong>{t('orders.country')}:</strong> {order.deliveryAddress?.country}</p>
              </div>
              
              {order.deliveryAddress?.latitude && order.deliveryAddress?.longitude && (
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => window.open(`https://maps.google.com/?q=${order.deliveryAddress?.latitude},${order.deliveryAddress?.longitude}`, '_blank')}
                >
                  <FaMapMarkerAlt className="me-1" /> {t('orders.viewOnMap')}
                </button>
              )}
            </div>
          </div>
          
          {/* People involved */}
          <div className="row mb-4">
            <div className="col-md-6">
              <h5 className="border-bottom pb-2">{t('orders.client')}</h5>
              <div className="mb-3">
                <p className="mb-1"><strong>{t('orders.name')}:</strong> {order.client?.name || t('general.notApplicable')}</p>
                <p className="mb-1"><strong>{t('orders.email')}:</strong> {order.client?.email || t('general.notApplicable')}</p>
                <p className="mb-1"><strong>{t('orders.phone')}:</strong> {order.client?.phone || t('general.notApplicable')}</p>
              </div>
            </div>
            
            <div className="col-md-6">
              <h5 className="border-bottom pb-2">{t('orders.driver')}</h5>
              {order.driver ? (
                <div className="mb-3">
                  <p className="mb-1"><strong>{t('orders.name')}:</strong> {order.driver?.name || t('general.notApplicable')}</p>
                  <p className="mb-1"><strong>{t('orders.email')}:</strong> {order.driver?.email || t('general.notApplicable')}</p>
                  <p className="mb-1"><strong>{t('orders.phone')}:</strong> {order.driver?.phone || t('general.notApplicable')}</p>
                </div>
              ) : (
                <p className="text-muted">{t('orders.noDriverAssigned')}</p>
              )}
            </div>
          </div>
          
          {/* Action buttons based on roles and order status */}
          <div className="d-flex justify-content-end mt-4 gap-2">
            <button 
              className="btn btn-secondary" 
              onClick={() => router.back()}
            >
              {t('button.back')}
            </button>
            
            {canAccept && (
              <button
                className="btn btn-success"
                onClick={handleAcceptOrder}
                disabled={updating}
              >
                <FaTruck className="me-2" /> {t('orders.acceptOrder')}
              </button>
            )}
            
            {canPickup && (
              <button
                className="btn btn-primary"
                onClick={handlePickupOrder}
                disabled={updating}
              >
                <FaTruck className="me-2" /> {t('orders.markAsPickedUp')}
              </button>
            )}
            
            {canDeliver && (
              <button
                className="btn btn-success"
                onClick={handleDeliverOrder}
                disabled={updating}
              >
                <FaCheckCircle className="me-2" /> {t('orders.markAsDelivered')}
              </button>
            )}
            
            {canCancel && (
              <button
                className="btn btn-danger"
                onClick={handleCancelOrder}
                disabled={updating}
              >
                <FaTimesCircle className="me-2" /> {t('orders.cancelOrder')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 