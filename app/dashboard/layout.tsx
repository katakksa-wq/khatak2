'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaHome, FaBox, FaUser, FaTruck, FaSignOutAlt, FaPlus, FaHistory, FaCreditCard, FaClipboardCheck, FaBell, FaBars } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/NotificationBell';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isClient, isDriver, logout, loading } = useAuth();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Add confirmation to logout
  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      // Show message that logging out will stop all requests
      console.log('Logging out and cancelling all pending requests...');
      logout();
    }
  };

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!loading && !user) {
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

  if (!user) {
    return null; // Will redirect to login in useEffect
  }

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Mobile Navigation Toggle */}
        <div className="d-md-none bg-dark text-white p-2 position-fixed w-100" style={{ top: 0, zIndex: 1000 }}>
          <div className="d-flex justify-content-between align-items-center">
            <button 
              className="btn btn-link text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <FaBars size={24} />
            </button>
            <LanguageSwitcher className="me-2" />
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div 
          className={`d-md-none bg-dark text-white position-fixed w-100 h-100`} 
          style={{ 
            top: 0, 
            left: isMobileMenuOpen ? '0' : '-100%',
            transition: 'left 0.3s ease-in-out',
            zIndex: 999,
            paddingTop: '60px',
            overflowY: 'auto'
          }}
        >
          <div className="p-3">
            <div className="d-flex align-items-center mb-4">
              <div className="rounded-circle me-2 bg-primary text-center" style={{ width: '32px', height: '32px', lineHeight: '32px' }}>
                {user.name?.charAt(0) || user.email.charAt(0)}
              </div>
              <div>
                <strong className="d-block">{user.name}</strong>
                <small className="text-white-50">{user.role === 'CLIENT' ? t('admin.client') : t('admin.driver')}</small>
              </div>
            </div>
            <ul className="nav flex-column">
              <li className="nav-item">
                <Link 
                  href="/dashboard" 
                  className={`nav-link ${pathname === '/dashboard' ? 'active bg-primary text-white' : 'text-white-50'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaHome className="me-2" /> {t('nav.home')}
                </Link>
              </li>

              {/* Driver-specific navigation items */}
              {isDriver() && (
                <>
                  <li className="nav-item">
                    <Link 
                      href="/dashboard/available-orders" 
                      className={`nav-link ${pathname === '/dashboard/available-orders' ? 'active bg-primary text-white' : 'text-white-50'}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FaClipboardCheck className="me-2" /> {t('orders.available')}
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      href="/dashboard/payment-confirmation" 
                      className={`nav-link ${pathname === '/dashboard/payment-confirmation' ? 'active bg-primary text-white' : 'text-white-50'}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FaCreditCard className="me-2" /> {t('payment.confirmation')}
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      href="/dashboard/payments" 
                      className={`nav-link ${pathname === '/dashboard/payments' ? 'active bg-primary text-white' : 'text-white-50'}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FaHistory className="me-2" /> {t('payment.history')}
                    </Link>
                  </li>
                </>
              )}

              {/* Client-specific navigation items */}
              {isClient() && (
                <li className="nav-item">
                  <Link 
                    href="/dashboard/new-order" 
                    className={`nav-link ${pathname === '/dashboard/new-order' ? 'active bg-primary text-white' : 'text-white-50'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FaPlus className="me-2" /> {t('orders.new')}
                  </Link>
                </li>
              )}

              {/* Common navigation items for both roles */}
              <li className="nav-item">
                <Link 
                  href="/dashboard/current-orders" 
                  className={`nav-link ${pathname === '/dashboard/current-orders' ? 'active bg-primary text-white' : 'text-white-50'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaTruck className="me-2" /> {t('orders.current')}
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  href="/dashboard/orders-history" 
                  className={`nav-link ${pathname === '/dashboard/orders-history' ? 'active bg-primary text-white' : 'text-white-50'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaHistory className="me-2" /> {t('orders.history')}
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  href="/dashboard/notifications" 
                  className={`nav-link ${pathname === '/dashboard/notifications' ? 'active bg-primary text-white' : 'text-white-50'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaBell className="me-2" /> {t('user.notifications')}
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  href="/dashboard/profile" 
                  className={`nav-link ${pathname === '/dashboard/profile' ? 'active bg-primary text-white' : 'text-white-50'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaUser className="me-2" /> {t('user.profile')}
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

        {/* Desktop Navigation */}
        <div className="col-md-3 col-lg-2 d-none d-md-block bg-dark sidebar collapse" style={{ minHeight: '100vh' }}>
          <div className="pt-3 pb-2 mb-3">
            <div className="d-flex justify-content-center mb-4">
              <div className="text-white text-center">
                <h4 className="mb-0">{user.name}</h4>
                <p className="small text-muted mb-0">{user.role === 'CLIENT' ? t('admin.client') : t('admin.driver')}</p>
              </div>
            </div>
            <hr className="text-white-50" />
            <ul className="nav flex-column">
              <li className="nav-item">
                <Link 
                  href="/dashboard" 
                  className={`nav-link ${pathname === '/dashboard' ? 'active bg-primary text-white' : 'text-white-50'}`}
                >
                  <FaHome className="me-2" /> {t('nav.home')}
                </Link>
              </li>

              {/* Driver-specific navigation items */}
              {isDriver() && (
                <>
                  <li className="nav-item">
                    <Link 
                      href="/dashboard/available-orders" 
                      className={`nav-link ${pathname === '/dashboard/available-orders' ? 'active bg-primary text-white' : 'text-white-50'}`}
                    >
                      <FaClipboardCheck className="me-2" /> {t('orders.available')}
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      href="/dashboard/payment-confirmation" 
                      className={`nav-link ${pathname === '/dashboard/payment-confirmation' ? 'active bg-primary text-white' : 'text-white-50'}`}
                    >
                      <FaCreditCard className="me-2" /> {t('payment.confirmation')}
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      href="/dashboard/payments" 
                      className={`nav-link ${pathname === '/dashboard/payments' ? 'active bg-primary text-white' : 'text-white-50'}`}
                    >
                      <FaHistory className="me-2" /> {t('payment.history')}
                    </Link>
                  </li>
                </>
              )}

              {/* Client-specific navigation items */}
              {isClient() && (
                <li className="nav-item">
                  <Link 
                    href="/dashboard/new-order" 
                    className={`nav-link ${pathname === '/dashboard/new-order' ? 'active bg-primary text-white' : 'text-white-50'}`}
                  >
                    <FaPlus className="me-2" /> {t('orders.new')}
                  </Link>
                </li>
              )}

              {/* Common navigation items for both roles */}
              <li className="nav-item">
                <Link 
                  href="/dashboard/current-orders" 
                  className={`nav-link ${pathname === '/dashboard/current-orders' ? 'active bg-primary text-white' : 'text-white-50'}`}
                >
                  <FaTruck className="me-2" /> {t('orders.current')}
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  href="/dashboard/orders-history" 
                  className={`nav-link ${pathname === '/dashboard/orders-history' ? 'active bg-primary text-white' : 'text-white-50'}`}
                >
                  <FaHistory className="me-2" /> {t('orders.history')}
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  href="/dashboard/notifications" 
                  className={`nav-link ${pathname === '/dashboard/notifications' ? 'active bg-primary text-white' : 'text-white-50'}`}
                >
                  <FaBell className="me-2" /> {t('user.notifications')}
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  href="/dashboard/profile" 
                  className={`nav-link ${pathname === '/dashboard/profile' ? 'active bg-primary text-white' : 'text-white-50'}`}
                >
                  <FaUser className="me-2" /> {t('user.profile')}
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
        <div className="col-md-9 col-lg-10 ms-sm-auto px-md-4 py-4" style={{ marginTop: '60px' }}>
          {/* Removed top navigation bar */}
          {children}
        </div>
      </div>
    </div>
  );
} 