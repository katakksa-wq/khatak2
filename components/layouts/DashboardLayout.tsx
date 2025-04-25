'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaSignOutAlt, FaBars, FaHome, FaBox, FaDollarSign, FaUser, FaTruck, FaClipboardCheck, FaCreditCard, FaHistory, FaBell } from 'react-icons/fa';
import Link from 'next/link';

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
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const navItems = [
    { name: 'Dashboard', icon: <FaHome />, href: '/dashboard' },
    { name: 'Current Orders', icon: <FaTruck />, href: '/dashboard/current-orders' },
    { name: 'Orders History', icon: <FaHistory />, href: '/dashboard/orders-history' },
    { name: 'Payment Confirmation', icon: <FaCreditCard />, href: '/dashboard/payment-confirmation' },
    { name: 'Payment History', icon: <FaDollarSign />, href: '/dashboard/payments' },
    { name: 'Profile', icon: <FaUser />, href: '/dashboard/profile' },
  ];

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Mobile Navigation Toggle */}
      <div className="d-md-none bg-dark text-white p-2">
        <button 
          className="btn btn-link text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <FaBars size={24} />
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`d-md-none bg-dark text-white ${isMobileMenuOpen ? 'd-block' : 'd-none'}`}>
        <div className="p-3">
          <div className="d-flex align-items-center mb-4">
            <div className="rounded-circle me-2 bg-primary text-center" style={{ width: '32px', height: '32px', lineHeight: '32px' }}>
              {user.firstName?.charAt(0) || user.email.charAt(0)}
            </div>
            <div>
              <strong className="d-block">{user.firstName || user.email}</strong>
              <small className="text-white-50">{user.role}</small>
            </div>
          </div>
          <ul className="nav flex-column">
            {navItems.map((item) => (
              <li className="nav-item" key={item.name}>
                <Link 
                  href={item.href}
                  className={`nav-link text-white d-flex align-items-center ${pathname === item.href ? 'active bg-primary' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="me-2">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            ))}
            <li className="nav-item mt-3">
              <button 
                className="nav-link text-white d-flex align-items-center w-100"
                onClick={logout}
              >
                <FaSignOutAlt className="me-2" /> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="d-none d-md-flex">
        <div className="bg-dark text-white d-flex flex-column p-3" style={{ width: '250px', minHeight: '100vh' }}>
          <div className="d-flex align-items-center mb-4">
            <div className="rounded-circle me-2 bg-primary text-center" style={{ width: '32px', height: '32px', lineHeight: '32px' }}>
              {user.firstName?.charAt(0) || user.email.charAt(0)}
            </div>
            <div>
              <strong className="d-block">{user.firstName || user.email}</strong>
              <small className="text-white-50">{user.role}</small>
            </div>
          </div>
          <hr className="text-white-50" />
          <ul className="nav flex-column">
            {navItems.map((item) => (
              <li className="nav-item" key={item.name}>
                <Link 
                  href={item.href}
                  className={`nav-link text-white d-flex align-items-center ${pathname === item.href ? 'active bg-primary' : ''}`}
                >
                  <span className="me-2">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            ))}
            <li className="nav-item mt-3">
              <button 
                className="nav-link text-white d-flex align-items-center w-100"
                onClick={logout}
              >
                <FaSignOutAlt className="me-2" /> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-grow-1">
        <header className="bg-light p-3 shadow-sm">
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="h4 mb-0">Driver Dashboard</h1>
            <div className="d-flex align-items-center">
              <button className="btn btn-outline-danger btn-sm" onClick={logout}>
                <FaSignOutAlt className="me-1" /> Logout
              </button>
            </div>
          </div>
        </header>
        <main className="py-3 px-4">
          {children}
        </main>
      </div>
    </div>
  );
} 