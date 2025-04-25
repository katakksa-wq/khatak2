'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { usePayments } from '@/hooks/usePayments';
import { FaMoneyBill, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { Card, Container, Row, Col, Alert, Accordion, Button } from 'react-bootstrap';
import DashboardLayout from '@/components/layouts/DashboardLayout';

// Import the payment form component
const DriverPaymentForm = ({ order, onPaymentComplete }: { order: any; onPaymentComplete: () => void }) => {
  // This is a placeholder - in a real implementation, this would be a fully featured payment form
  const { submitPayment } = usePayments();
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await submitPayment(order.id, {
        paymentMethod,
        paymentReference: reference,
      });
      
      onPaymentComplete();
    } catch (error) {
      console.error('Payment submission failed:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Card className="mb-3">
      <Card.Header>
        <h5 className="mb-0">Submit Payment</h5>
      </Card.Header>
      <Card.Body>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Payment Method</label>
            <select 
              className="form-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
            >
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
            </select>
          </div>
          
          <div className="mb-3">
            <label className="form-label">Reference / Receipt Number</label>
            <input
              type="text"
              className="form-control"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Enter payment reference"
              required
            />
            <div className="form-text">
              For bank transfers, use your transfer reference. For cash, provide your receipt number.
            </div>
          </div>
          
          <div className="d-grid">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Processing...
                </>
              ) : (
                <>Submit Payment of £{order.commissionAmount.toFixed(2)}</>
              )}
            </button>
          </div>
        </form>
      </Card.Body>
    </Card>
  );
};

export default function UnpaidOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { payments, loading: paymentsLoading, unpaidOrders, fetchUnpaidOrders } = usePayments();
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  
  useEffect(() => {
    if (user?.role !== 'DRIVER') {
      return;
    }
    
    fetchUnpaidOrders();
  }, [user, fetchUnpaidOrders]);
  
  useEffect(() => {
    if (unpaidOrders) {
      // Filter orders that need payment
      const filteredOrders = unpaidOrders.filter(order => 
        order.status === 'DELIVERED' && 
        !order.commissionPaid
      );
      setOrders(filteredOrders);
    }
  }, [unpaidOrders]);
  
  const handlePaymentComplete = () => {
    fetchUnpaidOrders();
    setActiveOrderId(null);
  };
  
  if (!user) {
    return null; // Handled by layout
  }
  
  if (user.role !== 'DRIVER') {
    return (
      <DashboardLayout>
        <Container className="py-4">
          <Alert variant="warning">
            This page is only accessible to drivers.
          </Alert>
        </Container>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <Container>
        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="h4 mb-0">Unpaid Commissions</h2>
              <Link href="/dashboard/payments" passHref>
                <Button variant="outline-secondary" size="sm">
                  <FaArrowLeft className="me-1" /> Back to Payment History
                </Button>
              </Link>
            </div>
          </Card.Header>
          <Card.Body>
            {paymentsLoading ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading your unpaid orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center p-5">
                <div className="display-1 text-success">
                  <FaMoneyBill />
                </div>
                <h3 className="mt-3">All Payments Up to Date!</h3>
                <p className="text-muted">You have no outstanding commission payments.</p>
              </div>
            ) : (
              <>
                <Alert variant="warning" className="d-flex align-items-center">
                  <FaExclamationTriangle className="me-2" size={20} />
                  <div>
                    You have <strong>{orders.length}</strong> order{orders.length !== 1 ? 's' : ''} with unpaid commission. 
                    Please submit payment to avoid account restrictions.
                  </div>
                </Alert>
                
                <div className="mt-4">
                  <h5>Select an order to make payment:</h5>
                  {orders.map(order => (
                    <Card key={order.id} className="mb-3 shadow-sm">
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Order #{order.trackingNumber}</h6>
                        <span className="badge bg-danger">Commission Due</span>
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={6}>
                            <p><strong>Delivery Date:</strong> {new Date(order.actualDeliveryTime).toLocaleDateString()}</p>
                            <p><strong>Customer:</strong> {order.customer?.name || 'N/A'}</p>
                            <p><strong>Delivery Address:</strong> {order.deliveryAddress || 'N/A'}</p>
                          </Col>
                          <Col md={6}>
                            <p><strong>Order Total:</strong> £{order.totalAmount?.toFixed(2) || '0.00'}</p>
                            <p><strong>Commission Due:</strong> <span className="text-danger fw-bold">£{order.commissionAmount?.toFixed(2) || '0.00'}</span></p>
                            <p><strong>Due Date:</strong> {new Date(order.commissionDueDate).toLocaleDateString()}</p>
                          </Col>
                        </Row>
                        <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                          <Button
                            variant={activeOrderId === order.id ? "outline-primary" : "primary"}
                            onClick={() => setActiveOrderId(activeOrderId === order.id ? null : order.id)}
                          >
                            {activeOrderId === order.id ? 'Cancel' : 'Make Payment'}
                          </Button>
                        </div>
                      </Card.Body>
                      {activeOrderId === order.id && (
                        <Card.Footer className="bg-light">
                          <DriverPaymentForm 
                            order={order} 
                            onPaymentComplete={handlePaymentComplete} 
                          />
                        </Card.Footer>
                      )}
                    </Card>
                  ))}
                </div>
              </>
            )}
          </Card.Body>
        </Card>
        
        <Card className="shadow-sm">
          <Card.Header className="bg-white">
            <h3 className="h5 mb-0">Frequently Asked Questions</h3>
          </Card.Header>
          <Card.Body>
            <Accordion>
              <Accordion.Item eventKey="0">
                <Accordion.Header>Why do I need to pay commission?</Accordion.Header>
                <Accordion.Body>
                  As an independent driver partner, you are required to pay a commission fee for each completed delivery. 
                  This commission helps cover the platform costs, insurance, and customer service support that we provide.
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="1">
                <Accordion.Header>How long does payment confirmation take?</Accordion.Header>
                <Accordion.Body>
                  Bank transfer payments typically take 1-2 business days to be confirmed after submission. 
                  Cash payments may be confirmed more quickly, usually within 24 hours. You'll receive a notification
                  once your payment has been processed.
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="2">
                <Accordion.Header>What happens if my payment is rejected?</Accordion.Header>
                <Accordion.Body>
                  If your payment is rejected, you'll be notified with the reason. Common reasons include incorrect 
                  reference numbers or insufficient funds. You'll need to submit a new payment with the correct information.
                  Repeated failed payments may result in temporary account restrictions.
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Card.Body>
        </Card>
      </Container>
    </DashboardLayout>
  );
} 