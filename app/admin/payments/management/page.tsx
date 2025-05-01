'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePayments } from '@/hooks/usePayments';
import { Table, Card, Badge, Button, Tabs, Tab, Form, Modal, Spinner, Alert } from 'react-bootstrap';
import { 
  FaCheck, 
  FaTimes, 
  FaExclamationTriangle, 
  FaMoneyBill, 
  FaInfoCircle, 
  FaPlus, 
  FaEdit, 
  FaTrash,
  FaEye
} from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { BankAccount } from '@/hooks/usePayments';
import PaymentReceipt from '@/components/payments/PaymentReceipt';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminPaymentManagement() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const { 
    payments, 
    bankAccounts, 
    loading, 
    refreshData, 
    confirmPayment,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount 
  } = usePayments();
  
  // State for tabs
  const [activeTab, setActiveTab] = useState('pending');
  
  // State for payment details modal
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  
  // State for bank account modal
  const [showBankModal, setShowBankModal] = useState(false);
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);
  const [bankFormData, setBankFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    sortCode: '',
    description: '',
    isActive: true
  });
  
  // Filtered payment lists
  const pendingPayments = payments.filter(payment => payment.status === 'PENDING');
  const confirmedPayments = payments.filter(payment => payment.status === 'CONFIRMED');
  const rejectedPayments = payments.filter(payment => payment.status === 'REJECTED');
  const reportedIssues = payments.filter(payment => payment.hasIssue);
  
  // Payment stats
  const totalPending = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalConfirmed = confirmedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalRejected = rejectedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  
  useEffect(() => {
    // Only admins can access this page
    if (user && !isAdmin()) {
      router.push('/dashboard');
      return;
    }
    
    // Refresh data on mount
    refreshData();
  }, [user, isAdmin, router, refreshData]);
  
  // Handle payment details view
  const viewPaymentDetails = (payment: any) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };
  
  // Handle payment confirmation
  const handleConfirmPayment = async (paymentId: string, status: 'CONFIRMED' | 'REJECTED') => {
    setProcessingPaymentId(paymentId);
    
    try {
      let notes: string | undefined = undefined;
      if (status === 'REJECTED') {
        notes = rejectionNote || t('admin.payments.defaultRejectionNote');
      }
      
      const success = await confirmPayment(paymentId, status, notes);
      
      if (success) {
        setShowPaymentModal(false);
        setRejectionNote('');
        refreshData();
      }
    } catch (error) {
      console.error(`Error ${status.toLowerCase()} payment:`, error);
    } finally {
      setProcessingPaymentId(null);
    }
  };
  
  // Bank account form handlers
  const openBankModal = (account: BankAccount | null = null) => {
    if (account) {
      // Edit existing account
      setEditingBankAccount(account);
      setBankFormData({
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        sortCode: account.sortCode || '',
        description: account.description || '',
        isActive: account.isActive
      });
    } else {
      // New account
      setEditingBankAccount(null);
      setBankFormData({
        bankName: '',
        accountNumber: '',
        accountName: '',
        sortCode: '',
        description: '',
        isActive: true
      });
    }
    setShowBankModal(true);
  };
  
  const handleBankFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setBankFormData({
      ...bankFormData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };
  
  const handleBankFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingBankAccount) {
        // Update existing account
        await updateBankAccount(editingBankAccount.id, bankFormData);
      } else {
        // Add new account
        await addBankAccount(bankFormData);
      }
      
      setShowBankModal(false);
      refreshData();
    } catch (error) {
      console.error('Error saving bank account:', error);
      toast.error(t('admin.payments.bankSaveError'));
    }
  };
  
  const handleDeleteBankAccount = async (id: string) => {
    if (window.confirm(t('admin.payments.confirmDeleteBank'))) {
      try {
        await deleteBankAccount(id);
        refreshData();
      } catch (error) {
        console.error('Error deleting bank account:', error);
        toast.error(t('admin.payments.bankDeleteError'));
      }
    }
  };
  
  // Render payment status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge bg="warning">{t('admin.payments.pending')}</Badge>;
      case 'CONFIRMED':
        return <Badge bg="success">{t('admin.payments.confirmed')}</Badge>;
      case 'REJECTED':
        return <Badge bg="danger">{t('admin.payments.rejected')}</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };
  
  if (user && !isAdmin()) {
    return (
      <div className="container py-5">
        <Alert variant="danger">
          <Alert.Heading>{t('admin.accessDenied')}</Alert.Heading>
          <p>{t('admin.noPermission')}</p>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">{t('admin.payments.management')}</h1>
      </div>
      
      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-primary p-3 me-3">
                <FaMoneyBill className="text-white" size={24} />
              </div>
              <div>
                <h6 className="text-muted mb-1">{t('admin.payments.totalPending')}</h6>
                <h3 className="mb-0">${totalPending.toFixed(2)}</h3>
                <small className="text-muted">{pendingPayments.length} {t('admin.payments.payments')}</small>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3 mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-success p-3 me-3">
                <FaCheck className="text-white" size={24} />
              </div>
              <div>
                <h6 className="text-muted mb-1">{t('admin.payments.totalConfirmed')}</h6>
                <h3 className="mb-0">${totalConfirmed.toFixed(2)}</h3>
                <small className="text-muted">{confirmedPayments.length} {t('admin.payments.payments')}</small>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3 mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-danger p-3 me-3">
                <FaTimes className="text-white" size={24} />
              </div>
              <div>
                <h6 className="text-muted mb-1">{t('admin.payments.totalRejected')}</h6>
                <h3 className="mb-0">${totalRejected.toFixed(2)}</h3>
                <small className="text-muted">{rejectedPayments.length} {t('admin.payments.payments')}</small>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3 mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-warning p-3 me-3">
                <FaExclamationTriangle className="text-white" size={24} />
              </div>
              <div>
                <h6 className="text-muted mb-1">{t('admin.payments.reportedIssues')}</h6>
                <h3 className="mb-0">{reportedIssues.length}</h3>
                <small className="text-muted">{t('admin.payments.requiresAttention')}</small>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
      
      {/* Control Panel */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Button 
            variant="primary" 
            className="mb-3"
            onClick={() => refreshData()}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {t('button.loading')}
              </>
            ) : (
              <>
                <FaPlus className="me-2" />
                {t('admin.refresh')}
              </>
            )}
          </Button>
          
          <Button
            variant="success"
            className="ms-2 mb-3"
            onClick={() => openBankModal()}
          >
            <FaPlus className="me-2" />
            {t('admin.payments.addBankAccount')}
          </Button>
        </Card.Body>
      </Card>
      
      {/* Tabs for different payment statuses */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => k && setActiveTab(k)}
            className="mb-0"
          >
            <Tab 
              eventKey="pending" 
              title={`${t('admin.payments.pending')} (${pendingPayments.length})`}
            >
              <div className="p-3">
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">{t('button.loading')}</span>
                    </Spinner>
                  </div>
                ) : pendingPayments.length === 0 ? (
                  <Alert variant="info">
                    {t('admin.payments.noPendingPayments')}
                  </Alert>
                ) : (
                  <Table responsive hover className="mb-0">
                    <thead>
                      <tr>
                        <th>{t('admin.payments.paymentId')}</th>
                        <th>{t('admin.payments.driver')}</th>
                        <th>{t('admin.payments.amount')}</th>
                        <th>{t('admin.payments.date')}</th>
                        <th>{t('admin.payments.bankAccount')}</th>
                        <th>{t('admin.payments.status')}</th>
                        <th>{t('admin.payments.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPayments.map(payment => (
                        <tr key={payment.id}>
                          <td>{payment.id.substr(0, 8)}...</td>
                          <td>
                            {payment.driver ? `${payment.driver.firstName} ${payment.driver.lastName}` : t('admin.payments.unknownDriver')}
                          </td>
                          <td className="fw-bold">${payment.amount.toFixed(2)}</td>
                          <td>{format(new Date(payment.createdAt), 'MMM d, yyyy')}</td>
                          <td>
                            {payment.bankAccount ? (
                              <>
                                <span className="d-block">{payment.bankAccount.bankName}</span>
                                <small className="text-muted">{payment.bankAccount.accountNumber}</small>
                              </>
                            ) : (
                              <Badge bg="warning">{t('admin.payments.noBankAccount')}</Badge>
                            )}
                          </td>
                          <td>{renderStatusBadge(payment.status)}</td>
                          <td>
                            <div className="btn-group">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => viewPaymentDetails(payment)}
                              >
                                <FaEye />
                              </Button>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleConfirmPayment(payment.id, 'CONFIRMED')}
                                disabled={processingPaymentId === payment.id}
                              >
                                {processingPaymentId === payment.id ? (
                                  <Spinner animation="border" size="sm" />
                                ) : (
                                  <FaCheck />
                                )}
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => viewPaymentDetails(payment)}
                                disabled={processingPaymentId === payment.id}
                              >
                                <FaTimes />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </Tab>
            <Tab 
              eventKey="confirmed" 
              title={`${t('admin.payments.confirmed')} (${confirmedPayments.length})`}
            >
              <div className="p-3">
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">{t('button.loading')}</span>
                    </Spinner>
                  </div>
                ) : confirmedPayments.length === 0 ? (
                  <Alert variant="info">
                    {t('admin.payments.noConfirmedPayments')}
                  </Alert>
                ) : (
                  <Table responsive hover className="mb-0">
                    <thead>
                      <tr>
                        <th>{t('admin.payments.paymentId')}</th>
                        <th>{t('admin.payments.driver')}</th>
                        <th>{t('admin.payments.amount')}</th>
                        <th>{t('admin.payments.date')}</th>
                        <th>{t('admin.payments.bankAccount')}</th>
                        <th>{t('admin.payments.confirmedBy')}</th>
                        <th>{t('admin.payments.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {confirmedPayments.map(payment => (
                        <tr key={payment.id}>
                          <td>{payment.id.substr(0, 8)}...</td>
                          <td>
                            {payment.driver ? `${payment.driver.firstName} ${payment.driver.lastName}` : t('admin.payments.unknownDriver')}
                          </td>
                          <td className="fw-bold">${payment.amount.toFixed(2)}</td>
                          <td>{format(new Date(payment.createdAt), 'MMM d, yyyy')}</td>
                          <td>
                            {payment.bankAccount ? (
                              <>
                                <span className="d-block">{payment.bankAccount.bankName}</span>
                                <small className="text-muted">{payment.bankAccount.accountNumber}</small>
                              </>
                            ) : (
                              <Badge bg="warning">{t('admin.payments.noBankAccount')}</Badge>
                            )}
                          </td>
                          <td>
                            {payment.confirmedBy ? payment.confirmedBy.name : t('admin.system')}
                          </td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => viewPaymentDetails(payment)}
                            >
                              <FaEye />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </Tab>
            <Tab 
              eventKey="rejected" 
              title={`${t('admin.payments.rejected')} (${rejectedPayments.length})`}
            >
              <div className="p-3">
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">{t('button.loading')}</span>
                    </Spinner>
                  </div>
                ) : rejectedPayments.length === 0 ? (
                  <Alert variant="info">
                    {t('admin.payments.noRejectedPayments')}
                  </Alert>
                ) : (
                  <Table responsive hover className="mb-0">
                    <thead>
                      <tr>
                        <th>{t('admin.payments.paymentId')}</th>
                        <th>{t('admin.payments.driver')}</th>
                        <th>{t('admin.payments.amount')}</th>
                        <th>{t('admin.payments.date')}</th>
                        <th>{t('admin.payments.rejectionReason')}</th>
                        <th>{t('admin.payments.rejectedBy')}</th>
                        <th>{t('admin.payments.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rejectedPayments.map(payment => (
                        <tr key={payment.id}>
                          <td>{payment.id.substr(0, 8)}...</td>
                          <td>
                            {payment.driver ? `${payment.driver.firstName} ${payment.driver.lastName}` : t('admin.payments.unknownDriver')}
                          </td>
                          <td className="fw-bold">${payment.amount.toFixed(2)}</td>
                          <td>{format(new Date(payment.createdAt), 'MMM d, yyyy')}</td>
                          <td>
                            {payment.notes || t('admin.payments.noReasonProvided')}
                          </td>
                          <td>
                            {payment.confirmedBy ? payment.confirmedBy.name : t('admin.system')}
                          </td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => viewPaymentDetails(payment)}
                            >
                              <FaEye />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </Tab>
            <Tab 
              eventKey="issues" 
              title={`${t('admin.payments.issues')} (${reportedIssues.length})`}
            >
              <div className="p-3">
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">{t('button.loading')}</span>
                    </Spinner>
                  </div>
                ) : reportedIssues.length === 0 ? (
                  <Alert variant="info">
                    {t('admin.payments.noReportedIssues')}
                  </Alert>
                ) : (
                  <Table responsive hover className="mb-0">
                    <thead>
                      <tr>
                        <th>{t('admin.payments.paymentId')}</th>
                        <th>{t('admin.payments.driver')}</th>
                        <th>{t('admin.payments.amount')}</th>
                        <th>{t('admin.payments.date')}</th>
                        <th>{t('admin.payments.issue')}</th>
                        <th>{t('admin.payments.status')}</th>
                        <th>{t('admin.payments.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportedIssues.map(payment => (
                        <tr key={payment.id}>
                          <td>{payment.id.substr(0, 8)}...</td>
                          <td>
                            {payment.driver ? `${payment.driver.firstName} ${payment.driver.lastName}` : t('admin.payments.unknownDriver')}
                          </td>
                          <td className="fw-bold">${payment.amount.toFixed(2)}</td>
                          <td>{format(new Date(payment.createdAt), 'MMM d, yyyy')}</td>
                          <td>
                            {payment.issueDescription || t('admin.payments.issueReported')}
                          </td>
                          <td>{renderStatusBadge(payment.status)}</td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => viewPaymentDetails(payment)}
                            >
                              <FaEye />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </Tab>
            <Tab eventKey="bank" title={t('admin.payments.bankAccounts')}>
              <div className="p-3">
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">{t('button.loading')}</span>
                    </Spinner>
                  </div>
                ) : bankAccounts.length === 0 ? (
                  <Alert variant="info">
                    {t('admin.payments.noBankAccounts')}
                  </Alert>
                ) : (
                  <Table responsive hover className="mb-0">
                    <thead>
                      <tr>
                        <th>{t('admin.payments.bankName')}</th>
                        <th>{t('admin.payments.accountName')}</th>
                        <th>{t('admin.payments.accountNumber')}</th>
                        <th>{t('admin.payments.sortCode')}</th>
                        <th>{t('admin.payments.description')}</th>
                        <th>{t('admin.payments.status')}</th>
                        <th>{t('admin.payments.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bankAccounts.map(account => (
                        <tr key={account.id}>
                          <td>{account.bankName}</td>
                          <td>{account.accountName}</td>
                          <td>{account.accountNumber}</td>
                          <td>{account.sortCode || '-'}</td>
                          <td>{account.description || '-'}</td>
                          <td>
                            {account.isActive ? (
                              <Badge bg="success">{t('admin.payments.active')}</Badge>
                            ) : (
                              <Badge bg="secondary">{t('admin.payments.inactive')}</Badge>
                            )}
                          </td>
                          <td>
                            <div className="btn-group">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => openBankModal(account)}
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteBankAccount(account.id)}
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </Tab>
          </Tabs>
        </Card.Header>
      </Card>
      
      {/* Payment Details Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{t('admin.payments.paymentDetails')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPayment && (
            <>
              <div className="row mb-4">
                <div className="col-md-6">
                  <h5>{t('admin.payments.paymentInfo')}</h5>
                  <p><strong>{t('admin.payments.id')}:</strong> {selectedPayment.id}</p>
                  <p><strong>{t('admin.payments.amount')}:</strong> ${selectedPayment.amount.toFixed(2)}</p>
                  <p><strong>{t('admin.payments.date')}:</strong> {format(new Date(selectedPayment.createdAt), 'PPP')}</p>
                  <p><strong>{t('admin.payments.status')}:</strong> {renderStatusBadge(selectedPayment.status)}</p>
                  
                  {selectedPayment.notes && (
                    <div className="alert alert-info">
                      <strong>{t('admin.payments.notes')}:</strong> {selectedPayment.notes}
                    </div>
                  )}
                </div>
                
                <div className="col-md-6">
                  <h5>{t('admin.payments.driverInfo')}</h5>
                  {selectedPayment.driver ? (
                    <>
                      <p><strong>{t('admin.payments.name')}:</strong> {selectedPayment.driver.firstName} {selectedPayment.driver.lastName}</p>
                      <p><strong>{t('admin.payments.email')}:</strong> {selectedPayment.driver.email}</p>
                      <p><strong>{t('admin.payments.phone')}:</strong> {selectedPayment.driver.phoneNumber || t('admin.notProvided')}</p>
                    </>
                  ) : (
                    <p>{t('admin.payments.driverNotFound')}</p>
                  )}
                  
                  <h5 className="mt-3">{t('admin.payments.bankAccountInfo')}</h5>
                  {selectedPayment.bankAccount ? (
                    <>
                      <p><strong>{t('admin.payments.bankName')}:</strong> {selectedPayment.bankAccount.bankName}</p>
                      <p><strong>{t('admin.payments.accountName')}:</strong> {selectedPayment.bankAccount.accountName}</p>
                      <p><strong>{t('admin.payments.accountNumber')}:</strong> {selectedPayment.bankAccount.accountNumber}</p>
                      {selectedPayment.bankAccount.sortCode && (
                        <p><strong>{t('admin.payments.sortCode')}:</strong> {selectedPayment.bankAccount.sortCode}</p>
                      )}
                    </>
                  ) : (
                    <p>{t('admin.payments.noBankAccountLinked')}</p>
                  )}
                </div>
              </div>
              
              {selectedPayment.status === 'PENDING' && (
                <div className="row mb-3">
                  <div className="col-12">
                    <Card>
                      <Card.Header>{t('admin.payments.paymentActions')}</Card.Header>
                      <Card.Body>
                        <div className="d-flex flex-wrap mb-3">
                          <Button
                            variant="success"
                            className="me-2 mb-2"
                            onClick={() => handleConfirmPayment(selectedPayment.id, 'CONFIRMED')}
                            disabled={processingPaymentId === selectedPayment.id}
                          >
                            {processingPaymentId === selectedPayment.id ? (
                              <Spinner animation="border" size="sm" className="me-2" />
                            ) : (
                              <FaCheck className="me-2" />
                            )}
                            {t('admin.payments.confirmPayment')}
                          </Button>
                          
                          <Button
                            variant="danger"
                            className="mb-2"
                            onClick={() => {
                              if (rejectionNote) {
                                handleConfirmPayment(selectedPayment.id, 'REJECTED');
                              } else {
                                document.getElementById('rejection-note')?.focus();
                              }
                            }}
                            disabled={processingPaymentId === selectedPayment.id}
                          >
                            {processingPaymentId === selectedPayment.id ? (
                              <Spinner animation="border" size="sm" className="me-2" />
                            ) : (
                              <FaTimes className="me-2" />
                            )}
                            {t('admin.payments.rejectPayment')}
                          </Button>
                        </div>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>{t('admin.payments.rejectionReason')}</Form.Label>
                          <Form.Control
                            id="rejection-note"
                            as="textarea"
                            rows={3}
                            value={rejectionNote}
                            onChange={(e) => setRejectionNote(e.target.value)}
                            placeholder={t('admin.payments.rejectionReasonPlaceholder')}
                          />
                          <Form.Text>{t('admin.payments.rejectionNoteRequired')}</Form.Text>
                        </Form.Group>
                      </Card.Body>
                    </Card>
                  </div>
                </div>
              )}
              
              <div className="row">
                <div className="col-12">
                  <Card>
                    <Card.Header>{t('admin.payments.paymentReceipt')}</Card.Header>
                    <Card.Body>
                      <PaymentReceipt payment={selectedPayment} />
                    </Card.Body>
                  </Card>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
            {t('button.close')}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Bank Account Modal */}
      <Modal show={showBankModal} onHide={() => setShowBankModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingBankAccount 
              ? t('admin.payments.editBankAccount')
              : t('admin.payments.addBankAccount')
            }
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleBankFormSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>{t('admin.payments.bankName')}</Form.Label>
              <Form.Control
                type="text"
                name="bankName"
                value={bankFormData.bankName}
                onChange={handleBankFormChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>{t('admin.payments.accountName')}</Form.Label>
              <Form.Control
                type="text"
                name="accountName"
                value={bankFormData.accountName}
                onChange={handleBankFormChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>{t('admin.payments.accountNumber')}</Form.Label>
              <Form.Control
                type="text"
                name="accountNumber"
                value={bankFormData.accountNumber}
                onChange={handleBankFormChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>{t('admin.payments.sortCode')}</Form.Label>
              <Form.Control
                type="text"
                name="sortCode"
                value={bankFormData.sortCode}
                onChange={handleBankFormChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>{t('admin.payments.description')}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={bankFormData.description}
                onChange={handleBankFormChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label={t('admin.payments.isActive')}
                name="isActive"
                checked={bankFormData.isActive}
                onChange={handleBankFormChange}
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowBankModal(false)}>
                {t('button.cancel')}
              </Button>
              <Button variant="primary" type="submit">
                {t('button.save')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
} 