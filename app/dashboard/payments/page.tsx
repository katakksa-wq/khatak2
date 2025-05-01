'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePayments } from '@/hooks/usePayments';
import { format } from 'date-fns';
import { FaEye } from 'react-icons/fa';
import PaymentReceipt from '@/components/payments/PaymentReceipt';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DriverPaymentHistory() {
  const { user } = useAuth();
  const { payments, loading, refreshData } = usePayments();
  const { t } = useLanguage();
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
        return <span className="badge bg-warning">{t('admin.payments.pending')}</span>;
      case 'CONFIRMED':
        return <span className="badge bg-success">{t('admin.payments.confirmed')}</span>;
      case 'REJECTED':
        return <span className="badge bg-danger">{t('admin.payments.rejected')}</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">{t('payment.history')}</h1>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('loading.message')}</span>
              </div>
              <p className="mt-3 text-muted">{t('payment.history.loading')}</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-5">
              <h5>{t('payment.history.noHistory')}</h5>
              <p className="text-muted">{t('payment.history.noRecords')}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>{t('admin.payments.date')}</th>
                    <th>{t('admin.orderNumber')}</th>
                    <th>{t('admin.payments.amount')}</th>
                    <th>{t('payment.confirmation.method')}</th>
                    <th>{t('payment.confirmation.reference')}</th>
                    <th>{t('admin.payments.status')}</th>
                    <th>{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{format(new Date(payment.createdAt), 'MMM d, yyyy')}</td>
                      <td>{payment.order?.trackingNumber || payment.orderId?.substring(0, 8)}</td>
                      <td>${payment.amount.toFixed(2)}</td>
                      <td>{payment.paymentMethod}</td>
                      <td>{payment.paymentReference}</td>
                      <td>{renderStatusBadge(payment.status)}</td>
                      <td>
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => handleViewReceipt(payment)}
                        >
                          <FaEye className="me-1" /> {t('payment.history.viewReceipt')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('admin.payments.paymentReceipt')}</h5>
                <button type="button" className="btn-close" onClick={() => setShowReceiptModal(false)}></button>
              </div>
              <div className="modal-body">
                {selectedPayment && (
                  <PaymentReceipt
                    payment={selectedPayment}
                    onClose={() => setShowReceiptModal(false)}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => setShowReceiptModal(false)}></div>
        </div>
      )}
    </div>
  );
} 