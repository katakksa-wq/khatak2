'use client';

import { useState, useEffect } from 'react';
import { FaEye, FaCheck, FaTimes, FaIdCard, FaCar, FaPhoneAlt, FaEnvelope, FaSearch, FaRedo, FaIdBadge, FaFile, FaFileAlt } from 'react-icons/fa';
import { apiClient } from '@/utils/apiClient';
import { useRouter } from 'next/navigation';

interface DriverApplication {
  id: string;
  userId: string;
  name: string;
  email: string;
  phoneNumber: string;
  applicationDate: string;
  vehicleInfo: {
    make: string;
    model: string;
    year: string;
    licensePlate: string;
    color?: string;
  };
  licenseInfo: {
    licenseNumber: string;
    expiryDate: string;
  };
  documents?: {
    driversLicense?: string;
    vehicleRegistration?: string;
    insurance?: string;
    backgroundCheck?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface ApiResponse<T> {
  status: string;
  message?: string;
  results?: number;
  totalPages?: number;
  currentPage?: number;
  data: T;
}

interface DriversApiResponse {
  drivers: DriverApplication[];
}

export default function DriverApprovalsPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<DriverApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<DriverApplication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [confirmReason, setConfirmReason] = useState('');
  const [actionStatus, setActionStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  
  const driversPerPage = 10;

  useEffect(() => {
    fetchPendingDrivers();
  }, [currentPage, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchPendingDrivers();
  };

  const handleRefreshClick = () => {
    fetchPendingDrivers();
  };

  const fetchPendingDrivers = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        router.replace('/login');
        return;
      }

      console.log("Fetching driver applications");
      
      // Construct the query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', driversPerPage.toString());
      
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      console.log(`Fetching drivers with params: ${params.toString()}`);
      
      try {
        // Use the new dedicated API endpoint
        const response = await apiClient.get(`/api/admin/driver-approvals?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log("API Response:", response.data);
        
        if (!response.data) {
          throw new Error('No data received from API');
        }
        
        const responseData = response.data;
        
        // Check if response is directly an array of drivers
        if (Array.isArray(responseData)) {
          console.log(`Found ${responseData.length} drivers in direct array response`);
          setDrivers(responseData);
          setTotalPages(1);
          setCurrentPage(1);
          setLoading(false);
          return;
        }
        
        // Check if response has a direct drivers property at the root level
        if (responseData && typeof responseData === 'object' && 'drivers' in responseData && Array.isArray(responseData.drivers)) {
          console.log(`Found ${responseData.drivers.length} drivers in root drivers property`);
          setDrivers(responseData.drivers);
          setTotalPages((responseData as any).totalPages || 1);
          setCurrentPage((responseData as any).currentPage || 1);
          setLoading(false);
          return;
        }
        
        // Cast to structured response for typed access
        const structuredResponse = responseData as ApiResponse<DriversApiResponse | DriverApplication[]>;
        
        let driversData: DriverApplication[] = [];
        
        if (structuredResponse.status === 'success') {
          if (Array.isArray(structuredResponse.data)) {
            // Handle case where data is an array of drivers directly
            driversData = structuredResponse.data;
          } else if (structuredResponse.data && 'drivers' in structuredResponse.data) {
            // Handle case where data has a drivers property
            driversData = (structuredResponse.data as DriversApiResponse).drivers;
          }
          
          setTotalPages(structuredResponse.totalPages || 1);
          setCurrentPage(structuredResponse.currentPage || 1);
        } else {
          console.warn('Unexpected response structure:', structuredResponse);
          throw new Error('Unexpected API response structure');
        }
        
        console.log(`Successfully processed ${driversData.length} drivers from response`);
        setDrivers(driversData);
        setLoading(false);
      } catch (apiError: any) {
        console.error("API error:", apiError);
        setError('API error: ' + (apiError.message || 'Unknown error'));
        
        // If unauthorized, redirect to login
        if (apiError.response?.status === 401 || apiError.response?.status === 403) {
          router.replace('/login');
        }
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error in fetchPendingDrivers:', err);
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleViewDetails = (driver: DriverApplication) => {
    setSelectedDriver(driver);
    setShowDetailsModal(true);
  };

  const handleConfirmAction = (action: 'approve' | 'reject', driver: DriverApplication) => {
    setConfirmAction(action);
    setSelectedDriver(driver);
    setConfirmReason('');
    setActionStatus(null);
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
    if (!selectedDriver || !confirmAction) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      let endpoint = '';
      let payload = {};
      
      if (confirmAction === 'approve') {
        endpoint = `/api/admin/driver-approvals/${selectedDriver.id}/approve`;
      } else {
        endpoint = `/api/admin/driver-approvals/${selectedDriver.id}/reject`;
        payload = { reason: confirmReason };
      }

      console.log(`Executing ${confirmAction} action on driver ID: ${selectedDriver.id}`);
      
      const response = await apiClient.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log(`${confirmAction} response:`, response.data);
      
      // Handle different response formats
      const responseData = response.data;
      const message = typeof responseData === 'object' && responseData !== null ? 
        (responseData as any).message || `Driver ${confirmAction}d successfully` :
        `Driver ${confirmAction}d successfully`;
      
      // Update local state
      setDrivers(prevDrivers => 
        prevDrivers.filter(driver => driver.id !== selectedDriver.id)
      );

      setActionStatus({
        success: true,
        message: message
      });
      
      setLoading(false);
      // Refresh data after a short delay
      setTimeout(() => {
        fetchPendingDrivers();
        setShowConfirmModal(false);
      }, 2000);
      
    } catch (error: any) {
      console.error(`Error ${confirmAction}ing driver:`, error);
      setActionStatus({
        success: false,
        message: error.message || `Failed to ${confirmAction} driver`
      });
      setLoading(false);
    }
  };

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <nav aria-label="Page navigation" className="mt-4">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
          </li>
          
          {[...Array(totalPages)].map((_, i) => (
            <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            </li>
          ))}
          
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <form onSubmit={handleSearch}>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by name or email"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <button className="btn btn-primary" type="submit">
                        <FaSearch className="me-1" /> Search
                      </button>
                    </div>
                  </form>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1); // Reset to first page when filtering
                    }}
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div className="col-md-3 text-end">
                  <button
                    className="btn btn-outline-primary"
                    onClick={handleRefreshClick}
                    disabled={loading}
                  >
                    <FaRedo className="me-1" /> {loading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0">Driver Applications</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="d-flex justify-content-center my-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : drivers.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted mb-0">No driver applications found</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Vehicle</th>
                          <th>Application Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drivers.map(driver => (
                          <tr key={driver.id}>
                            <td>{driver.name}</td>
                            <td>{driver.email}</td>
                            <td>{driver.phoneNumber}</td>
                            <td>
                              {driver.vehicleInfo.make} {driver.vehicleInfo.model} ({driver.vehicleInfo.year})
                            </td>
                            <td>{new Date(driver.applicationDate).toLocaleDateString()}</td>
                            <td>
                              <span className={`badge ${
                                driver.status === 'APPROVED' ? 'bg-success' : 
                                driver.status === 'REJECTED' ? 'bg-danger' : 
                                'bg-warning'
                              }`}>
                                {driver.status}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group" role="group">
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleViewDetails(driver)}
                                >
                                  <FaEye /> View
                                </button>
                                {driver.status === 'PENDING' && (
                                  <>
                                    <button 
                                      type="button" 
                                      className="btn btn-sm btn-outline-success"
                                      onClick={() => handleConfirmAction('approve', driver)}
                                    >
                                      <FaCheck /> Approve
                                    </button>
                                    <button 
                                      type="button" 
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleConfirmAction('reject', driver)}
                                    >
                                      <FaTimes /> Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination()}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Driver Details Modal */}
      {showDetailsModal && selectedDriver && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Driver Application Details</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDetailsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h6 className="mb-3"><FaIdCard className="me-2" /> Personal Information</h6>
                    <p><strong>Name:</strong> {selectedDriver.name}</p>
                    <p><strong>Email:</strong> <span className="text-primary"><FaEnvelope className="me-1" /> {selectedDriver.email}</span></p>
                    <p><strong>Phone:</strong> <span className="text-primary"><FaPhoneAlt className="me-1" /> {selectedDriver.phoneNumber}</span></p>
                    <p><strong>Application Date:</strong> {new Date(selectedDriver.applicationDate).toLocaleDateString()}</p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span className={`badge ${
                        selectedDriver.status === 'APPROVED' ? 'bg-success' : 
                        selectedDriver.status === 'REJECTED' ? 'bg-danger' : 
                        'bg-warning'
                      }`}>
                        {selectedDriver.status}
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6 className="mb-3"><FaCar className="me-2" /> Vehicle Information</h6>
                    <div className="card">
                      <div className="card-body p-3">
                        <div className="row g-2">
                          <div className="col-6">
                            <p className="mb-1"><strong>Make:</strong></p>
                            <p className="mb-2">{selectedDriver.vehicleInfo.make}</p>
                          </div>
                          <div className="col-6">
                            <p className="mb-1"><strong>Model:</strong></p>
                            <p className="mb-2">{selectedDriver.vehicleInfo.model}</p>
                          </div>
                          <div className="col-6">
                            <p className="mb-1"><strong>Year:</strong></p>
                            <p className="mb-2">{selectedDriver.vehicleInfo.year}</p>
                          </div>
                          <div className="col-6">
                            <p className="mb-1"><strong>Color:</strong></p>
                            <p className="mb-2">{selectedDriver.vehicleInfo.color || 'N/A'}</p>
                          </div>
                          <div className="col-12">
                            <p className="mb-1"><strong>License Plate:</strong></p>
                            <p className="mb-0">{selectedDriver.vehicleInfo.licensePlate}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h6 className="mb-3"><FaIdBadge className="me-2" /> License Information</h6>
                    <div className="card">
                      <div className="card-body p-3">
                        <p><strong>License Number:</strong> {selectedDriver.licenseInfo.licenseNumber}</p>
                        <p className="mb-0"><strong>Expiry Date:</strong> {new Date(selectedDriver.licenseInfo.expiryDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Documents Section */}
                <div className="row">
                  <div className="col-12">
                    <h6 className="mb-3"><FaFile className="me-2" /> Documents</h6>
                    <div className="card">
                      <div className="card-body p-3">
                        <div className="row">
                          {selectedDriver.documents && selectedDriver.documents.driversLicense && (
                            <div className="col-md-6 mb-3">
                              <p><strong>Driver's License:</strong></p>
                              <div className="d-flex align-items-center gap-2">
                                <div className="position-relative" style={{ width: '100px', height: '100px' }}>
                                  <img 
                                    src={selectedDriver.documents.driversLicense} 
                                    alt="Driver's License" 
                                    className="img-thumbnail" 
                                    style={{ 
                                      width: '100%', 
                                      height: '100%', 
                                      objectFit: 'cover',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => selectedDriver.documents?.driversLicense && window.open(selectedDriver.documents.driversLicense, '_blank')}
                                    onError={(e) => {
                                      e.currentTarget.src = '/images/document-placeholder.png';
                                      e.currentTarget.onerror = null;
                                    }}
                                  />
                                  <div className="position-absolute top-0 end-0 p-1">
                                    <span className="badge bg-primary">Click to enlarge</span>
                                  </div>
                                </div>
                                <a 
                                  href={selectedDriver.documents.driversLicense} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  <FaFileAlt className="me-1" /> View Full Size
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {selectedDriver.documents && selectedDriver.documents.vehicleRegistration && (
                            <div className="col-md-6 mb-3">
                              <p><strong>Vehicle Registration:</strong></p>
                              <div className="d-flex align-items-center gap-2">
                                <div className="position-relative" style={{ width: '100px', height: '100px' }}>
                                  <img 
                                    src={selectedDriver.documents.vehicleRegistration} 
                                    alt="Vehicle Registration" 
                                    className="img-thumbnail" 
                                    style={{ 
                                      width: '100%', 
                                      height: '100%', 
                                      objectFit: 'cover',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => selectedDriver.documents?.vehicleRegistration && window.open(selectedDriver.documents.vehicleRegistration, '_blank')}
                                    onError={(e) => {
                                      e.currentTarget.src = '/images/document-placeholder.png';
                                      e.currentTarget.onerror = null;
                                    }}
                                  />
                                  <div className="position-absolute top-0 end-0 p-1">
                                    <span className="badge bg-primary">Click to enlarge</span>
                                  </div>
                                </div>
                                <a 
                                  href={selectedDriver.documents.vehicleRegistration} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  <FaFileAlt className="me-1" /> View Full Size
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {selectedDriver.documents && selectedDriver.documents.insurance && (
                            <div className="col-md-6 mb-3">
                              <p><strong>Insurance:</strong></p>
                              <div className="d-flex align-items-center gap-2">
                                <div className="position-relative" style={{ width: '100px', height: '100px' }}>
                                  <img 
                                    src={selectedDriver.documents.insurance} 
                                    alt="Insurance Document" 
                                    className="img-thumbnail" 
                                    style={{ 
                                      width: '100%', 
                                      height: '100%', 
                                      objectFit: 'cover',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => selectedDriver.documents?.insurance && window.open(selectedDriver.documents.insurance, '_blank')}
                                    onError={(e) => {
                                      e.currentTarget.src = '/images/document-placeholder.png';
                                      e.currentTarget.onerror = null;
                                    }}
                                  />
                                  <div className="position-absolute top-0 end-0 p-1">
                                    <span className="badge bg-primary">Click to enlarge</span>
                                  </div>
                                </div>
                                <a 
                                  href={selectedDriver.documents.insurance} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  <FaFileAlt className="me-1" /> View Full Size
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {selectedDriver.documents && selectedDriver.documents.backgroundCheck && (
                            <div className="col-md-6 mb-3">
                              <p><strong>Background Check:</strong></p>
                              <div className="d-flex align-items-center gap-2">
                                <div className="position-relative" style={{ width: '100px', height: '100px' }}>
                                  <img 
                                    src={selectedDriver.documents.backgroundCheck} 
                                    alt="Background Check" 
                                    className="img-thumbnail" 
                                    style={{ 
                                      width: '100%', 
                                      height: '100%', 
                                      objectFit: 'cover',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => selectedDriver.documents?.backgroundCheck && window.open(selectedDriver.documents.backgroundCheck, '_blank')}
                                    onError={(e) => {
                                      e.currentTarget.src = '/images/document-placeholder.png';
                                      e.currentTarget.onerror = null;
                                    }}
                                  />
                                  <div className="position-absolute top-0 end-0 p-1">
                                    <span className="badge bg-primary">Click to enlarge</span>
                                  </div>
                                </div>
                                <a 
                                  href={selectedDriver.documents.backgroundCheck} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  <FaFileAlt className="me-1" /> View Full Size
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {(!selectedDriver.documents || 
                            (!selectedDriver.documents.driversLicense && 
                             !selectedDriver.documents.vehicleRegistration && 
                             !selectedDriver.documents.insurance && 
                             !selectedDriver.documents.backgroundCheck)) && (
                            <div className="col-12">
                              <p className="text-center text-muted py-3">No documents available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
                {selectedDriver.status === 'PENDING' && (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-success"
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleConfirmAction('approve', selectedDriver);
                      }}
                    >
                      <FaCheck className="me-1" /> Approve
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger"
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleConfirmAction('reject', selectedDriver);
                      }}
                    >
                      <FaTimes className="me-1" /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {showConfirmModal && selectedDriver && confirmAction && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {confirmAction === 'approve' ? 'Approve Driver' : 'Reject Driver'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowConfirmModal(false)}
                  disabled={loading}
                ></button>
              </div>
              <div className="modal-body">
                {actionStatus ? (
                  <div className={`alert ${actionStatus.success ? 'alert-success' : 'alert-danger'}`}>
                    {actionStatus.message}
                  </div>
                ) : (
                  <>
                    <p>
                      Are you sure you want to {confirmAction === 'approve' ? 'approve' : 'reject'} the driver application for <strong>{selectedDriver.name}</strong>?
                    </p>
                    {confirmAction === 'reject' && (
                      <div className="mb-3">
                        <label htmlFor="rejectionReason" className="form-label">Reason for Rejection:</label>
                        <textarea
                          id="rejectionReason"
                          className="form-control"
                          rows={3}
                          value={confirmReason}
                          onChange={(e) => setConfirmReason(e.target.value)}
                          placeholder="Please provide a reason for rejection..."
                        ></textarea>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                {actionStatus ? (
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={() => setShowConfirmModal(false)}
                  >
                    Close
                  </button>
                ) : (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowConfirmModal(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className={`btn ${confirmAction === 'approve' ? 'btn-success' : 'btn-danger'}`}
                      onClick={executeAction}
                      disabled={loading || (confirmAction === 'reject' && !confirmReason.trim())}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          {confirmAction === 'approve' ? <FaCheck className="me-1" /> : <FaTimes className="me-1" />}
                          {confirmAction === 'approve' ? 'Approve' : 'Reject'}
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 