'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FaHome, FaUsers, FaUserTie, FaBox, FaClipboardCheck, 
  FaSignOutAlt, FaChartLine, FaTachometerAlt, FaMoneyBill
} from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/NotificationBell';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const { t } = useLanguage();

  // Add confirmation to logout
  const handleLogout = () => {
    if (confirm(t('logout.confirmMessage') || 'Are you sure you want to log out?')) {
      console.log('Logging out admin...');
      logout();
    }
  };

  useEffect(() => {
    // If not authenticated or not an admin, redirect to login
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null; // Will redirect to login in useEffect
  }

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Admin Sidebar */}
        <div className="col-md-3 col-lg-2 d-md-block bg-dark sidebar collapse" style={{ minHeight: '100vh' }}>
          <div className="pt-3 pb-2 mb-3">
            <div className="d-flex justify-content-center mb-4">
              <div className="text-white text-center">
                <h4 className="mb-0">{user.name}</h4>
                <p className="small text-muted mb-0">{t('admin.title')}</p>
              </div>
            </div>
            <hr className="text-white-50" />
            <ul className="nav flex-column">
              <li className="nav-item">
                <Link 
                  href="/admin/dashboard" 
                  className={`nav-link ${pathname === '/admin/dashboard' ? 'active bg-primary text-white' : 'text-white-50'}`}
                >
                  <FaTachometerAlt className="me-2" /> {t('nav.home')}
                </Link>
              </li>

              {/* Admin-specific navigation items */}
              <li className="nav-item">
                <Link 
                  href="/admin/orders" 
                  className={`nav-link ${pathname === '/admin/orders' ? 'active bg-primary text-white' : 'text-white-50'}`}
                >
                  <FaBox className="me-2" /> {t('admin.allOrders')}
                </Link>
              </li>
              
              <li className="nav-item">
                <Link 
                  href="/admin/users" 
                  className={`nav-link ${pathname === '/admin/users' ? 'active bg-primary text-white' : 'text-white-50'}`}
                >
                  <FaUsers className="me-2" /> {t('admin.manageUsers')}
                </Link>
              </li>
              
              <li className="nav-item">
                <Link 
                  href="/admin/driver-approvals" 
                  className={`nav-link ${pathname === '/admin/driver-approvals' ? 'active bg-primary text-white' : 'text-white-50'}`}
                >
                  <FaUserTie className="me-2" /> {t('admin.driverApprovals')}
                </Link>
              </li>
              
              <li className="nav-item">
                <Link 
                  href="/admin/payments/management" 
                  className={`nav-link ${pathname === '/admin/payments/management' ? 'active bg-primary text-white' : 'text-white-50'}`}
                >
                  <FaMoneyBill className="me-2" /> {t('admin.paymentManagement')}
                </Link>
              </li>
              
              <li className="nav-item mt-3">
                <a 
                  onClick={handleLogout}
                  className="nav-link text-white-50 cursor-pointer"
                  style={{ cursor: 'pointer' }}
                >
                  <FaSignOutAlt className="me-2" /> {t('nav.logout')}
                </a>
              </li>
              <li className="nav-item mt-2">
                <div className="nav-link text-white-50">
                  <LanguageSwitcher />
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Main content */}
        <div className="col-md-9 col-lg-10 ms-sm-auto px-md-4 py-4">
          {/* Top navigation bar */}
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 className="h2">
              {pathname && pathname.split('/').pop()?.replace('-', ' ').replace(/^\w/, c => c.toUpperCase()) || t('nav.home')}
            </h1>
            <div className="d-flex align-items-center">
              <LanguageSwitcher className="me-3" />
              <NotificationBell />
            </div>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
} 