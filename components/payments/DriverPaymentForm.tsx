'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import paymentService, { AdminBankAccount, CommissionData } from '@/services/paymentService';
import { FaCreditCard, FaDollarSign, FaMoneyBill, FaClipboardCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';

interface DriverPaymentFormProps {
  orderId: string;
  onPaymentComplete?: () => void;
}

export default function DriverPaymentForm({ orderId, onPaymentComplete }: DriverPaymentFormProps) {
  const { user } = useAuth();
  const [bankAccounts, setBankAccounts] = useState<AdminBankAccount[]>([]);
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [accountsResponse, commissionResponse] = await Promise.all([
        paymentService.getBankAccounts(),
        paymentService.getOrderCommission(orderId)
      ]);
      
      setBankAccounts(accountsResponse.filter(account => account.isActive));
      setCommissionData(commissionResponse);
      
      if (accountsResponse.length > 0) {
        setSelectedBankAccount(accountsResponse[0].id);
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentMethod || !paymentReference) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const paymentData = {
        paymentMethod,
        paymentReference,
        paymentScreenshot: paymentScreenshot || undefined,
      };
      
      await paymentService.submitPayment(orderId, paymentData);
      toast.success('Payment submitted successfully');
      
      if (onPaymentComplete) {
        onPaymentComplete();
      }
      
      // Reset form and refresh data
      setPaymentMethod('bank_transfer');
      setPaymentReference('');
      setPaymentScreenshot('');
      fetchData();
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error('Failed to submit payment');
    } finally {
      setSubmitting(false);
    }
  };

  // Only drivers can make payments
  if (user?.role !== 'DRIVER') {
    return (
      <div className="alert alert-warning">
        <p className="mb-0">Only drivers can make commission payments</p>
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

  if (!commissionData) {
    return (
      <div className="alert alert-danger">
        <p className="mb-0">Failed to load commission data for this order</p>
      </div>
    );
  }

  // If payment is already confirmed
  if (commissionData.order.commissionPaid) {
    return (
      <div className="alert alert-success">
        <FaClipboardCheck className="me-2" size={20} />
        <span>Commission payment for this order has been confirmed.</span>
      </div>
    );
  }

  // If payment is pending confirmation
  if (commissionData.paymentStatus === 'PENDING' && commissionData.payment) {
    return (
      <div className="alert alert-info">
        <div className="d-flex align-items-center">
          <FaClipboardCheck className="me-3" size={24} />
          <div>
            <h5 className="mb-1">Payment Submitted</h5>
            <p className="mb-0">Your payment is pending confirmation by admin. Reference: {commissionData.payment.paymentReference}</p>
          </div>
        </div>
      </div>
    );
  }

  // If payment failed and needs to be resubmitted
  if (commissionData.paymentStatus === 'FAILED' && commissionData.payment) {
    return (
      <div className="alert alert-danger mb-4">
        <h5>Payment Failed</h5>
        <p>Your previous payment submission was rejected. Reason: {commissionData.payment.notes || 'Not specified'}</p>
        <p>Please resubmit your payment.</p>
        {renderPaymentForm()}
      </div>
    );
  }

  return renderPaymentForm();

  function renderPaymentForm() {
    return (
      <div className="card shadow border-0">
        <div className="card-header bg-white py-3">
          <h5 className="mb-0">Commission Payment</h5>
        </div>
        <div className="card-body">
          {/* Payment summary */}
          <div className="alert alert-info mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-1">Order #{commissionData.order.trackingNumber}</h6>
                <p className="mb-0">Commission Rate: {commissionData.commissionRate}%</p>
              </div>
              <div className="text-end">
                <h5 className="mb-0">${commissionData.commissionAmount.toFixed(2)}</h5>
                <small className="text-muted">Amount due</small>
              </div>
            </div>
          </div>
          
          {/* Bank accounts */}
          {bankAccounts.length === 0 ? (
            <div className="alert alert-warning">
              <p className="mb-0">No active bank accounts found for payment. Please contact admin.</p>
            </div>
          ) : (
            <div className="mb-4">
              <h6>Select Bank Account</h6>
              <div className="list-group">
                {bankAccounts.map((account) => (
                  <div
                    key={account.id}
                    className={`list-group-item list-group-item-action ${selectedBankAccount === account.id ? 'active' : ''}`}
                    onClick={() => setSelectedBankAccount(account.id)}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">{account.bankName}</h6>
                        <p className="mb-0">Account: {account.accountName}</p>
                        <p className="mb-0">Number: {account.accountNumber}</p>
                        {account.sortCode && <p className="mb-0">Sort Code: {account.sortCode}</p>}
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="bankAccount"
                          checked={selectedBankAccount === account.id}
                          onChange={() => setSelectedBankAccount(account.id)}
                        />
                      </div>
                    </div>
                    {account.description && (
                      <div className="mt-2 small text-muted">
                        {account.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Payment form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="paymentMethod" className="form-label">Payment Method *</label>
              <select
                className="form-select"
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                required
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash_deposit">Cash Deposit</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="mb-3">
              <label htmlFor="paymentReference" className="form-label">Payment Reference/Transaction ID *</label>
              <input
                type="text"
                className="form-control"
                id="paymentReference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g., Transaction ID, receipt number"
                required
              />
              <div className="form-text">
                Enter the reference number or transaction ID from your payment receipt.
              </div>
            </div>
            
            <div className="mb-3">
              <label htmlFor="paymentScreenshot" className="form-label">Payment Screenshot (URL)</label>
              <input
                type="text"
                className="form-control"
                id="paymentScreenshot"
                value={paymentScreenshot}
                onChange={(e) => setPaymentScreenshot(e.target.value)}
                placeholder="Enter URL to payment screenshot or receipt"
              />
              <div className="form-text">
                Optional: Provide a link to an image of your payment receipt.
              </div>
            </div>
            
            <div className="alert alert-warning mb-4">
              <h6>Important Notes:</h6>
              <ul className="mb-0">
                <li>Please ensure you transfer exactly ${commissionData.commissionAmount.toFixed(2)}</li>
                <li>Include the order number ({commissionData.order.trackingNumber}) in the payment reference</li>
                <li>Your account will be deactivated after 3 unpaid commissions</li>
              </ul>
            </div>
            
            <div className="d-grid">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || bankAccounts.length === 0}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaDollarSign className="me-2" /> Submit Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
} 