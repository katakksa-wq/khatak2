'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, Badge, Button } from 'react-bootstrap';
import { FaMoneyBill, FaExclamationTriangle, FaCheck, FaSpinner } from 'react-icons/fa';
import Link from 'next/link';
import paymentService from '@/services/paymentService';

// Define types that match the expected API response
interface Order {
  id: string;
  trackingNumber: string;
  price: number;
  commissionPaid: boolean;
  status?: string;
}

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface Payment {
  id: string;
  orderId: string;
  driverId: string;
  amount: number;
  paymentMethod: string;
  paymentReference: string;
  paymentScreenshot?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  order: Order;
  driver: Driver;
}

export default function PaymentSummary() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const fetchPaymentData = async () => {
      if (!user || user.role !== 'DRIVER') return;
      
      try {
        setLoading(true);
        const response = await paymentService.getPayments();
        
        // Count payments by status
        const pending = response.data.payments.filter((p: Payment) => p.status === 'PENDING').length;
        setPendingPayments(pending);
        
        // Get unpaid delivered orders count
        const deliveredCount = response.data.payments.filter((p: Payment) => 
          p.order && p.order.status === 'DELIVERED' && !p.order.commissionPaid
        ).length;
        setUnpaidCount(deliveredCount);
        
        // Get 3 most recent payments
        setRecentPayments(response.data.payments.slice(0, 3));
      } catch (error) {
        console.error('Error fetching payment data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [user]);

  if (loading) {
    return (
      <Card className="h-100 shadow-sm">
        <Card.Body className="d-flex justify-content-center align-items-center">
          <FaSpinner className="fa-spin me-2" /> Loading payment information...
        </Card.Body>
      </Card>
    );
  }

  if (!user || user.role !== 'DRIVER') {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge bg="success">Confirmed</Badge>;
      case 'PENDING':
        return <Badge bg="warning">Pending</Badge>;
      case 'REJECTED':
        return <Badge bg="danger">Rejected</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card className="h-100 shadow-sm">
      <Card.Header className="bg-white py-3">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaMoneyBill className="me-2" />
            Commission Payments
          </h5>
          <Link href="/dashboard/payments" passHref>
            <Button variant="outline-primary" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </Card.Header>
      <Card.Body>
        {/* Warning if unpaid count is high */}
        {unpaidCount >= 2 && (
          <div className="alert alert-danger mb-3">
            <FaExclamationTriangle className="me-2" />
            <strong>Warning:</strong> You have {unpaidCount} unpaid commissions. 
            Your account will be deactivated after 3 unpaid deliveries.
          </div>
        )}
        
        {/* Payment stats */}
        <div className="row g-3 mb-4">
          <div className="col-6">
            <div className="p-3 border rounded text-center">
              <h6 className="mb-1">Pending</h6>
              <span className="d-block fs-4">{pendingPayments}</span>
            </div>
          </div>
          <div className="col-6">
            <div className="p-3 border rounded text-center">
              <h6 className="mb-1">Unpaid</h6>
              <span className="d-block fs-4">{unpaidCount}</span>
            </div>
          </div>
        </div>
        
        {/* Recent payments */}
        <h6 className="mb-3">Recent Payments</h6>
        {recentPayments.length === 0 ? (
          <p className="text-muted">No recent payment activity.</p>
        ) : (
          <div className="list-group">
            {recentPayments.map(payment => (
              <div key={payment.id} className="list-group-item list-group-item-action">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">Order #{payment.order?.trackingNumber}</h6>
                    <small className="text-muted">
                      {new Date(payment.createdAt).toLocaleDateString()} - ${payment.amount.toFixed(2)}
                    </small>
                  </div>
                  <div>
                    {getStatusBadge(payment.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
      <Card.Footer className="bg-white py-3 border-top">
        <div className="d-grid">
          {unpaidCount > 0 ? (
            <Link href="/dashboard/payments/unpaid" passHref>
              <Button variant="primary">
                <FaMoneyBill className="me-2" />
                Pay Commission Fees
              </Button>
            </Link>
          ) : (
            <div className="text-success d-flex align-items-center justify-content-center">
              <FaCheck className="me-2" />
              All commissions up to date
            </div>
          )}
        </div>
      </Card.Footer>
    </Card>
  );
} 