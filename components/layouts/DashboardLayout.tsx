'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaSignOutAlt, FaBars, FaHome, FaBox, FaDollarSign, FaUser, FaTruck, FaClipboardCheck, FaCreditCard, FaHistory, FaBell } from 'react-icons/fa';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import TranslatedText from '../TranslatedText';
import Logo from '../Logo';

// Define missing types
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  notifications?: { id: string; read: boolean }[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const auth = useAuth();
  const user = auth.user as User | null;
  const { loading, logout } = auth;
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">
            <TranslatedText text="loading.message" />
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const navItems = [
    { name: 'dashboard.welcome', icon: <FaHome />, href: '/dashboard' },
    { name: 'orders.current', icon: <FaTruck />, href: '/dashboard/current-orders' },
    { name: 'orders.history', icon: <FaHistory />, href: '/dashboard/orders-history' },
    { name: 'payment.confirmation', icon: <FaCreditCard />, href: '/dashboard/payment-confirmation' },
    { name: 'payment.history', icon: <FaDollarSign />, href: '/dashboard/payments' },
    { name: 'user.profile', icon: <FaUser />, href: '/dashboard/profile' },
  ];

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Mobile Navigation Toggle */}
      <div className="d-md-none bg-dark text-white p-2 shadow-sm">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <Logo width={64} height={64} showText className="text-white" />
          </div>
          <button 
            className="btn btn-link text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={t('nav.toggle')}
          >
            <FaBars size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu - Slide in from left */}
      <div 
        className={`position-fixed bg-dark text-white h-100 top-0 start-0 overflow-auto transition-all ${
          isMobileMenuOpen ? 'w-75 shadow-lg' : 'w-0'
        }`} 
        style={{ 
          zIndex: 1050, 
          transition: 'width 0.3s ease-in-out',
          maxWidth: '300px'
        }}
      >
        <div className="p-3">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Logo width={80} height={80} showText className="text-white" />
            <button 
              className="btn-close btn-close-white" 
              onClick={() => setIsMobileMenuOpen(false)} 
              aria-label={t('button.close')}
            ></button>
          </div>
          <ul className="nav flex-column">
            {navItems.map((item) => (
              <li className="nav-item" key={item.name}>
                <Link 
                  href={item.href}
                  className={`nav-link text-white d-flex align-items-center ${pathname === item.href ? 'active bg-primary rounded' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="me-2">{item.icon}</span>
                  <TranslatedText text={item.name} />
                </Link>
              </li>
            ))}
            <li className="nav-item mt-3">
              <button 
                className="nav-link text-white d-flex align-items-center w-100"
                onClick={logout}
              >
                <FaSignOutAlt className="me-2" /> <TranslatedText text="nav.logout" />
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Overlay when mobile menu is open */}
      {isMobileMenuOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark" 
          style={{ opacity: '0.5', zIndex: 1040 }}
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <div className="d-flex flex-grow-1">
        {/* Desktop Sidebar Navigation */}
        <div className="bg-dark text-white d-none d-md-flex flex-column p-3" style={{ width: '250px', minHeight: '100vh' }}>
          <div className="d-flex align-items-center mb-4">
            <Logo width={80} height={80} showText className="text-white" />
          </div>
          <hr className="text-white-50" />
          <ul className="nav flex-column">
            {navItems.map((item) => (
              <li className="nav-item" key={item.name}>
                <Link 
                  href={item.href}
                  className={`nav-link text-white d-flex align-items-center ${pathname === item.href ? 'active bg-primary rounded' : ''}`}
                >
                  <span className="me-2">{item.icon}</span>
                  <TranslatedText text={item.name} />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto">
            <button 
              className="nav-link text-white d-flex align-items-center w-100"
              onClick={logout}
            >
              <FaSignOutAlt className="me-2" /> <TranslatedText text="nav.logout" />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-grow-1 d-flex flex-column">
          <header className="bg-light p-3 shadow-sm d-none d-md-block">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <Logo height={64} width={64} className="me-2" />
                <h1 className="h4 mb-0"><TranslatedText text="dashboard.welcome" /></h1>
              </div>
            </div>
          </header>
          <main className="py-3 px-3 px-md-4 flex-grow-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 