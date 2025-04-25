'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Order, orderService } from '@/services/orderService';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FaMapMarkerAlt, 
  FaEdit, 
  FaTruck, 
  FaUserTie,
  FaHistory
} from 'react-icons/fa';
import { toast } from 'react-toastify';

// Interface for drivers
interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = params?.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  
  // Additional states for admin functionality
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/admin/dashboard');
      return;
    }
    
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, user, router]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get(`/api/admin/orders/${orderId}`);
      setOrder(response.data);
      
      // Set initial status for the dropdown
      if (response.data && response.data.status) {
        setNewStatus(response.data.status);
      }
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      setError(err.response?.data?.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const response = await apiClient.get('/api/admin/users?role=DRIVER&isApproved=true');
      
      if (Array.isArray(response.data)) {
        setAvailableDrivers(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setAvailableDrivers(response.data.data);
      } else {
        console.error('Unexpected response format:', response.data);
        toast.error('Failed to load drivers: Unexpected response format');
      }
    } catch (err: any) {
      console.error('Error fetching drivers:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch available drivers');
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleOpenAssignModal = () => {
    fetchAvailableDrivers();
    setShowAssignDriverModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || !order || newStatus === order.status) return;
    
    try {
      setUpdating(true);
      const response = await apiClient.patch(`/api/orders/${orderId}/status`, {
        status: newStatus
      });
      
      if (response.data?.status === 'success') {
        toast.success('Order status updated successfully');
        fetchOrderDetails();
        setShowChangeStatusModal(false);
      } else {
        throw new Error(response.data?.message || 'Failed to update order status');
      }
    } catch (err: any) {
      console.error('Error updating order status:', err);
      toast.error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriver || !order) return;
    
    try {
      setUpdating(true);
      const response = await apiClient.patch(`/api/orders/${orderId}/status`, {
        status: 'ACCEPTED',
        driverId: selectedDriver
      });
      
      if (response.data?.status === 'success') {
        toast.success('Driver assigned successfully');
        fetchOrderDetails();
        setShowAssignDriverModal(false);
      } else {
        throw new Error(response.data?.message || 'Failed to assign driver');
      }
    } catch (err: any) {
      console.error('Error assigning driver:', err);
      toast.error(err.response?.data?.message || 'Failed to assign driver');
    } finally {
      setUpdating(false);
    }
  };

  const formatDateTime = (dateString: string) => {
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
        <p>The requested order could not be found.</p>
        <button className="btn btn-primary" onClick={() => router.push('/admin/orders')}>
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="container-fluid mb-5">
        <div className="card shadow">
          <div className="card-header bg-white py-3">
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="m-0 font-weight-bold">Order #{order.trackingNumber}</h2>
              <div className="d-flex align-items-center">
                <span className={`badge ${getStatusBadgeClass(order.status)} fs-6 me-3`}>
                  {order.status.replace('_', ' ')}
                </span>
                <div className="btn-group">
                  <button 
                    className="btn btn-sm btn-outline-primary" 
                    onClick={() => setShowChangeStatusModal(true)}
                  >
                    <FaEdit className="me-1" /> Change Status
                  </button>
                  {!order.driverId && (
                    <button 
                      className="btn btn-sm btn-outline-success ms-2" 
                      onClick={handleOpenAssignModal}
                    >
                      <FaUserTie className="me-1" /> Assign Driver
                    </button>
                  )}
                </div>
              </div>
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
                
                {order.pickupAddress?.latitude && order.pickupAddress?.longitude && (
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => window.open(`https://maps.google.com/?q=${order.pickupAddress?.latitude},${order.pickupAddress?.longitude}`, '_blank')}
                  >
                    <FaMapMarkerAlt className="me-1" /> View on Map
                  </button>
                )}
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
                {order.client?.id && (
                  <a 
                    href={`/admin/users?search=${order.client.email}`}
                    className="btn btn-sm btn-outline-secondary"
                  >
                    View Client Details
                  </a>
                )}
              </div>
              
              <div className="col-md-6">
                <h5 className="border-bottom pb-2">Driver</h5>
                {order.driver ? (
                  <>
                    <div className="mb-3">
                      <p className="mb-1"><strong>Name:</strong> {order.driver?.name || 'N/A'}</p>
                      <p className="mb-1"><strong>Email:</strong> {order.driver?.email || 'N/A'}</p>
                      <p className="mb-1"><strong>Phone:</strong> {order.driver?.phone || 'N/A'}</p>
                    </div>
                    {order.driver?.id && (
                      <a 
                        href={`/admin/users?search=${order.driver.email}`}
                        className="btn btn-sm btn-outline-secondary"
                      >
                        View Driver Details
                      </a>
                    )}
                  </>
                ) : (
                  <div className="d-flex justify-content-between align-items-center">
                    <p className="text-muted mb-0">No driver assigned yet</p>
                    <button 
                      className="btn btn-sm btn-outline-success" 
                      onClick={handleOpenAssignModal}
                    >
                      <FaUserTie className="me-1" /> Assign Driver
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Order History Timeline (placeholder for future implementation) */}
            <div className="row mb-4">
              <div className="col-12">
                <h5 className="border-bottom pb-2">
                  <FaHistory className="me-2" /> Order Status History
                </h5>
                <ul className="list-group">
                  <li className="list-group-item border-0 d-flex align-items-center">
                    <div className="me-3">
                      <span className="badge rounded-pill bg-success">✓</span>
                    </div>
                    <div>
                      <strong>Order Created</strong>
                      <p className="mb-0 text-muted small">{formatDateTime(order.createdAt)}</p>
                    </div>
                  </li>
                  
                  {order.status !== 'PENDING' && order.status !== 'CANCELLED' && (
                    <li className="list-group-item border-0 d-flex align-items-center">
                      <div className="me-3">
                        <span className="badge rounded-pill bg-success">✓</span>
                      </div>
                      <div>
                        <strong>Driver Assigned</strong>
                        <p className="mb-0 text-muted small">
                          {order.driver?.name} accepted this order
                        </p>
                      </div>
                    </li>
                  )}
                  
                  {(order.status === 'PICKED_UP' || order.status === 'DELIVERED') && (
                    <li className="list-group-item border-0 d-flex align-items-center">
                      <div className="me-3">
                        <span className="badge rounded-pill bg-success">✓</span>
                      </div>
                      <div>
                        <strong>Package Picked Up</strong>
                        <p className="mb-0 text-muted small">
                          Driver picked up the package
                        </p>
                      </div>
                    </li>
                  )}
                  
                  {order.status === 'DELIVERED' && (
                    <li className="list-group-item border-0 d-flex align-items-center">
                      <div className="me-3">
                        <span className="badge rounded-pill bg-success">✓</span>
                      </div>
                      <div>
                        <strong>Package Delivered</strong>
                        <p className="mb-0 text-muted small">
                          Package was successfully delivered
                        </p>
                      </div>
                    </li>
                  )}
                  
                  {order.status === 'CANCELLED' && (
                    <li className="list-group-item border-0 d-flex align-items-center">
                      <div className="me-3">
                        <span className="badge rounded-pill bg-danger">✕</span>
                      </div>
                      <div>
                        <strong>Order Cancelled</strong>
                        <p className="mb-0 text-muted small">
                          The order was cancelled
                        </p>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            </div>
            
            {/* Admin action buttons */}
            <div className="d-flex justify-content-end mt-4 gap-2">
              <button 
                className="btn btn-secondary" 
                onClick={() => router.push('/admin/orders')}
              >
                Back to Orders
              </button>
              
              <button 
                className="btn btn-primary" 
                onClick={() => setShowChangeStatusModal(true)}
              >
                <FaEdit className="me-2" /> Change Status
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Driver Modal */}
      {showAssignDriverModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Assign Driver to Order #{order.trackingNumber}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAssignDriverModal(false)}
                  disabled={updating}
                ></button>
              </div>
              <div className="modal-body">
                {loadingDrivers ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading drivers...</span>
                    </div>
                    <p className="mt-2">Loading available drivers...</p>
                  </div>
                ) : availableDrivers.length === 0 ? (
                  <div className="alert alert-warning">
                    No available drivers found. Please approve drivers first.
                  </div>
                ) : (
                  <div className="mb-3">
                    <label htmlFor="driverSelect" className="form-label">Select Driver</label>
                    <select 
                      id="driverSelect"
                      className="form-select"
                      value={selectedDriver}
                      onChange={(e) => setSelectedDriver(e.target.value)}
                    >
                      <option value="">-- Select a Driver --</option>
                      {availableDrivers.map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} ({driver.email}) {driver.phone ? `- ${driver.phone}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAssignDriverModal(false)}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleAssignDriver}
                  disabled={updating || !selectedDriver || loadingDrivers}
                >
                  {updating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Assigning...
                    </>
                  ) : 'Assign Driver'}
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </div>
      )}

      {/* Change Status Modal */}
      {showChangeStatusModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Change Status for Order #{order.trackingNumber}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowChangeStatusModal(false)}
                  disabled={updating}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="statusSelect" className="form-label">Order Status</label>
                  <select 
                    id="statusSelect"
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="ACCEPTED">ACCEPTED</option>
                    <option value="PICKED_UP">PICKED UP</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
                <div className="alert alert-warning">
                  <strong>Note:</strong> Changing order status may trigger notifications to the client and driver.
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowChangeStatusModal(false)}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleStatusUpdate}
                  disabled={updating || newStatus === order.status}
                >
                  {updating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Updating...
                    </>
                  ) : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </div>
      )}
    </>
  );
} 