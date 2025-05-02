'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaBox, FaTruck, FaCheckCircle, FaClock, FaBan, FaPlus } from 'react-icons/fa';
import { orderService } from '@/services/orderService';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Order {
  id: string;
  status: string;
  createdAt: string;
  destinationAddress: string;
  trackingNumber: string;
}

interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentOrders: Order[];
}

interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

const Dashboard = () => {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user, loading } = useAuth();
  
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    inTransitOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchDashboardData();
    }
  }, [user, loading, router]);

  const fetchDashboardData = async () => {
    if (!user || !user.id || !user.role) {
      setError(t('error.auth'));
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      console.log('Fetching dashboard data for:', {
        role: user.role,
        userId: user.id
      });

      const response = await orderService.getDashboardData(user.role, user.id);
      console.log('Dashboard response:', response);
      
      if (response.status === 'success' && response.data) {
        setStats({
          totalOrders: response.data.stats.totalOrders || 0,
          pendingOrders: response.data.stats.pendingOrders || 0,
          deliveredOrders: response.data.stats.completedOrders || 0,
          inTransitOrders: response.data.stats.activeOrders || 0,
        });
        
        setRecentOrders((response.data.recentOrders || []) as unknown as Order[]);
      } else {
        setError(response.message || t('error.failed'));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(t('error.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="loader"></div>
        <span className="visually-hidden">{t('loading.message')}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('dashboard.title')}</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{t('dashboard.welcomeMessage')}, {user?.name || t('dashboard.user')}</h2>
          <p className="text-gray-600">{t('dashboard.summary')}</p>
          
          {/* Create New Order Button - Only visible to clients */}
          {user?.role === 'CLIENT' && (
            <div className="mt-4">
              <Link href="/dashboard/new-order" className="btn btn-primary">
                <FaPlus className="me-2" /> {t('orders.createNewOrder')}
              </Link>
            </div>
          )}
        </div>

        <div className="row g-4">
          {/* Stat cards */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <div className="icon-container bg-primary-light rounded-circle p-3 me-3">
                    <FaBox className="text-primary" />
                  </div>
                  <h5 className="card-title mb-0">{t('dashboard.totalOrders')}</h5>
                </div>
                <h3 className="mb-0">{stats.totalOrders}</h3>
              </div>
            </div>
          </div>
          
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <div className="icon-container bg-warning-light rounded-circle p-3 me-3">
                    <FaClock className="text-warning" />
                  </div>
                  <h5 className="card-title mb-0">{t('dashboard.pendingOrders')}</h5>
                </div>
                <h3 className="mb-0">{stats.pendingOrders}</h3>
              </div>
            </div>
          </div>
          
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <div className="icon-container bg-info-light rounded-circle p-3 me-3">
                    <FaTruck className="text-info" />
                  </div>
                  <h5 className="card-title mb-0">{t('dashboard.inTransit')}</h5>
                </div>
                <h3 className="mb-0">{stats.inTransitOrders}</h3>
              </div>
            </div>
          </div>
          
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <div className="icon-container bg-success-light rounded-circle p-3 me-3">
                    <FaCheckCircle className="text-success" />
                  </div>
                  <h5 className="card-title mb-0">{t('dashboard.delivered')}</h5>
                </div>
                <h3 className="mb-0">{stats.deliveredOrders}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">{t('dashboard.recentOrders')}</h2>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {t('dashboard.noOrders')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.orderID')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.destination')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(order.status)}
                          <span className="ml-2 text-sm text-gray-500">{getStatusText(order.status)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{order.destinationAddress}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {t('dashboard.viewDetails')}
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
  );
};

function getStatusIcon(status: string) {
  switch (status) {
    case 'DELIVERED':
      return <FaCheckCircle className="text-green-500" />;
    case 'IN_TRANSIT':
      return <FaTruck className="text-blue-500" />;
    case 'PENDING':
      return <FaBox className="text-yellow-500" />;
    case 'CANCELLED':
      return <FaBan className="text-red-500" />;
    default:
      return <FaBox className="text-gray-500" />;
  }
}

function getStatusText(status: string) {
  const { t } = useLanguage();
  
  switch (status) {
    case 'PENDING':
      return t('dashboard.orderStatus.PENDING');
    case 'IN_TRANSIT':
      return t('dashboard.orderStatus.IN_TRANSIT');
    case 'DELIVERED':
      return t('dashboard.orderStatus.DELIVERED');
    case 'CANCELLED':
      return t('dashboard.orderStatus.CANCELLED');
    case 'ACCEPTED':
      return t('dashboard.orderStatus.ACCEPTED');
    case 'PICKED_UP':
      return t('dashboard.orderStatus.PICKED_UP');
    default:
      return status;
  }
}

export default Dashboard; 