'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Order, orderService, OrderStatus } from '@/services/orderService';
import { useAuth } from '@/contexts/AuthContext';
import { FaTruck, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = params?.id as string || '';
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setError('Order ID is missing');
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
        throw new Error(response.message || 'Failed to fetch order details');
      }
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      setError(err.message || 'Failed to fetch order details');
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
        toast.success('Order accepted successfully');
        fetchOrderDetails();
      } else {
        throw new Error(response.message || 'Failed to accept order');
      }
    } catch (err: any) {
      console.error('Error accepting order:', err);
      toast.error(err.message || 'Failed to accept order');
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
        toast.success('Order marked as picked up');
        fetchOrderDetails();
      } else {
        throw new Error(response.message || 'Failed to update order status');
      }
    } catch (err: any) {
      console.error('Error updating order status:', err);
      toast.error(err.message || 'Failed to update order status');
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
        toast.success('Order marked as delivered');
        fetchOrderDetails();
      } else {
        throw new Error(response.message || 'Failed to update order status');
      }
    } catch (err: any) {
      console.error('Error updating order status:', err);
      toast.error(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    try {
      setUpdating(true);
      await orderService.updateOrderStatus(order.id, 'CANCELLED');
      
      toast.success('Order cancelled successfully');
      fetchOrderDetails();
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      toast.error(err.message || 'Failed to cancel order');
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
    if (!dateString) return 'N/A';
    
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
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger my-5" role="alert">
        <h4 className="alert-heading">Error!</h4>
        <p>{error}</p>
        <button className="btn btn-outline-danger" onClick={fetchOrderDetails}>
          Retry
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="alert alert-warning my-5" role="alert">
        <h4 className="alert-heading">Order Not Found</h4>
        <p>The requested order could not be found or you don't have permission to view it.</p>
        <button className="btn btn-primary" onClick={() => router.back()}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="container mb-5">
      <div className="card shadow">
        <div className="card-header bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="m-0 font-weight-bold">Order #{order.trackingNumber}</h2>
            <span className={`badge ${getStatusBadgeClass(order.status)} fs-6`}>
              {order.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-6">
              <h5 className="border-bottom pb-2">Order Information</h5>
              <div className="mb-3">
                <p className="mb-1"><strong>Created:</strong> {formatDateTime(order.createdAt)}</p>
                <p className="mb-1"><strong>Updated:</strong> {formatDateTime(order.updatedAt)}</p>
                <p className="mb-1"><strong>Price:</strong> ${order.price?.toFixed(2)}</p>
                {order.estimatedDeliveryTime && (
                  <p className="mb-1"><strong>Estimated Delivery:</strong> {formatDateTime(order.estimatedDeliveryTime)}</p>
                )}
              </div>
            </div>
            
            <div className="col-md-6">
              <h5 className="border-bottom pb-2">Package Details</h5>
              <div className="mb-3">
                <p className="mb-1"><strong>Weight:</strong> {order.packageDetails?.weight} kg</p>
                <p className="mb-1"><strong>Dimensions:</strong> {order.packageDetails?.dimensions}</p>
                <p className="mb-1"><strong>Fragile:</strong> {order.packageDetails?.isFragile ? 'Yes' : 'No'}</p>
                {order.packageDetails?.additionalDetails && order.packageDetails.additionalDetails.recipientMobileNumber && (
                  <p className="mb-1"><strong>Recipient Mobile:</strong> {order.packageDetails.additionalDetails.recipientMobileNumber}</p>
                )}
                {order.packageDetails?.description && (
                  <p className="mb-1"><strong>Description:</strong> {order.packageDetails.description}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="row mb-4">
            <div className="col-md-6">
              <h5 className="border-bottom pb-2">Pickup Address</h5>
              <div className="mb-3">
                <p className="mb-1"><strong>Street:</strong> {order.pickupAddress?.street}</p>
                <p className="mb-1"><strong>City:</strong> {order.pickupAddress?.city}</p>
                <p className="mb-1"><strong>State:</strong> {order.pickupAddress?.state}</p>
                <p className="mb-1"><strong>Country:</strong> {order.pickupAddress?.country}</p>
              </div>
            </div>
            
            <div className="col-md-6">
              <h5 className="border-bottom pb-2">Delivery Address</h5>
              <div className="mb-3">
                <p className="mb-1"><strong>Street:</strong> {order.deliveryAddress?.street}</p>
                <p className="mb-1"><strong>City:</strong> {order.deliveryAddress?.city}</p>
                <p className="mb-1"><strong>State:</strong> {order.deliveryAddress?.state}</p>
                <p className="mb-1"><strong>Country:</strong> {order.deliveryAddress?.country}</p>
              </div>
              
              {order.deliveryAddress?.latitude && order.deliveryAddress?.longitude && (
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => window.open(`https://maps.google.com/?q=${order.deliveryAddress?.latitude},${order.deliveryAddress?.longitude}`, '_blank')}
                >
                  <FaMapMarkerAlt className="me-1" /> View on Map
                </button>
              )}
            </div>
          </div>
          
          {/* People involved */}
          <div className="row mb-4">
            <div className="col-md-6">
              <h5 className="border-bottom pb-2">Client</h5>
              <div className="mb-3">
                <p className="mb-1"><strong>Name:</strong> {order.client?.name || 'N/A'}</p>
                <p className="mb-1"><strong>Email:</strong> {order.client?.email || 'N/A'}</p>
                <p className="mb-1"><strong>Phone:</strong> {order.client?.phone || 'N/A'}</p>
              </div>
            </div>
            
            <div className="col-md-6">
              <h5 className="border-bottom pb-2">Driver</h5>
              {order.driver ? (
                <div className="mb-3">
                  <p className="mb-1"><strong>Name:</strong> {order.driver?.name || 'N/A'}</p>
                  <p className="mb-1"><strong>Email:</strong> {order.driver?.email || 'N/A'}</p>
                  <p className="mb-1"><strong>Phone:</strong> {order.driver?.phone || 'N/A'}</p>
                </div>
              ) : (
                <p className="text-muted">No driver assigned yet</p>
              )}
            </div>
          </div>
          
          {/* Action buttons based on roles and order status */}
          <div className="d-flex justify-content-end mt-4 gap-2">
            <button 
              className="btn btn-secondary" 
              onClick={() => router.back()}
            >
              Back
            </button>
            
            {canAccept && (
              <button
                className="btn btn-success"
                onClick={handleAcceptOrder}
                disabled={updating}
              >
                <FaTruck className="me-2" /> Accept Order
              </button>
            )}
            
            {canPickup && (
              <button
                className="btn btn-primary"
                onClick={handlePickupOrder}
                disabled={updating}
              >
                <FaTruck className="me-2" /> Mark as Picked Up
              </button>
            )}
            
            {canDeliver && (
              <button
                className="btn btn-success"
                onClick={handleDeliverOrder}
                disabled={updating}
              >
                <FaCheckCircle className="me-2" /> Mark as Delivered
              </button>
            )}
            
            {canCancel && (
              <button
                className="btn btn-danger"
                onClick={handleCancelOrder}
                disabled={updating}
              >
                <FaTimesCircle className="me-2" /> Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 