'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import paymentService, { DriverPayment } from '@/services/paymentService';
import { FaCheck, FaTimes, FaEye, FaMoneyBill, FaCalendarAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function PaymentManagement() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<DriverPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalPayment, setModalPayment] = useState<DriverPayment | null>(null);
  const [confirmationNotes, setConfirmationNotes] = useState('');
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getPayments();
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleConfirmPayment = async (paymentId: string, status: 'CONFIRMED' | 'REJECTED') => {
    try {
      setProcessingPaymentId(paymentId);
      await paymentService.confirmPayment(paymentId, {
        status,
        notes: confirmationNotes
      });
      
      toast.success(`Payment ${status.toLowerCase()} successfully`);
      fetchPayments();
      closeModal();
    } catch (error) {
      console.error(`Error ${status.toLowerCase()} payment:`, error);
      toast.error(`Failed to ${status.toLowerCase()} payment`);
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const openModal = (payment: DriverPayment) => {
    setModalPayment(payment);
    setConfirmationNotes('');
  };

  const closeModal = () => {
    setModalPayment(null);
    setConfirmationNotes('');
  };

  // Format date string to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Only admins can manage payments
  if (user?.role !== 'ADMIN') {
    return (
      <div className="alert alert-warning">
        <p className="mb-0">Only admins can manage commission payments</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow border-0">
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Driver Commission Payments</h5>
        <button 
          className="btn btn-sm btn-outline-primary" 
          onClick={() => fetchPayments()}
        >
          Refresh
        </button>
      </div>
      <div className="card-body">
        {payments.length === 0 ? (
          <div className="alert alert-info">
            <p className="mb-0">No payment submissions found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Driver</th>
                  <th>Order ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaCalendarAlt className="text-secondary me-2" />
                        <span>{formatDate(payment.createdAt)}</span>
                      </div>
                    </td>
                    <td>{payment.driver.firstName} {payment.driver.lastName}</td>
                    <td>
                      <span className="badge bg-light text-dark">
                        {payment.order.trackingNumber}
                      </span>
                    </td>
                    <td className={payment.status === 'PENDING' ? 'text-warning' : (payment.status === 'CONFIRMED' ? 'text-success' : 'text-danger')}>
                      <span className="fw-bold">{payment.amount.toFixed(2)} ريال سعودي</span>
                    </td>
                    <td>
                      <span className="text-capitalize">
                        {payment.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className="text-truncate d-inline-block" style={{ maxWidth: '150px' }}>
                        {payment.paymentReference}
                      </span>
                    </td>
                    <td>
                      {payment.status === 'PENDING' && (
                        <span className="badge bg-warning">Pending</span>
                      )}
                      {payment.status === 'CONFIRMED' && (
                        <span className="badge bg-success">Confirmed</span>
                      )}
                      {payment.status === 'REJECTED' && (
                        <span className="badge bg-danger">Rejected</span>
                      )}
                    </td>
                    <td>
                      {payment.status === 'PENDING' ? (
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openModal(payment)}
                        >
                          <FaEye /> Review
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openModal(payment)}
                        >
                          <FaEye /> Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Review Modal */}
      {modalPayment && (
        <div className="modal show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalPayment.status === 'PENDING' ? 'Review Payment' : 'Payment Details'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h6>Payment Information</h6>
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Amount:</span>
                        <span className="fw-bold">{modalPayment.amount.toFixed(2)} ريال سعودي</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Method:</span>
                        <span className="text-capitalize">{modalPayment.paymentMethod.replace('_', ' ')}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Reference:</span>
                        <span>{modalPayment.paymentReference}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Status:</span>
                        <span>
                          {modalPayment.status === 'PENDING' && (
                            <span className="badge bg-warning">Pending</span>
                          )}
                          {modalPayment.status === 'CONFIRMED' && (
                            <span className="badge bg-success">Confirmed</span>
                          )}
                          {modalPayment.status === 'REJECTED' && (
                            <span className="badge bg-danger">Rejected</span>
                          )}
                        </span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Date:</span>
                        <span>{formatDate(modalPayment.createdAt)}</span>
                      </li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h6>Order & Driver Information</h6>
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Order ID:</span>
                        <span>{modalPayment.order.trackingNumber}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Driver:</span>
                        <span>{modalPayment.driver.firstName} {modalPayment.driver.lastName}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Driver Email:</span>
                        <span>{modalPayment.driver.email}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Driver Phone:</span>
                        <span>{modalPayment.driver.phone || 'N/A'}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {modalPayment.paymentScreenshot && (
                  <div className="mb-4">
                    <h6>Payment Screenshot</h6>
                    <div className="text-center p-3 border rounded">
                      <a href={modalPayment.paymentScreenshot} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                        View Screenshot
                      </a>
                    </div>
                  </div>
                )}

                {modalPayment.notes && (
                  <div className="mb-4">
                    <h6>Notes</h6>
                    <div className="p-3 bg-light rounded">
                      {modalPayment.notes}
                    </div>
                  </div>
                )}

                {modalPayment.status === 'PENDING' && (
                  <div className="mb-3">
                    <label htmlFor="notes" className="form-label">Admin Notes (optional)</label>
                    <textarea
                      className="form-control"
                      id="notes"
                      rows={3}
                      value={confirmationNotes}
                      onChange={(e) => setConfirmationNotes(e.target.value)}
                      placeholder="Add notes about this payment (will be visible to the driver)"
                    ></textarea>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Close
                </button>
                
                {modalPayment.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleConfirmPayment(modalPayment.id, 'REJECTED')}
                      disabled={processingPaymentId === modalPayment.id}
                    >
                      {processingPaymentId === modalPayment.id ? (
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      ) : (
                        <FaTimes className="me-2" />
                      )}
                      Reject Payment
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => handleConfirmPayment(modalPayment.id, 'CONFIRMED')}
                      disabled={processingPaymentId === modalPayment.id}
                    >
                      {processingPaymentId === modalPayment.id ? (
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      ) : (
                        <FaCheck className="me-2" />
                      )}
                      Confirm Payment
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}