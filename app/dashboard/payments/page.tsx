'use client';

import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Modal, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '@/contexts/AuthContext';
import { usePayments } from '@/hooks/usePayments';
import { format } from 'date-fns';
import { FaEye } from 'react-icons/fa';
import PaymentReceipt from '@/components/payments/PaymentReceipt';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function DriverPaymentHistory() {
  const { user } = useAuth();
  const { payments, loading, refreshData } = usePayments();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleViewReceipt = (payment: any) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge bg="warning">Pending</Badge>;
      case 'CONFIRMED':
        return <Badge bg="success">Confirmed</Badge>;
      case 'REJECTED':
        return <Badge bg="danger">Rejected</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <Container className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0">Payment History</h1>
        </div>

        <Card className="border-0 shadow-sm">
          <Card.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading payment history...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-5">
                <h5>No Payment History</h5>
                <p className="text-muted">You don't have any payment records yet.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Order #</th>
                      <th>Amount</th>
                      <th>Payment Method</th>
                      <th>Reference</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{format(new Date(payment.createdAt), 'MMM d, yyyy')}</td>
                        <td>{payment.order?.trackingNumber || payment.orderId?.substring(0, 8)}</td>
                        <td>£{payment.amount.toFixed(2)}</td>
                        <td>{payment.paymentMethod}</td>
                        <td>{payment.paymentReference}</td>
                        <td>{renderStatusBadge(payment.status)}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewReceipt(payment)}
                            className="me-2"
                          >
                            <FaEye className="me-1" /> View Receipt
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Receipt Modal */}
        <Modal show={showReceiptModal} onHide={() => setShowReceiptModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Payment Receipt</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedPayment && (
              <PaymentReceipt
                payment={selectedPayment}
                onClose={() => setShowReceiptModal(false)}
              />
            )}
          </Modal.Body>
        </Modal>
      </Container>
    </DashboardLayout>
  );
} 