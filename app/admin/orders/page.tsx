'use client';

import { useState, useEffect } from 'react';
import { FaEye, FaSearch, FaFilter, FaSync } from 'react-icons/fa';
import { apiClient } from '@/utils/apiClient';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

interface Order {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'ACCEPTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  pickupAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  packageDetails: {
    weight: number;
    fragile: boolean;
    description: string;
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
    };
  };
  customer: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };
  driver?: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };
  items: {
    name: string;
    quantity: number;
    weight?: number;
  }[];
  specialInstructions?: string;
  totalAmount: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  results?: number;
  totalPages?: number;
  currentPage?: number;
}

// Define backend response types
interface BackendResponse {
  status: string;
  data: any;
  results?: number;
  totalPages?: number;
  currentPage?: number;
  message?: string;
}

export default function OrdersManagementPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isDataFetched, setIsDataFetched] = useState(false);

  const ordersPerPage = 10;

  // Clean up function for timeouts
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Effect for initial load and filter/page changes
  useEffect(() => {
    const loadData = async () => {
      await fetchOrders();
      setIsDataFetched(true);
    };
    
    loadData();
  }, [currentPage, filterStatus]);

  // Separate effect for search term changes with debounce
  useEffect(() => {
    if (!searchTerm) return;
    
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchOrders();
    }, 500);
    
    setSearchTimeout(timeout as unknown as NodeJS.Timeout);
    
    return () => {
      clearTimeout(timeout);
    };
  }, [searchTerm]);

  const fetchOrders = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      // Construct the query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', ordersPerPage.toString());
      
      if (filterStatus !== 'ALL') {
        params.append('status', filterStatus);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (forceRefresh) {
        params.append('refresh', 'true');
      }
      
      console.log(`Fetching orders with params: ${params.toString()}`);
      
      const response = await apiClient.get(`/api/admin/orders?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("API Response:", response.data);
      
      if (!response.data) {
        throw new Error('No data received from API');
      }
      
      const responseData = response.data;
      
      // Check if response is directly an array of orders
      if (Array.isArray(responseData)) {
        console.log(`Found ${responseData.length} orders in direct array response`);
        setOrders(responseData);
        setTotalPages(1); // Default without pagination info
        setCurrentPage(1);
        setLoading(false);
        return;
      }

      // Cast to BackendResponse for structured response
      const structuredResponse = responseData as BackendResponse;

      // Get raw data structure from backend response
      console.log("Response structure:", Object.keys(structuredResponse).join(', '));

      // Direct match with backend response structure
      // Backend route returns { status, results, totalPages, currentPage, data }
      if (structuredResponse.status === 'success' && structuredResponse.data) {
        console.log("Response matches expected backend format");
        
        let ordersData: Order[] = [];
        
        // Extract orders based on data format
        if (Array.isArray(structuredResponse.data)) {
          console.log(`Found ${structuredResponse.data.length} orders in data array`);
          ordersData = structuredResponse.data;
        } else {
          // Try to handle nested formats
          console.log("Data is not an array, trying to extract from object");
          ordersData = extractOrdersFromResponse(structuredResponse);
        }
        
        console.log(`Successfully extracted ${ordersData.length} orders with IDs:`, 
          ordersData.map(o => o.id).join(', '));
        
        // Update all states at once 
        setOrders(ordersData);
        setTotalPages(structuredResponse.totalPages || 1);
        setCurrentPage(structuredResponse.currentPage || 1);
      } else {
        console.warn("Response does not match expected format:", responseData);
        setOrders([]);
        setTotalPages(1);
        setCurrentPage(1);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to fetch orders');
      setLoading(false);
      setOrders([]);
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.replace('/login');
      }
    }
  };

  // Helper function to extract orders from various response formats
  const extractOrdersFromResponse = (responseData: any): Order[] => {
    console.log("Extracting orders from response data:", JSON.stringify(responseData));
    
    // Case 1: responseData.data is the array of orders directly
    if (Array.isArray(responseData.data)) {
      console.log("Found orders array directly in data property");
      return responseData.data;
    }
    
    // Case 2: responseData is the array of orders directly (no data property)
    if (Array.isArray(responseData)) {
      console.log("Response data itself is an array of orders");
      return responseData;
    }
    
    // Case 3: orders are inside responseData.data.orders
    if (responseData.data && typeof responseData.data === 'object') {
      console.log("Response data has nested data object");
      
      if (Array.isArray(responseData.data.orders)) {
        console.log("Found orders array in data.orders property");
        return responseData.data.orders;
      }
      
      // Case 4: data property itself is the object we want to return
      // This handles case where data might contain the orders without being in an orders array
      console.log("Using data property as orders");
      return responseData.data;
    }
    
    // Case 5: orders are directly in the responseData (no data property)
    if (responseData && typeof responseData === 'object' && !responseData.data) {
      console.log("Response object itself contains orders");
      if (responseData.orders && Array.isArray(responseData.orders)) {
        return responseData.orders;
      }
    }
    
    // Default empty array for safety
    console.warn("Could not extract orders from response, returning empty array");
    return [];
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchOrders();
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleViewOrder = (order: Order) => {
    router.push(`/admin/orders/${order.id}`);
  };

  const handleOpenStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setShowStatusModal(true);
    setUpdateMessage('');
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }
      
      const response = await apiClient.patch(
        `/api/admin/orders/${selectedOrder.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrder.id ? { ...order, status: newStatus as any } : order
        )
      );
      
      setUpdateMessage(`Order status updated to ${newStatus} successfully`);
      
      // If status is filtered, and the new status doesn't match the filter, remove the order from the list
      if (filterStatus !== 'ALL' && filterStatus !== newStatus) {
        setTimeout(() => {
          setShowStatusModal(false);
          fetchOrders();
        }, 1500);
      } else {
        setTimeout(() => {
          setShowStatusModal(false);
        }, 1500);
      }
      
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setUpdateMessage(err.response?.data?.message || 'Failed to update order status');
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.replace('/login');
      }
    }
  };

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'ACCEPTED': return 'info';
      case 'PICKED_UP': return 'primary';
      case 'IN_TRANSIT': return 'primary';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'danger';
      default: return 'secondary';
    }
  };

  const formatAddress = (address: any): string => {
    if (!address) return 'N/A';
    
    // Handle address as object
    if (typeof address === 'object') {
      const addressParts = [
        address.street,
        address.city,
        address.state,
        address.zipCode,
        address.country
      ].filter(Boolean).join(', ');
      
      // Limit address length for display in table
      return addressParts.length > 25 ? addressParts.slice(0, 25) + '...' : addressParts;
    }
    
    // Handle address as string (fallback)
    return typeof address === 'string' && address.length > 25 
      ? address.slice(0, 25) + '...' 
      : String(address);
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  // Add a helper function to safely get address title
  const getAddressTitle = (address: any): string => {
    if (!address) return 'N/A';
    
    if (typeof address === 'object') {
      return [
        address.street,
        address.city,
        address.state,
        address.zipCode,
        address.country
      ].filter(Boolean).join(', ');
    }
    
    return String(address);
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">{t('admin.orderManagement')}</h1>
      </div>

      {/* Search and Filter */}
      <div className="row mb-4">
        <div className="col-md-5">
          <form onSubmit={handleSearch} className="d-flex">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder={t('admin.searchOrders')}
                value={searchTerm}
                onChange={handleSearchInput}
              />
              <button type="submit" className="btn btn-primary">
                <FaSearch /> {t('admin.search')}
              </button>
            </div>
          </form>
        </div>
        <div className="col-md-4">
          <div className="input-group">
            <span className="input-group-text bg-light">
              <FaFilter />
            </span>
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">{t('admin.allStatuses')}</option>
              <option value="PENDING">{t('dashboard.orderStatus.PENDING')}</option>
              <option value="ACCEPTED">{t('dashboard.orderStatus.ACCEPTED')}</option>
              <option value="PICKED_UP">{t('dashboard.orderStatus.PICKED_UP')}</option>
              <option value="IN_TRANSIT">{t('dashboard.orderStatus.IN_TRANSIT')}</option>
              <option value="DELIVERED">{t('dashboard.orderStatus.DELIVERED')}</option>
              <option value="CANCELLED">{t('dashboard.orderStatus.CANCELLED')}</option>
            </select>
          </div>
        </div>
        <div className="col-md-3">
          <button
            className="btn btn-outline-primary w-100"
            onClick={() => fetchOrders(true)}
            disabled={loading}
          >
            <FaSync className={loading ? 'spin' : ''} /> {loading ? t('button.loading') : t('admin.refresh')}
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {loading && !isDataFetched ? (
            <div className="d-flex justify-content-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">{t('pagination.noOrders')}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>{t('admin.orderNumber')}</th>
                    <th>{t('admin.customer')}</th>
                    <th>{t('admin.status')}</th>
                    <th>{t('admin.pickupAddress')}</th>
                    <th>{t('admin.deliveryAddress')}</th>
                    <th>{t('admin.created')}</th>
                    <th>{t('admin.amount')}</th>
                    <th>{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders?.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <span className="fw-medium">{order.orderNumber}</span>
                      </td>
                      <td>{order.customer?.name || 'N/A'}</td>
                      <td>
                        <span 
                          className={`badge bg-${getStatusBadgeColor(order.status)}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleOpenStatusModal(order)}
                        >
                          {t(`dashboard.orderStatus.${order.status}`)}
                        </span>
                      </td>
                      <td title={getAddressTitle(order.pickupAddress)}>{formatAddress(order.pickupAddress)}</td>
                      <td title={getAddressTitle(order.deliveryAddress)}>{formatAddress(order.deliveryAddress)}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : undefined)}</td>
                      <td>{formatCurrency(order.totalAmount)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewOrder(order)}
                        >
                          <FaEye /> {t('admin.details')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="card-footer bg-white">
            <nav>
              <ul className="pagination justify-content-center mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    {t('pagination.previous')}
                  </button>
                </li>
                
                {totalPages > 0 && Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                  // Show current page and 2 pages before and after
                  let pageToShow;
                  if (totalPages <= 5) {
                    pageToShow = index + 1;
                  } else if (currentPage <= 3) {
                    pageToShow = index + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageToShow = totalPages - 4 + index;
                  } else {
                    pageToShow = currentPage - 2 + index;
                  }
                  
                  return (
                    <li 
                      key={pageToShow} 
                      className={`page-item ${currentPage === pageToShow ? 'active' : ''}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(pageToShow)}
                      >
                        {pageToShow}
                      </button>
                    </li>
                  );
                })}
                
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    {t('pagination.next')}
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Order Details: {selectedOrder.orderNumber}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowOrderModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <div className="card h-100">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">Order Information</h6>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <p className="mb-1 text-muted small">Order ID:</p>
                          <p className="mb-0 fw-medium">{selectedOrder.id}</p>
                        </div>
                        <div className="mb-3">
                          <p className="mb-1 text-muted small">Order Number:</p>
                          <p className="mb-0 fw-medium">{selectedOrder.orderNumber}</p>
                        </div>
                        <div className="mb-3">
                          <p className="mb-1 text-muted small">Status:</p>
                          <p className="mb-0">
                            <span className={`badge bg-${getStatusBadgeColor(selectedOrder.status)}`}>
                              {selectedOrder.status.replace(/_/g, ' ')}
                            </span>
                            <button 
                              className="btn btn-sm btn-link text-decoration-none"
                              onClick={() => {
                                setShowOrderModal(false);
                                handleOpenStatusModal(selectedOrder);
                              }}
                            >
                              Change
                            </button>
                          </p>
                        </div>
                        <div className="mb-3">
                          <p className="mb-1 text-muted small">Created:</p>
                          <p className="mb-0">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="mb-0">
                          <p className="mb-1 text-muted small">Last Updated:</p>
                          <p className="mb-0">{new Date(selectedOrder.updatedAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="card h-100">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">Customer Information</h6>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <p className="mb-1 text-muted small">Name:</p>
                          <p className="mb-0 fw-medium">{selectedOrder.customer.name}</p>
                        </div>
                        <div className="mb-3">
                          <p className="mb-1 text-muted small">Email:</p>
                          <p className="mb-0">{selectedOrder.customer.email}</p>
                        </div>
                        <div className="mb-3">
                          <p className="mb-1 text-muted small">Phone:</p>
                          <p className="mb-0">{selectedOrder.customer.phoneNumber || 'N/A'}</p>
                        </div>
                        
                        {selectedOrder.driver && (
                          <div className="mt-4">
                            <h6 className="mb-3 border-bottom pb-2">Driver Information</h6>
                            <div className="mb-2">
                              <p className="mb-1 text-muted small">Name:</p>
                              <p className="mb-0 fw-medium">{selectedOrder.driver.name}</p>
                            </div>
                            <div className="mb-0">
                              <p className="mb-1 text-muted small">Contact:</p>
                              <p className="mb-0">{selectedOrder.driver.phoneNumber || selectedOrder.driver.email}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="card h-100">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">Delivery Information</h6>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <p className="mb-1 text-muted small">Pickup Address:</p>
                          <p className="mb-0">{selectedOrder.pickupAddress.street}, {selectedOrder.pickupAddress.city}, {selectedOrder.pickupAddress.state}, {selectedOrder.pickupAddress.zipCode}, {selectedOrder.pickupAddress.country}</p>
                        </div>
                        <div className="mb-3">
                          <p className="mb-1 text-muted small">Delivery Address:</p>
                          <p className="mb-0">{selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state}, {selectedOrder.deliveryAddress.zipCode}, {selectedOrder.deliveryAddress.country}</p>
                        </div>
                        <div className="mb-0">
                          <p className="mb-1 text-muted small">Special Instructions:</p>
                          <p className="mb-0">{selectedOrder.specialInstructions || 'None'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="card h-100">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">Order Items</h6>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-sm table-borderless">
                            <thead>
                              <tr>
                                <th>Item</th>
                                <th>Quantity</th>
                                <th>Weight</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedOrder.items.map((item, index) => (
                                <tr key={index}>
                                  <td>{item.name}</td>
                                  <td>{item.quantity}</td>
                                  <td>{item.weight ? `${item.weight} kg` : 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="mt-3 text-end">
                          <h5 className="mb-0">Total: {formatCurrency(selectedOrder.totalAmount)}</h5>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowOrderModal(false);
                    handleOpenStatusModal(selectedOrder);
                  }}
                >
                  Update Status
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowOrderModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedOrder && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Order Status</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowStatusModal(false)}
                  disabled={!!updateMessage}
                ></button>
              </div>
              <div className="modal-body">
                {updateMessage ? (
                  <div className={`alert alert-${updateMessage.includes('successfully') ? 'success' : 'danger'}`}>
                    {updateMessage}
                  </div>
                ) : (
                  <>
                    <p>Update status for order: <strong>{selectedOrder.orderNumber}</strong></p>
                    
                    <div className="mb-3">
                      <label htmlFor="orderStatus" className="form-label">Status</label>
                      <select
                        id="orderStatus"
                        className="form-select"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="PICKED_UP">Picked Up</option>
                        <option value="IN_TRANSIT">In Transit</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                    
                    <div className="alert alert-info">
                      <small>
                        Changing order status may trigger notifications to customers and drivers.
                      </small>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                {updateMessage ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowStatusModal(false)}
                  >
                    Close
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowStatusModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={updateOrderStatus}
                      disabled={newStatus === selectedOrder.status}
                    >
                      Update Status
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 