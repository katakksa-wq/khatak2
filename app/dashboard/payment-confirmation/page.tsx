'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePayments } from '@/hooks/usePayments';
import { FaCreditCard, FaMoneyBillWave, FaCheck, FaTimes, FaFileInvoiceDollar, FaUniversity } from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

export default function PaymentConfirmation() {
  const router = useRouter();
  const { user, isDriver } = useAuth();
  const { payments, bankAccounts, loading, refreshData } = usePayments();
  const [error, setError] = useState<string | null>(null);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);
  
  // Filter payments to only show those that need confirmation by the driver
  const pendingPayments = payments.filter(payment => {
    console.log('Filtering payment:', {
      id: payment.id,
      status: payment.status,
      orderStatus: payment.order?.status,
      driverId: payment.driverId,
      userId: user?.id,
      driverConfirmed: payment.driverConfirmed,
      matches: {
        isPending: payment.status === 'PENDING',
        isDriverMatch: payment.driverId === user?.id,
        needsConfirmation: !payment.driverConfirmed
      }
    });
    
    // Only show payments that:
    // 1. Belong to the current driver
    // 2. Have not been confirmed by the driver yet
    return payment.driverId === user?.id && !payment.driverConfirmed;
  });
  
  useEffect(() => {
    // Only drivers can access this page
    if (user && !isDriver()) {
      router.push('/dashboard');
      return;
    }
    
    // Refresh data on mount and when user changes
    refreshData();
  }, [user, isDriver, router, refreshData]);
  
  const handleConfirmPayment = async (paymentId: string) => {
    setProcessingPaymentId(paymentId);
    setError(null);
    
    try {
      // In reality, drivers can't directly confirm their own payments, that's an admin function
      // This would need to be a special API endpoint for drivers if this functionality is needed
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http:api.kataakksa.com:5000'}/api/payments/driver-confirm/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'CONFIRMED'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to confirm payment');
      }
      
      toast.success('Payment confirmed successfully!');
      refreshData(); // Refresh the payments list
    } catch (err: any) {
      console.error('Error confirming payment:', err);
      setError(err.message || 'Failed to confirm payment. Please try again.');
      toast.error(err.message || 'Failed to confirm payment');
    } finally {
      setProcessingPaymentId(null);
    }
  };
  
  const handleReportIssue = async (paymentId: string) => {
    setProcessingPaymentId(paymentId);
    setError(null);
    
    try {
      // In reality, drivers can't directly reject their own payments, that's an admin function
      // This would need to be a special API endpoint for drivers if this functionality is needed
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://api.kataakksa.com:5000'}/api/payments/driver-report/${paymentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          issueDetails: 'Reported as issue by driver'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to report payment issue');
      }
      
      toast.info('Payment issue reported to admin');
      refreshData(); // Refresh the payments list
    } catch (err: any) {
      console.error('Error reporting payment issue:', err);
      setError(err.message || 'Failed to report issue. Please try again.');
      toast.error(err.message || 'Failed to report payment issue');
    } finally {
      setProcessingPaymentId(null);
    }
  };
  
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Payment Confirmation</h1>
      </div>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {/* Bank Accounts Section */}
      <div className="mb-4">
        <h2 className="h4 mb-3">Payment Bank Accounts</h2>
        {loading ? (
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : bankAccounts.length === 0 ? (
          <div className="alert alert-info">
            No bank accounts available. Please contact admin.
          </div>
        ) : (
          <div className="row">
            {bankAccounts.map(account => (
              <div className="col-md-6 mb-3" key={account.id}>
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <FaUniversity className="text-primary me-2" size={20} />
                      <h5 className="card-title mb-0">{account.bankName}</h5>
                    </div>
                    <p className="card-text mb-1">
                      <strong>Account Name:</strong> {account.accountName}
                    </p>
                    <p className="card-text mb-1">
                      <strong>Account Number:</strong> {account.accountNumber}
                    </p>
                    {account.sortCode && (
                      <p className="card-text mb-1">
                        <strong>Sort Code:</strong> {account.sortCode}
                      </p>
                    )}
                    {account.description && (
                      <p className="card-text text-muted mt-2 small">
                        {account.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <h2 className="h4 mb-3">Pending Payments</h2>
      
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading payments...</p>
        </div>
      ) : pendingPayments.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body py-5 text-center">
            <FaFileInvoiceDollar size={48} className="text-muted mb-3" />
            <h5>No Pending Payments</h5>
            <p className="text-muted">There are currently no payments that need confirmation.</p>
          </div>
        </div>
      ) : (
        <div className="row">
          {pendingPayments.map(payment => (
            <div className="col-lg-6 mb-4" key={payment.id}>
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Order #{payment.order.trackingNumber || payment.order.id.substring(0, 8)}</h5>
                  <span className="badge bg-primary">${payment.amount.toFixed(2)}</span>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <p className="text-muted mb-1">Payment Method</p>
                      <p className="fw-bold mb-0">{payment.paymentMethod}</p>
                    </div>
                    <div className="col-md-6">
                      <p className="text-muted mb-1">Date</p>
                      <p className="fw-bold mb-0">
                        {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-muted mb-1">Reference</p>
                    <div className="d-flex align-items-center">
                      {payment.paymentMethod === 'CASH' ? (
                        <>
                          <FaMoneyBillWave className="text-success me-2" />
                          <span>Receipt: {payment.paymentReference}</span>
                        </>
                      ) : (
                        <>
                          <FaCreditCard className="text-primary me-2" />
                          <span>Ref: {payment.paymentReference}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="alert alert-info" role="alert">
                    <small>
                      Please confirm this payment was processed correctly or report an issue if there's a problem.
                    </small>
                  </div>
                </div>
                <div className="card-footer bg-white d-flex justify-content-between">
                  <button 
                    className="btn btn-outline-danger" 
                    onClick={() => handleReportIssue(payment.id)}
                    disabled={!!processingPaymentId}
                  >
                    <FaTimes className="me-2" /> Report Issue
                  </button>
                  <button 
                    className="btn btn-success" 
                    onClick={() => handleConfirmPayment(payment.id)}
                    disabled={processingPaymentId === payment.id}
                  >
                    {processingPaymentId === payment.id ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : (
                      <FaCheck className="me-2" />
                    )}
                    {processingPaymentId === payment.id ? 'Processing...' : 'Confirm Payment'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 