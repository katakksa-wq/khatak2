'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import paymentService, { AdminBankAccount } from '@/services/paymentService';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function BankAccountManagement() {
  const { user } = useAuth();
  const [bankAccounts, setBankAccounts] = useState<AdminBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Partial<AdminBankAccount> | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [sortCode, setSortCode] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getBankAccounts();
      setBankAccounts(response);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast.error('Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const resetForm = () => {
    setBankName('');
    setAccountNumber('');
    setAccountName('');
    setSortCode('');
    setSwiftCode('');
    setDescription('');
    setIsActive(true);
    setIsEditing(false);
    setCurrentAccount(null);
  };

  const handleOpenModal = (account?: AdminBankAccount) => {
    resetForm();
    
    if (account) {
      setIsEditing(true);
      setCurrentAccount(account);
      setBankName(account.bankName);
      setAccountNumber(account.accountNumber);
      setAccountName(account.accountName);
      setSortCode(account.sortCode || '');
      setSwiftCode(account.swiftCode || '');
      setDescription(account.description || '');
      setIsActive(account.isActive);
    } else {
      setIsEditing(false);
      setCurrentAccount(null);
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bankName || !accountNumber || !accountName) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const accountData = {
        bankName,
        accountNumber,
        accountName,
        sortCode: sortCode || undefined,
        swiftCode: swiftCode || undefined,
        description: description || undefined,
        isActive,
      };
      
      if (isEditing && currentAccount?.id) {
        await paymentService.updateBankAccount(currentAccount.id, accountData);
        toast.success('Bank account updated successfully');
      } else {
        await paymentService.addBankAccount(accountData);
        toast.success('Bank account added successfully');
      }
      
      handleCloseModal();
      fetchBankAccounts();
    } catch (error) {
      console.error('Error saving bank account:', error);
      toast.error(isEditing ? 'Failed to update bank account' : 'Failed to add bank account');
    }
  };

  const handleToggleStatus = async (account: AdminBankAccount) => {
    try {
      await paymentService.updateBankAccount(account.id, {
        isActive: !account.isActive,
      });
      
      toast.success(`Bank account ${account.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchBankAccounts();
    } catch (error) {
      console.error('Error toggling account status:', error);
      toast.error('Failed to update account status');
    }
  };

  const handleDelete = async (account: AdminBankAccount) => {
    if (!confirm(`Are you sure you want to delete this bank account: ${account.bankName} - ${account.accountNumber}?`)) {
      return;
    }
    
    try {
      await paymentService.deleteBankAccount(account.id);
      toast.success('Bank account deleted successfully');
      fetchBankAccounts();
    } catch (error) {
      console.error('Error deleting bank account:', error);
      toast.error('Failed to delete bank account');
    }
  };

  // Only admin can manage bank accounts
  if (user?.role !== 'ADMIN') {
    return (
      <div className="alert alert-warning">
        <p className="mb-0">You do not have permission to manage bank accounts</p>
      </div>
    );
  }

  return (
    <div className="card shadow">
      <div className="card-header bg-white py-3">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Bank Account Management</h5>
          <button 
            className="btn btn-primary"
            onClick={() => handleOpenModal()}
          >
            <FaPlus className="me-2" /> Add Bank Account
          </button>
        </div>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : bankAccounts.length === 0 ? (
          <div className="alert alert-info">
            <p className="mb-0">No bank accounts found. Add a bank account to get started.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Bank Name</th>
                  <th>Account Name</th>
                  <th>Account Number</th>
                  <th>Sort Code</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bankAccounts.map((account) => (
                  <tr key={account.id}>
                    <td>{account.bankName}</td>
                    <td>{account.accountName}</td>
                    <td>{account.accountNumber}</td>
                    <td>{account.sortCode || '-'}</td>
                    <td>{account.description || '-'}</td>
                    <td>
                      <span className={`badge ${account.isActive ? 'bg-success' : 'bg-danger'}`}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleOpenModal(account)}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => handleToggleStatus(account)}
                          title={account.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {account.isActive ? <FaToggleOn /> : <FaToggleOff />}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(account)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Bank Account Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {isEditing ? 'Edit Bank Account' : 'Add Bank Account'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseModal}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="bankName" className="form-label">Bank Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="bankName"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="accountName" className="form-label">Account Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="accountName"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="accountNumber" className="form-label">Account Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="accountNumber"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="sortCode" className="form-label">Sort Code</label>
                    <input
                      type="text"
                      className="form-control"
                      id="sortCode"
                      value={sortCode}
                      onChange={(e) => setSortCode(e.target.value)}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="swiftCode" className="form-label">SWIFT/BIC Code</label>
                    <input
                      type="text"
                      className="form-control"
                      id="swiftCode"
                      value={swiftCode}
                      onChange={(e) => setSwiftCode(e.target.value)}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      id="description"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  
                  {isEditing && (
                    <div className="form-check form-switch mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isActive"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="isActive">Active</label>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    {isEditing ? 'Update' : 'Add'} Bank Account
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </div>
      )}
    </div>
  );
} 