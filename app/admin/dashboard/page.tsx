'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaUsers, FaTruck, FaBoxes, FaMoneyBillWave, FaChartLine, FaUserCheck, FaUserClock, FaShippingFast } from 'react-icons/fa';
import { apiClient } from '@/utils/apiClient';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate, formatShortDate } from '@/utils/dateUtils';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingDrivers: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  revenueGrowth: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  customer: {
    name: string;
  };
  createdAt: string;
  totalAmount: number;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  results?: number;
  totalPages?: number;
  currentPage?: number;
}

interface DashboardData {
  stats: AdminStats;
  recentOrders: RecentOrder[];
  recentUsers: RecentUser[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await apiClient.get('/api/admin/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const dashboardData = (response.data as ApiResponse<DashboardData>).data || {
          stats: null,
          recentOrders: [],
          recentUsers: []
        };
        
        setStats(dashboardData.stats || null);
        setRecentOrders(dashboardData.recentOrders || []);
        setRecentUsers(dashboardData.recentUsers || []);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err, 'Response:', err.response?.data);
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
        setLoading(false);
        
        // If unauthorized, redirect to login
        if (err.response?.status === 401 || err.response?.status === 403) {
          router.replace('/login');
        }
      }
    };

    checkAuth();
  }, [router]);

  const getStatusColor = (status: string): string => {
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

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'ADMIN': return 'danger';
      case 'DRIVER': return 'info';
      case 'CLIENT': return 'success';
      default: return 'secondary';
    }
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h1 className="mb-4">{t('admin.dashboard')}</h1>

      {/* Statistics Cards */}
      {stats && (
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle p-3 bg-light me-3">
                  <FaUsers className="text-primary fs-4" />
                </div>
                <div>
                  <h6 className="card-title mb-0">{t('admin.totalUsers')}</h6>
                  <h3 className="mb-0">{stats?.totalUsers || 0}</h3>
                  <p className="card-text text-muted small mb-0">{stats?.activeUsers || 0} {t('admin.activeUsers')}</p>
                </div>
              </div>
              <div className="card-footer bg-white border-0">
                <Link href="/admin/users" className="text-decoration-none small">
                  {t('admin.viewAllUsers')}
                </Link>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle p-3 bg-light me-3">
                  <FaBoxes className="text-primary fs-4" />
                </div>
                <div>
                  <h6 className="card-title mb-0">{t('admin.totalOrdersCount')}</h6>
                  <h3 className="mb-0">{stats?.totalOrders || 0}</h3>
                  <p className="card-text text-muted small mb-0">{stats?.completedOrders || 0} {t('admin.totalCompleted')}</p>
                </div>
              </div>
              <div className="card-footer bg-white border-0">
                <Link href="/admin/orders" className="text-decoration-none small">
                  {t('admin.viewAllOrders')}
                </Link>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle p-3 bg-light me-3">
                  <FaMoneyBillWave className="text-primary fs-4" />
                </div>
                <div>
                  <h6 className="card-title mb-0">{t('admin.totalRevenue')}</h6>
                  <h3 className="mb-0">{formatCurrency(stats?.totalRevenue || 0)}</h3>
                  <p className={`card-text small mb-0 ${(stats?.revenueGrowth || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                    {(stats?.revenueGrowth || 0) >= 0 ? '+' : ''}{stats?.revenueGrowth || 0}% {t('admin.revenueGrowth')}
                  </p>
                </div>
              </div>
              <div className="card-footer bg-white border-0">
                <Link href="/admin/orders" className="text-decoration-none small">
                  {t('admin.revenueDetails')}
                </Link>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle p-3 bg-light me-3">
                  <FaTruck className="text-primary fs-4" />
                </div>
                <div>
                  <h6 className="card-title mb-0">{t('admin.pendingDriversCount')}</h6>
                  <h3 className="mb-0">{stats?.pendingDrivers || 0}</h3>
                  <p className="card-text text-muted small mb-0">{t('admin.awaitingApproval')}</p>
                </div>
              </div>
              <div className="card-footer bg-white border-0">
                <Link href="/admin/dashboard/pending-drivers" className="text-decoration-none small">
                  {t('admin.viewPendingDrivers')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Section */}
      <div className="row g-4">
        {/* Recent Orders */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{t('admin.recentOrdersList')}</h5>
              <Link href="/admin/orders" className="btn btn-sm btn-outline-primary">
                {t('admin.viewAll')}
              </Link>
            </div>
            <div className="card-body p-0">
              {recentOrders.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">{t('admin.noRecentOrders')}</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>{t('admin.orderNum')}</th>
                        <th>{t('admin.customerName')}</th>
                        <th>{t('admin.dateField')}</th>
                        <th>{t('admin.statusField')}</th>
                        <th>{t('admin.amountField')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map(order => (
                        <tr key={order.id}>
                          <td>
                            <Link href={`/admin/orders?search=${order.orderNumber}`} className="text-decoration-none">
                              {order.orderNumber}
                            </Link>
                          </td>
                          <td>{order.customer.name}</td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>
                            <span className={`badge bg-${getStatusColor(order.status)}`}>
                              {t(`dashboard.orderStatus.${order.status}`)}
                            </span>
                          </td>
                          <td>{formatCurrency(order.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{t('admin.recentUsers')}</h5>
              <Link href="/admin/users" className="btn btn-sm btn-outline-primary">
                {t('admin.viewAll')}
              </Link>
            </div>
            <div className="card-body p-0">
              {recentUsers.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">{t('admin.noRecentUsers')}</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>{t('admin.nameField')}</th>
                        <th>{t('admin.emailField')}</th>
                        <th>{t('admin.roleField')}</th>
                        <th>{t('admin.joinedDate')}</th>
                        <th>{t('admin.lastActive')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map(user => (
                        <tr key={user.id}>
                          <td>
                            <Link href={`/admin/users?search=${user.email}`} className="text-decoration-none">
                              {user.name}
                            </Link>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`badge bg-${getRoleBadgeColor(user.role)}`}>
                              {user.role}
                            </span>
                          </td>
                          <td>{formatDate(user.createdAt)}</td>
                          <td>{user.lastLogin ? formatDate(user.lastLogin) : t('admin.never')}</td>
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