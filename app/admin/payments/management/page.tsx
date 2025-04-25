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

export default function AdminPaymentManagement() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
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
        notes = rejectionNote || 'Payment rejected by admin';
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
      toast.error('Failed to save bank account');
    }
  };
  
  const handleDeleteBankAccount = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this bank account?')) {
      try {
        await deleteBankAccount(id);
        refreshData();
      } catch (error) {
        console.error('Error deleting bank account:', error);
        toast.error('Failed to delete bank account');
      }
    }
  };
  
  // Render payment status badge
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
  
  if (user && !isAdmin()) {
    return (
      <div className="container py-5">
        <Alert variant="danger">
          <Alert.Heading>Access Denied</Alert.Heading>
          <p>You do not have permission to access this page.</p>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Payment Management</h1>
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
                <h6 className="text-muted mb-1">Total Pending</h6>
                <h3 className="mb-0">${totalPending.toFixed(2)}</h3>
                <small className="text-muted">{pendingPayments.length} payments</small>
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
                <h6 className="text-muted mb-1">Total Confirmed</h6>
                <h3 className="mb-0">${totalConfirmed.toFixed(2)}</h3>
                <small className="text-muted">{confirmedPayments.length} payments</small>
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
                <h6 className="text-muted mb-1">Total Rejected</h6>
                <h3 className="mb-0">${totalRejected.toFixed(2)}</h3>
                <small className="text-muted">{rejectedPayments.length} payments</small>
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
                <h6 className="text-muted mb-1">Reported Issues</h6>
                <h3 className="mb-0">{reportedIssues.length}</h3>
                <small className="text-muted">Require attention</small>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
      
      {/* Tabs for different payment sections */}
      <Tabs
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key || 'pending')}
        className="mb-4"
      >
        <Tab eventKey="pending" title={`Pending Payments (${pendingPayments.length})`}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Loading payments...</p>
                </div>
              ) : pendingPayments.length === 0 ? (
                <div className="text-center py-5">
                  <FaInfoCircle size={48} className="text-muted mb-3" />
                  <h5>No Pending Payments</h5>
                  <p className="text-muted">There are currently no payments awaiting confirmation.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Driver</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Reference</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPayments.map(payment => (
                        <tr key={payment.id}>
                          <td>{payment.order?.trackingNumber || payment.order?.id.substring(0, 8)}</td>
                          <td>{payment.driver?.firstName} {payment.driver?.lastName}</td>
                          <td>{format(new Date(payment.createdAt), 'MMM d, yyyy')}</td>
                          <td>${payment.amount.toFixed(2)}</td>
                          <td>{payment.paymentMethod}</td>
                          <td>{payment.paymentReference}</td>
                          <td>{renderStatusBadge(payment.status)}</td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => viewPaymentDetails(payment)}
                              className="me-2"
                            >
                              <FaEye /> View
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
        </Tab>
        
        <Tab eventKey="confirmed" title={`Confirmed Payments (${confirmedPayments.length})`}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Loading payments...</p>
                </div>
              ) : confirmedPayments.length === 0 ? (
                <div className="text-center py-5">
                  <FaInfoCircle size={48} className="text-muted mb-3" />
                  <h5>No Confirmed Payments</h5>
                  <p className="text-muted">There are no confirmed payments to display.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Driver</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Reference</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {confirmedPayments.map(payment => (
                        <tr key={payment.id}>
                          <td>{payment.order?.trackingNumber || payment.order?.id.substring(0, 8)}</td>
                          <td>{payment.driver?.firstName} {payment.driver?.lastName}</td>
                          <td>{format(new Date(payment.createdAt), 'MMM d, yyyy')}</td>
                          <td>${payment.amount.toFixed(2)}</td>
                          <td>{payment.paymentMethod}</td>
                          <td>{payment.paymentReference}</td>
                          <td>{renderStatusBadge(payment.status)}</td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => viewPaymentDetails(payment)}
                            >
                              <FaEye /> View
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
        </Tab>
        
        <Tab eventKey="rejected" title={`Rejected Payments (${rejectedPayments.length})`}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Loading payments...</p>
                </div>
              ) : rejectedPayments.length === 0 ? (
                <div className="text-center py-5">
                  <FaInfoCircle size={48} className="text-muted mb-3" />
                  <h5>No Rejected Payments</h5>
                  <p className="text-muted">There are no rejected payments to display.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Driver</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Reference</th>
                        <th>Status</th>
                        <th>Reason</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rejectedPayments.map(payment => (
                        <tr key={payment.id}>
                          <td>{payment.order?.trackingNumber || payment.order?.id.substring(0, 8)}</td>
                          <td>{payment.driver?.firstName} {payment.driver?.lastName}</td>
                          <td>{format(new Date(payment.createdAt), 'MMM d, yyyy')}</td>
                          <td>${payment.amount.toFixed(2)}</td>
                          <td>{payment.paymentMethod}</td>
                          <td>{payment.paymentReference}</td>
                          <td>{renderStatusBadge(payment.status)}</td>
                          <td>{payment.notes || 'No reason provided'}</td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => viewPaymentDetails(payment)}
                            >
                              <FaEye /> View
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
        </Tab>
        
        <Tab eventKey="issues" title={`Reported Issues (${reportedIssues.length})`}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Loading reported issues...</p>
                </div>
              ) : reportedIssues.length === 0 ? (
                <div className="text-center py-5">
                  <FaInfoCircle size={48} className="text-muted mb-3" />
                  <h5>No Reported Issues</h5>
                  <p className="text-muted">There are no payment issues reported by drivers.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Driver</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Issue Details</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportedIssues.map(payment => (
                        <tr key={payment.id}>
                          <td>{payment.order?.trackingNumber || payment.order?.id.substring(0, 8)}</td>
                          <td>{payment.driver?.firstName} {payment.driver?.lastName}</td>
                          <td>{format(new Date(payment.createdAt), 'MMM d, yyyy')}</td>
                          <td>${payment.amount.toFixed(2)}</td>
                          <td>{payment.paymentMethod}</td>
                          <td>{payment.issueDetails || 'No details provided'}</td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => viewPaymentDetails(payment)}
                              className="me-2"
                            >
                              <FaEye /> View
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
        </Tab>
        
        <Tab eventKey="bank-accounts" title="Bank Accounts">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-end mb-3">
                <Button 
                  variant="primary" 
                  onClick={() => openBankModal()}
                >
                  <FaPlus className="me-2" /> Add Bank Account
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Loading bank accounts...</p>
                </div>
              ) : bankAccounts.length === 0 ? (
                <div className="text-center py-5">
                  <FaInfoCircle size={48} className="text-muted mb-3" />
                  <h5>No Bank Accounts</h5>
                  <p className="text-muted">There are no bank accounts set up yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Bank Name</th>
                        <th>Account Name</th>
                        <th>Account Number</th>
                        <th>Sort Code</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bankAccounts.map(account => (
                        <tr key={account.id}>
                          <td>{account.bankName}</td>
                          <td>{account.accountName}</td>
                          <td>{account.accountNumber}</td>
                          <td>{account.sortCode || 'N/A'}</td>
                          <td>
                            {account.isActive ? (
                              <Badge bg="success">Active</Badge>
                            ) : (
                              <Badge bg="secondary">Inactive</Badge>
                            )}
                          </td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => openBankModal(account)}
                              className="me-2"
                            >
                              <FaEdit /> Edit
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleDeleteBankAccount(account.id)}
                            >
                              <FaTrash /> Delete
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
        </Tab>
      </Tabs>
      
      {/* Payment Details Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Payment Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPayment && (
            <PaymentReceipt 
              payment={selectedPayment} 
              onClose={() => setShowPaymentModal(false)} 
            />
          )}
        </Modal.Body>
      </Modal>
      
      {/* Bank Account Modal */}
      <Modal show={showBankModal} onHide={() => setShowBankModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingBankAccount ? 'Edit Bank Account' : 'Add Bank Account'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleBankFormSubmit}>
            <Form.Group className="mb-3" controlId="bankName">
              <Form.Label>Bank Name</Form.Label>
              <Form.Control
                type="text"
                name="bankName"
                value={bankFormData.bankName}
                onChange={handleBankFormChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="accountName">
              <Form.Label>Account Name</Form.Label>
              <Form.Control
                type="text"
                name="accountName"
                value={bankFormData.accountName}
                onChange={handleBankFormChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="accountNumber">
              <Form.Label>Account Number</Form.Label>
              <Form.Control
                type="text"
                name="accountNumber"
                value={bankFormData.accountNumber}
                onChange={handleBankFormChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="sortCode">
              <Form.Label>Sort Code</Form.Label>
              <Form.Control
                type="text"
                name="sortCode"
                value={bankFormData.sortCode}
                onChange={handleBankFormChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="description">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={bankFormData.description}
                onChange={handleBankFormChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="isActive">
              <Form.Check
                type="checkbox"
                label="Active"
                name="isActive"
                checked={bankFormData.isActive}
                onChange={(e) => handleBankFormChange(e as any)}
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={() => setShowBankModal(false)} className="me-2">
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingBankAccount ? 'Update Account' : 'Add Account'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
} 