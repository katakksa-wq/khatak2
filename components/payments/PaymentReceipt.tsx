import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { format } from 'date-fns';

interface PaymentReceiptProps {
  payment: any;
  onClose?: () => void;
}

const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ payment, onClose }) => {
  const handleDownload = () => {
    const receiptContent = `
      Payment Receipt
      ==============
      
      Receipt Number: ${payment.id}
      Date: ${format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm')}
      
      Order Details:
      -------------
      Order ID: ${payment.order?.id || 'N/A'}
      Tracking Number: ${payment.order?.trackingNumber || 'N/A'}
      
      Payment Information:
      ------------------
      Amount: ${payment.amount.toFixed(2)} ريال سعودي
      Payment Method: ${payment.paymentMethod}
      Reference: ${payment.paymentReference}
      Status: ${payment.status}
      
      Driver Information:
      -----------------
      Name: ${payment.driver?.name || 'N/A'}
      Email: ${payment.driver?.email || 'N/A'}
      Phone: ${payment.driver?.phone || 'N/A'}
      
      Notes:
      ------
      ${payment.notes || 'No additional notes'}
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment_receipt_${payment.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="receipt-card">
      <Card.Body>
        <div className="text-center mb-4">
          <h4>Payment Receipt</h4>
          <p className="text-muted">Receipt Number: {payment.id}</p>
        </div>

        <Row className="mb-3">
          <Col>
            <strong>Date:</strong> {format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm')}
          </Col>
        </Row>

        <div className="receipt-section mb-3">
          <h5>Order Details</h5>
          <Row>
            <Col>
              <strong>Order ID:</strong> {payment.order?.id || 'N/A'}
            </Col>
            <Col>
              <strong>Tracking Number:</strong> {payment.order?.trackingNumber || 'N/A'}
            </Col>
          </Row>
        </div>

        <div className="receipt-section mb-3">
          <h5>Payment Information</h5>
          <Row>
            <Col>
              <strong>Amount:</strong> {payment.amount.toFixed(2)} ريال سعودي
            </Col>
            <Col>
              <strong>Payment Method:</strong> {payment.paymentMethod}
            </Col>
          </Row>
          <Row className="mt-2">
            <Col>
              <strong>Reference:</strong> {payment.paymentReference}
            </Col>
            <Col>
              <strong>Status:</strong> {payment.status}
            </Col>
          </Row>
        </div>

        <div className="receipt-section mb-3">
          <h5>Driver Information</h5>
          <Row>
            <Col>
              <strong>Name:</strong> {payment.driver?.name || 'N/A'}
            </Col>
            <Col>
              <strong>Email:</strong> {payment.driver?.email || 'N/A'}
            </Col>
          </Row>
          <Row className="mt-2">
            <Col>
              <strong>Phone:</strong> {payment.driver?.phone || 'N/A'}
            </Col>
          </Row>
        </div>

        {payment.notes && (
          <div className="receipt-section mb-3">
            <h5>Notes</h5>
            <p>{payment.notes}</p>
          </div>
        )}

        <div className="d-flex justify-content-between mt-4">
          {onClose && (
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          )}
          <button className="btn btn-primary" onClick={handleDownload}>
            Download Receipt
          </button>
        </div>
      </Card.Body>

      <style jsx>{`
        .receipt-card {
          max-width: 600px;
          margin: 0 auto;
          border: 1px solid #ddd;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .receipt-section {
          border-top: 1px solid #eee;
          padding-top: 1rem;
        }
        .receipt-section h5 {
          color: #333;
          margin-bottom: 1rem;
        }
      `}</style>
    </Card>
  );
};

export default PaymentReceipt; 