'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { usePayments } from '@/hooks/usePayments';
import { Container, Row, Col, Card, Table, Tabs, Tab, Alert } from 'react-bootstrap';
import { FaUsers, FaMoneyBill, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import Link from 'next/link';
import BankAccountManagement from '@/components/payments/BankAccountManagement';

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!user && !loading) {
      router.push('/login');
    }
    
    // Redirect if user is not an admin
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
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

  if (user.role !== 'ADMIN') {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="bg-dark text-white d-flex flex-column p-3" style={{ width: '250px', minHeight: '100vh' }}>
        <Link href="/admin" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
          <span className="fs-4">Admin Portal</span>
        </Link>
        <hr />
        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item">
            <Link href="/admin" className="nav-link text-white d-flex align-items-center">
              <span className="me-2">📊</span>
              Dashboard
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/admin/orders" className="nav-link text-white d-flex align-items-center">
              <span className="me-2">📦</span>
              Orders
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/admin/payments" className="nav-link text-white d-flex align-items-center">
              <span className="me-2">💰</span>
              Payments
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/admin/drivers" className="nav-link text-white d-flex align-items-center">
              <span className="me-2">🚚</span>
              Drivers
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/admin/customers" className="nav-link text-white d-flex align-items-center">
              <span className="me-2">👥</span>
              Customers
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/admin/settings" className="nav-link text-white d-flex align-items-center">
              <span className="me-2">⚙️</span>
              Settings
            </Link>
          </li>
        </ul>
      </div>

      {/* Main content */}
      <div className="flex-grow-1">
        <header className="bg-light p-3 shadow-sm">
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="h4 mb-0">Admin Dashboard</h1>
            <div>
              <span className="badge bg-success me-2">Admin</span>
              <span>{user.email}</span>
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

// Define proper interfaces for the driver statistics
interface DriverStat {
  id: string;
  name: string;
  totalPaid: number;
  totalPending: number;
  paymentCount: number;
}

interface DriverStats {
  [key: string]: DriverStat;
}

export default function AdminPaymentsPage() {
  const { user } = useAuth();
  const { payments, loading, bankAccounts } = usePayments();
  const [activeTab, setActiveTab] = useState('payments');
  
  // Calculate statistics
  const totalCommission = payments?.reduce((total, payment) => total + payment.amount, 0) || 0;
  const pendingCommission = payments?.filter(p => p.status === 'PENDING')
    .reduce((total, payment) => total + payment.amount, 0) || 0;
  const rejectedPayments = payments?.filter(p => p.status === 'REJECTED').length || 0;
  
  // Calculate driver statistics
  const driverStats: DriverStats = {};
  
  if (payments) {
    payments.forEach(payment => {
      if (!payment.driverId) return;
      
      const driverId = payment.driverId;
      
      if (!driverStats[driverId]) {
        driverStats[driverId] = {
          id: driverId,
          name: `${payment.driver?.firstName || ''} ${payment.driver?.lastName || ''}`.trim() || 'Unknown Driver',
          totalPaid: 0,
          totalPending: 0,
          paymentCount: 0
        };
      }
      
      driverStats[driverId].paymentCount += 1;
      
      if (payment.status === 'CONFIRMED') {
        driverStats[driverId].totalPaid += payment.amount;
      } else if (payment.status === 'PENDING') {
        driverStats[driverId].totalPending += payment.amount;
      }
    });
  }
  
  // Get top drivers by amount paid
  const topDrivers = Object.values(driverStats)
    .sort((a: DriverStat, b: DriverStat) => b.totalPaid - a.totalPaid)
    .slice(0, 5);
  
  if (user?.role !== 'ADMIN') {
    return (
      <AdminLayout>
        <Alert variant="warning">
          You don't have permission to access this page.
        </Alert>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <Container fluid>
        <h2 className="mb-4">Payment Management</h2>
        
        {/* Statistics Cards */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-4 mb-lg-0">
            <Card className="shadow-sm h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="rounded-circle bg-primary text-white p-3 me-3">
                  <FaMoneyBill size={24} />
                </div>
                <div>
                  <h6 className="mb-0 text-muted">Total Commission</h6>
                  <h4 className="mb-0">£{totalCommission.toFixed(2)}</h4>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-4 mb-lg-0">
            <Card className="shadow-sm h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="rounded-circle bg-warning text-white p-3 me-3">
                  <FaExclamationTriangle size={24} />
                </div>
                <div>
                  <h6 className="mb-0 text-muted">Pending Commission</h6>
                  <h4 className="mb-0">£{pendingCommission.toFixed(2)}</h4>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-4 mb-lg-0">
            <Card className="shadow-sm h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="rounded-circle bg-danger text-white p-3 me-3">
                  <FaMoneyBill size={24} />
                </div>
                <div>
                  <h6 className="mb-0 text-muted">Rejected Payments</h6>
                  <h4 className="mb-0">{rejectedPayments}</h4>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6}>
            <Card className="shadow-sm h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="rounded-circle bg-success text-white p-3 me-3">
                  <FaUsers size={24} />
                </div>
                <div>
                  <h6 className="mb-0 text-muted">Total Drivers</h6>
                  <h4 className="mb-0">{Object.keys(driverStats).length}</h4>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {/* Top Drivers Table */}
        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-white">
            <h5 className="mb-0">Top Drivers by Commission Paid</h5>
          </Card.Header>
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center p-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : topDrivers.length === 0 ? (
              <div className="text-center p-4">
                <p className="mb-0 text-muted">No payment data available.</p>
              </div>
            ) : (
              <Table hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Payments</th>
                    <th>Total Paid</th>
                    <th>Pending</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topDrivers.map((driver: DriverStat) => (
                    <tr key={driver.id}>
                      <td>{driver.name}</td>
                      <td>{driver.paymentCount}</td>
                      <td className="text-success">£{driver.totalPaid.toFixed(2)}</td>
                      <td className="text-warning">£{driver.totalPending.toFixed(2)}</td>
                      <td>
                        {driver.totalPending > 0 ? (
                          <span className="badge bg-warning">Pending</span>
                        ) : (
                          <span className="badge bg-success">Paid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
        
        {/* Tabs for Payment Management and Bank Accounts */}
        <Card className="shadow-sm">
          <Card.Header className="bg-white">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => k && setActiveTab(k)}
              className="mb-0"
            >
              <Tab eventKey="payments" title="Payment Management">
                <Card.Body>
                  <p>Payment management component will go here</p>
                </Card.Body>
              </Tab>
              <Tab eventKey="bank-accounts" title="Bank Accounts">
                <Card.Body>
                  <BankAccountManagement />
                </Card.Body>
              </Tab>
            </Tabs>
          </Card.Header>
        </Card>
      </Container>
    </AdminLayout>
  );
} 