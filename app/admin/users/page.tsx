'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaUserEdit, FaUserSlash, FaKey, FaCheckCircle, FaTimesCircle, FaFileAlt } from 'react-icons/fa';
import { apiClient } from '@/utils/apiClient';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/utils/dateUtils';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CLIENT' | 'DRIVER';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  totalOrders?: number;
  phoneNumber?: string;
  driver_profile?: DriverProfile;
}

interface DriverProfile {
  licenseNumber: string;
  licenseExpiry: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  vehicleRegistration?: string;
  licenseDocument?: string;
  registrationDocument?: string;
  insuranceDocument?: string;
  backgroundCheckDocument?: string;
  isApproved?: boolean;
  isRejected?: boolean;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  results?: number;
  totalPages?: number;
  currentPage?: number;
}

interface DriverProfileResponse {
  status: string;
  data: User;
}

interface UsersApiResponse {
  users: User[];
  totalPages: number;
  currentPage: number;
}

interface ResetPasswordResponse {
  message?: string;
  tempPassword?: string;
  data?: {
    message?: string;
    tempPassword?: string;
  };
}

export default function UsersManagementPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPasswordResult, setResetPasswordResult] = useState<{
    success: boolean;
    message: string;
    tempPassword?: string;
  } | null>(null);

  const usersPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter]);

  // Helper function to extract users from various response formats
  const extractUsersFromResponse = (responseData: any): User[] => {
    console.log("Extracting users from response data:", JSON.stringify(responseData));
    
    // Case 1: responseData.data is the array of users directly
    if (Array.isArray(responseData.data)) {
      console.log("Found users array directly in data property");
      return responseData.data;
    }
    
    // Case 2: responseData is the array of users directly (no data property)
    if (Array.isArray(responseData)) {
      console.log("Response data itself is an array of users");
      return responseData;
    }
    
    // Case 3: users are inside responseData.data.users
    if (responseData.data && typeof responseData.data === 'object') {
      console.log("Response data has nested data object");
      
      if (Array.isArray(responseData.data.users)) {
        console.log("Found users array in data.users property");
        return responseData.data.users;
      }
      
      // Case 4: data property itself is the object we want to return
      console.log("Using data property as users");
      return responseData.data;
    }
    
    // Case 5: users are directly in the responseData (no data property)
    if (responseData && typeof responseData === 'object' && !responseData.data) {
      console.log("Response object itself contains users");
      if (responseData.users && Array.isArray(responseData.users)) {
        return responseData.users;
      }
    }
    
    // Default empty array for safety
    console.warn("Could not extract users from response, returning empty array");
    return [];
  };

  const fetchUsers = async () => {
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
      params.append('limit', usersPerPage.toString());
      
      if (roleFilter !== 'ALL') {
        params.append('role', roleFilter);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      console.log(`Fetching users with params: ${params.toString()}`);
      
      const response = await apiClient.get(`/api/admin/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("API Response:", response.data);
      
      if (!response.data) {
        throw new Error('No data received from API');
      }
      
      const responseData = response.data;
      
      // Check if response is directly an array of users
      if (Array.isArray(responseData)) {
        console.log(`Found ${responseData.length} users in direct array response`);
        setUsers(responseData);
        setTotalPages(1);
        setCurrentPage(1);
        setLoading(false);
        return;
      }
      
      // Check if response has a direct users property at the root level
      if (responseData && typeof responseData === 'object' && 'users' in responseData && Array.isArray(responseData.users)) {
        console.log(`Found ${responseData.users.length} users in root users property`);
        setUsers(responseData.users);
        setTotalPages((responseData as any).totalPages || 1);
        setCurrentPage((responseData as any).currentPage || 1);
        setLoading(false);
        return;
      }
      
      // Cast to structured response for typed access
      const structuredResponse = responseData as ApiResponse<UsersApiResponse | User[]>;
      
      // Get raw data structure from backend response
      console.log("Response structure:", Object.keys(responseData).join(', '));
      
      // Direct match with backend response structure
      if (structuredResponse.data) {
        console.log("Response contains data property");
        
        let usersData: User[] = [];
        
        // Extract users based on data format
        if (Array.isArray(structuredResponse.data)) {
          console.log(`Found ${structuredResponse.data.length} users in data array`);
          usersData = structuredResponse.data;
        } else {
          // Try to handle nested formats
          console.log("Data is not an array, trying to extract from object");
          usersData = extractUsersFromResponse(structuredResponse);
        }
        
        console.log(`Successfully extracted ${usersData.length} users with IDs:`, 
          usersData.map(u => u.id).join(', '));
        
        setUsers(usersData);
        setTotalPages(structuredResponse.totalPages || 1);
        setCurrentPage(structuredResponse.currentPage || 1);
      } else {
        console.warn("Response does not match expected format:", responseData);
        setUsers([]);
        setTotalPages(1);
        setCurrentPage(1);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to fetch users');
      setLoading(false);
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.replace('/login');
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchUsers();
  };

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    
    // If the user is a driver, fetch their driver profile details
    if (user.role === 'DRIVER') {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.replace('/login');
          return;
        }
        
        console.log(`Fetching driver profile for ID: ${user.id}`);
        
        const response = await apiClient.get<DriverProfileResponse>(`/api/admin/drivers/${user.id}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('Driver profile response:', response.data);
        
        if (response.data && response.data.status === 'success') {
          // Update the selected user with the fetched data
          setSelectedUser(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching driver profile:', error);
        // Continue showing user details even if driver profile fetch fails
      }
    }
    
    setShowDetailsModal(true);
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }
      
      console.log(`Toggling status for user ID ${userId} from ${currentStatus ? 'active' : 'inactive'} to ${!currentStatus ? 'active' : 'inactive'}`);
      
      const response = await apiClient.patch(`/api/admin/users/${userId}/status`, 
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      console.log("Status update response:", response.data);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, isActive: !currentStatus } : user
        )
      );
      
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, isActive: !currentStatus });
      }
      
      // Format success message
      let successMessage = `User status ${currentStatus ? "deactivated" : "activated"} successfully`;
      
      if (response.data) {
        if (typeof response.data === 'object' && response.data !== null) {
          // Use proper type assertion with unknown first
          const responseObj = response.data as unknown as { message?: string };
          successMessage = responseObj.message || successMessage;
        } else if (typeof response.data === 'string') {
          successMessage = response.data;
        }
      }
      
      // Show success message
      alert(successMessage);
    } catch (err: any) {
      console.error('Error updating user status:', err);
      
      // Handle error response formats
      const errorResponse = err.response?.data;
      let errorMessage = 'Failed to update user status';
      
      if (errorResponse) {
        if (typeof errorResponse === 'object' && errorResponse.message) {
          errorMessage = errorResponse.message;
        } else if (typeof errorResponse === 'string') {
          errorMessage = errorResponse;
        }
      }
      
      alert(errorMessage);
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.replace('/login');
      }
    }
  };

  const handleResetPassword = (email: string) => {
    setResetPasswordEmail(email);
    setResetPasswordResult(null);
    setShowResetModal(true);
  };

  const confirmResetPassword = async () => {
    try {
      if (!resetPasswordEmail) {
        setResetPasswordResult({
          success: false,
          message: t('admin.users.noEmailError')
        });
        return;
      }

      setLoading(true);
      
      const response = await apiClient.post(
        '/api/admin/users/reset-password',
        { email: resetPasswordEmail },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      console.log("Reset password response:", response.data);
      
      // Cast response data to our interface
      const responseData = response.data as ResetPasswordResponse;
      
      const successMessage = 
        responseData?.message || 
        responseData?.data?.message || 
        t('admin.users.passwordResetSuccess');
      
      setResetPasswordResult({
        success: true,
        message: successMessage,
        tempPassword: responseData?.data?.tempPassword || responseData?.tempPassword
      });
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error resetting password:', err);
      
      const errorMessage = 
        err.response?.data?.message || 
        err.message || 
        t('admin.users.passwordResetFailed');
      
      setResetPasswordResult({
        success: false,
        message: errorMessage
      });
      
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-600';
      case 'DRIVER': return 'bg-blue-600';
      default: return 'bg-green-600';
    }
  };

  const handleCloseResetModal = () => {
    setShowResetModal(false);
    setResetPasswordResult(null);
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Users Management</h1>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <form onSubmit={handleSearch}>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('admin.users.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-primary" type="submit">
                    <FaSearch className="me-1" /> {t('admin.search')}
                  </button>
                </div>
              </form>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1); // Reset to first page when filtering
                }}
              >
                <option value="ALL">{t('admin.users.allRoles')}</option>
                <option value="ADMIN">{t('admin.users.roleAdmin')}</option>
                <option value="CLIENT">{t('admin.users.roleClient')}</option>
                <option value="DRIVER">{t('admin.users.roleDriver')}</option>
              </select>
            </div>
            <div className="col-md-3 text-end">
              <button
                className="btn btn-outline-primary"
                onClick={() => fetchUsers()}
                disabled={loading}
              >
                {loading ? t('button.loading') : t('admin.refresh')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {loading ? (
            <div className="d-flex justify-content-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('button.loading')}</span>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">{t('admin.users.noUsersFound')}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>{t('admin.users.name')}</th>
                    <th>{t('admin.users.email')}</th>
                    <th>{t('admin.users.role')}</th>
                    <th>{t('admin.users.status')}</th>
                    <th>{t('admin.users.joined')}</th>
                    <th>{t('admin.users.lastActive')}</th>
                    <th>{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${getRoleBadgeColor(user.role)}`}>
                          {t(`admin.users.role${user.role}`)}
                        </span>
                      </td>
                      <td>
                        {user.isActive ? (
                          <span className="badge bg-success">{t('admin.users.active')}</span>
                        ) : (
                          <span className="badge bg-danger">{t('admin.users.inactive')}</span>
                        )}
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>{user.lastLogin ? formatDate(user.lastLogin) : t('admin.users.never')}</td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                          >
                            <FaUserEdit /> {t('admin.edit')}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleViewDetails(user)}
                          >
                            <FaFileAlt /> {t('admin.view')}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleResetPassword(user.email)}
                          >
                            <FaKey /> {t('admin.users.resetPwd')}
                          </button>
                          {user.role !== 'ADMIN' && (
                            <button
                              type="button"
                              className={`btn btn-sm ${user.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                              onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                            >
                              {user.isActive ? (
                                <><FaUserSlash /> {t('admin.users.deactivate')}</>
                              ) : (
                                <><FaUserEdit /> {t('admin.users.activate')}</>
                              )}
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
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="card-footer bg-white">
            <nav>
              <ul className="pagination justify-content-center mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    {t('pagination.previous')}
                  </button>
                </li>
                
                {Array.from({ length: totalPages }).map((_, index) => (
                  <li 
                    key={index} 
                    className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(index + 1)}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}
                
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

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('admin.users.userDetails')}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDetailsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <h6 className="text-muted mb-2">{t('admin.users.basicInfo')}</h6>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <p className="mb-1"><strong>{t('admin.users.name')}:</strong></p>
                      <p>{selectedUser.name}</p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-1"><strong>{t('admin.users.email')}:</strong></p>
                      <p>{selectedUser.email}</p>
                    </div>
                  </div>
                  
                  <div className="row g-2">
                    <div className="col-md-6">
                      <p className="mb-1"><strong>{t('admin.users.phone')}:</strong></p>
                      <p>{selectedUser.phoneNumber || t('admin.users.notProvided')}</p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-1"><strong>{t('admin.users.role')}:</strong></p>
                      <p>
                        <span className={`badge ${getRoleBadgeColor(selectedUser.role)}`}>
                          {t(`admin.users.role${selectedUser.role}`)}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="row g-2">
                    <div className="col-md-6">
                      <p className="mb-1"><strong>{t('admin.users.status')}:</strong></p>
                      <p>
                        {selectedUser.isActive ? (
                          <span className="badge bg-success">{t('admin.users.active')}</span>
                        ) : (
                          <span className="badge bg-danger">{t('admin.users.inactive')}</span>
                        )}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-1"><strong>{t('admin.users.joined')}:</strong></p>
                      <p>{formatDate(selectedUser.createdAt)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <h6 className="text-muted mb-2">{t('admin.users.accountDetails')}</h6>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <p className="mb-1"><strong>{t('admin.users.lastActive')}:</strong></p>
                      <p>{selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : t('admin.users.never')}</p>
                    </div>
                    {selectedUser.totalOrders !== undefined && (
                      <div className="col-md-6">
                        <p className="mb-1"><strong>{t('admin.users.totalOrders')}:</strong></p>
                        <p>{selectedUser.totalOrders}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedUser.role === 'DRIVER' && selectedUser.driver_profile && (
                  <div className="mb-3">
                    <h6 className="text-muted mb-2">{t('admin.users.driverProfile')}</h6>
                    
                    {/* Vehicle Information */}
                    <div className="card mb-3">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">{t('driver.vehicleInfo')}</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-2">
                          <div className="col-md-6">
                            <p className="mb-1"><strong>{t('driver.make')}:</strong></p>
                            <p>{selectedUser.driver_profile.vehicleMake || 'N/A'}</p>
                          </div>
                          <div className="col-md-6">
                            <p className="mb-1"><strong>{t('driver.model')}:</strong></p>
                            <p>{selectedUser.driver_profile.vehicleModel || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="row g-2">
                          <div className="col-md-6">
                            <p className="mb-1"><strong>{t('driver.year')}:</strong></p>
                            <p>{selectedUser.driver_profile.vehicleYear || 'N/A'}</p>
                          </div>
                          <div className="col-md-6">
                            <p className="mb-1"><strong>{t('driver.color')}:</strong></p>
                            <p>{selectedUser.driver_profile.vehicleColor || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="row g-2">
                          <div className="col-12">
                            <p className="mb-1"><strong>{t('driver.licensePlate')}:</strong></p>
                            <p>{selectedUser.driver_profile.vehicleRegistration || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* License Information */}
                    <div className="card mb-3">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">{t('driver.licenseInfo')}</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-2">
                          <div className="col-md-6">
                            <p className="mb-1"><strong>{t('driver.licenseNumber')}:</strong></p>
                            <p>{selectedUser.driver_profile.licenseNumber || 'N/A'}</p>
                          </div>
                          <div className="col-md-6">
                            <p className="mb-1"><strong>{t('driver.expiryDate')}:</strong></p>
                            <p>{selectedUser.driver_profile.licenseExpiry ? formatDate(selectedUser.driver_profile.licenseExpiry) : 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Documents */}
                    <div className="card">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">{t('admin.users.documents')}</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-2">
                          {selectedUser.driver_profile?.licenseDocument && (
                            <div className="col-md-6 mb-2">
                              <p className="mb-1"><strong>{t('driver.license')}:</strong></p>
                              <div className="d-flex align-items-center gap-2">
                                <div className="position-relative" style={{ width: '100px', height: '100px' }}>
                                  <img 
                                    src={selectedUser.driver_profile?.licenseDocument} 
                                    alt={t('driver.license')} 
                                    className="img-thumbnail" 
                                    style={{ 
                                      width: '100%', 
                                      height: '100%', 
                                      objectFit: 'cover',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => window.open(selectedUser.driver_profile?.licenseDocument, '_blank')}
                                    onError={(e) => {
                                      e.currentTarget.src = '/images/document-placeholder.png';
                                      e.currentTarget.onerror = null;
                                    }}
                                  />
                                  <div className="position-absolute top-0 end-0 p-1">
                                    <span className="badge bg-primary">{t('admin.users.clickToEnlarge')}</span>
                                  </div>
                                </div>
                                <a 
                                  href={selectedUser.driver_profile?.licenseDocument} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  <FaFileAlt className="me-1" /> {t('admin.users.viewFullSize')}
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {selectedUser.driver_profile?.registrationDocument && (
                            <div className="col-md-6 mb-2">
                              <p className="mb-1"><strong>{t('driver.registration')}:</strong></p>
                              <div className="d-flex align-items-center gap-2">
                                <div className="position-relative" style={{ width: '100px', height: '100px' }}>
                                  <img 
                                    src={selectedUser.driver_profile?.registrationDocument} 
                                    alt={t('driver.registration')} 
                                    className="img-thumbnail" 
                                    style={{ 
                                      width: '100%', 
                                      height: '100%', 
                                      objectFit: 'cover',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => window.open(selectedUser.driver_profile?.registrationDocument, '_blank')}
                                    onError={(e) => {
                                      e.currentTarget.src = '/images/document-placeholder.png';
                                      e.currentTarget.onerror = null;
                                    }}
                                  />
                                  <div className="position-absolute top-0 end-0 p-1">
                                    <span className="badge bg-primary">{t('admin.users.clickToEnlarge')}</span>
                                  </div>
                                </div>
                                <a 
                                  href={selectedUser.driver_profile?.registrationDocument} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  <FaFileAlt className="me-1" /> {t('admin.users.viewFullSize')}
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {selectedUser.driver_profile?.insuranceDocument && (
                            <div className="col-md-6 mb-2">
                              <p className="mb-1"><strong>{t('driver.insurance')}:</strong></p>
                              <div className="d-flex align-items-center gap-2">
                                <div className="position-relative" style={{ width: '100px', height: '100px' }}>
                                  <img 
                                    src={selectedUser.driver_profile?.insuranceDocument} 
                                    alt={t('driver.insurance')} 
                                    className="img-thumbnail" 
                                    style={{ 
                                      width: '100%', 
                                      height: '100%', 
                                      objectFit: 'cover',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => window.open(selectedUser.driver_profile?.insuranceDocument, '_blank')}
                                    onError={(e) => {
                                      e.currentTarget.src = '/images/document-placeholder.png';
                                      e.currentTarget.onerror = null;
                                    }}
                                  />
                                  <div className="position-absolute top-0 end-0 p-1">
                                    <span className="badge bg-primary">{t('admin.users.clickToEnlarge')}</span>
                                  </div>
                                </div>
                                <a 
                                  href={selectedUser.driver_profile?.insuranceDocument} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  <FaFileAlt className="me-1" /> {t('admin.users.viewFullSize')}
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {selectedUser.driver_profile?.backgroundCheckDocument && (
                            <div className="col-md-6 mb-2">
                              <p className="mb-1"><strong>{t('driver.backgroundCheck')}:</strong></p>
                              <div className="d-flex align-items-center gap-2">
                                <div className="position-relative" style={{ width: '100px', height: '100px' }}>
                                  <img 
                                    src={selectedUser.driver_profile?.backgroundCheckDocument} 
                                    alt={t('driver.backgroundCheck')} 
                                    className="img-thumbnail" 
                                    style={{ 
                                      width: '100%', 
                                      height: '100%', 
                                      objectFit: 'cover',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => window.open(selectedUser.driver_profile?.backgroundCheckDocument, '_blank')}
                                    onError={(e) => {
                                      e.currentTarget.src = '/images/document-placeholder.png';
                                      e.currentTarget.onerror = null;
                                    }}
                                  />
                                  <div className="position-absolute top-0 end-0 p-1">
                                    <span className="badge bg-primary">{t('admin.users.clickToEnlarge')}</span>
                                  </div>
                                </div>
                                <a 
                                  href={selectedUser.driver_profile?.backgroundCheckDocument} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  <FaFileAlt className="me-1" /> {t('admin.users.viewFullSize')}
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {!selectedUser.driver_profile?.licenseDocument && 
                           !selectedUser.driver_profile?.registrationDocument && 
                           !selectedUser.driver_profile?.insuranceDocument && 
                           !selectedUser.driver_profile?.backgroundCheckDocument && (
                            <div className="col-12">
                              <p className="text-muted">{t('admin.users.noDocumentsAvailable')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedUser.role === 'DRIVER' && !selectedUser.driver_profile && (
                  <div className="mb-3">
                    <h6 className="text-muted mb-2">{t('admin.users.driverInfo')}</h6>
                    <p className="text-muted">{t('admin.users.noDriverProfileInfo')}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <div className="me-auto">
                  <button
                    type="button"
                    className="btn me-2 btn-primary"
                    onClick={() => {
                      setShowDetailsModal(false);
                      router.push(`/admin/users/${selectedUser.id}/edit`);
                    }}
                  >
                    <FaUserEdit className="me-1" /> {t('admin.edit')}
                  </button>
                  <button
                    type="button"
                    className={`btn me-2 btn-${selectedUser.isActive ? 'danger' : 'success'}`}
                    onClick={() => handleToggleUserStatus(selectedUser.id, selectedUser.isActive)}
                  >
                    {selectedUser.isActive ? t('admin.users.deactivate') : t('admin.users.activate')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={() => handleResetPassword(selectedUser.email)}
                  >
                    <FaKey className="me-1" /> {t('admin.users.resetPwd')}
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDetailsModal(false)}
                >
                  {t('button.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Confirmation Modal */}
      {showResetModal && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('admin.users.resetPassword')}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseResetModal}
                ></button>
              </div>

              {resetPasswordResult ? (
                <div className={`modal-body alert ${resetPasswordResult.success ? 'alert-success' : 'alert-danger'}`}>
                  <p>{resetPasswordResult.message}</p>
                  {resetPasswordResult.tempPassword && (
                    <div className="mt-3">
                      <p><strong>{t('admin.users.tempPassword')}:</strong></p>
                      <div className="bg-light p-2 border rounded">
                        <code>{resetPasswordResult.tempPassword}</code>
                      </div>
                      <p className="mt-2 text-warning">
                        <small><FaTimesCircle className="me-1" /> {t('admin.users.passwordWarning')}</small>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="modal-body">
                  <p>{t('admin.users.resetPasswordConfirm')}: <strong>{resetPasswordEmail}</strong>?</p>
                  <p className="text-warning">
                    <FaTimesCircle className="me-1" /> {t('admin.users.resetPasswordWarning')}
                  </p>
                </div>
              )}
              
              <div className="modal-footer">
                {resetPasswordResult ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCloseResetModal}
                  >
                    {t('button.close')}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCloseResetModal}
                    >
                      {t('button.cancel')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={confirmResetPassword}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      ) : (
                        <FaKey className="me-1" />
                      )}
                      {loading ? t('button.processing') : t('admin.users.confirmReset')}
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