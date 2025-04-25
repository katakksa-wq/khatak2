import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import paymentService, { 
  DriverPayment, 
  PaymentConfirmation,
  PaymentSubmission
} from '@/services/paymentService';
import { toast } from 'react-toastify';

// Define types for payments
export interface Order {
  id: string;
  trackingNumber: string;
  price: number;
  commissionPaid: boolean;
  status?: string;
}

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  driverId: string;
  amount: number;
  paymentMethod: string;
  paymentReference: string;
  paymentScreenshot?: string;
  status: string;
  notes?: string;
  driverConfirmed: boolean;
  hasIssue: boolean;
  issueDetails?: string;
  createdAt: string;
  updatedAt: string;
  order: Order;
  driver: Driver;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  sortCode?: string;
  description?: string;
  isActive: boolean;
}

export function usePayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Statistics
  const [pendingCount, setPendingCount] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  
  // Force a refresh of data
  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  // Fetch all payments
  const fetchPayments = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await paymentService.getPayments();
      
      // Set main payments data
      setPayments(response.data.payments);
      
      // Calculate statistics
      const pending = response.data.payments.filter((p: Payment) => p.status === 'PENDING').length;
      const confirmed = response.data.payments.filter((p: Payment) => p.status === 'CONFIRMED').length;
      const rejected = response.data.payments.filter((p: Payment) => p.status === 'REJECTED').length;
      
      // Count unpaid delivered orders
      const unpaid = response.data.payments.filter((p: Payment) => 
        p.order && p.order.status === 'DELIVERED' && !p.order.commissionPaid
      ).length;
      
      setPendingCount(pending);
      setConfirmedCount(confirmed);
      setRejectedCount(rejected);
      setUnpaidCount(unpaid);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Fetch bank accounts
  const fetchBankAccounts = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await paymentService.getBankAccounts();
      setBankAccounts(response.filter((account: any) => account.isActive));
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast.error('Failed to load bank accounts');
    }
  }, [user]);
  
  // Get commission data for an order
  const getOrderCommission = async (orderId: string) => {
    try {
      return await paymentService.getOrderCommission(orderId);
    } catch (error) {
      console.error('Error fetching order commission:', error);
      toast.error('Failed to load commission data');
      throw error;
    }
  };
  
  // Submit a payment
  const submitPayment = async (orderId: string, paymentData: PaymentSubmission) => {
    try {
      await paymentService.submitPayment(orderId, paymentData);
      toast.success('Payment submitted successfully');
      refreshData();
      return true;
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error('Failed to submit payment');
      return false;
    }
  };
  
  // Confirm or reject a payment (admin only)
  const confirmPayment = async (paymentId: string, status: 'CONFIRMED' | 'REJECTED', notes?: string) => {
    if (user?.role !== 'ADMIN') {
      toast.error('Only admins can confirm payments');
      return false;
    }
    
    try {
      const confirmationData: PaymentConfirmation = {
        status,
        notes
      };
      
      await paymentService.confirmPayment(paymentId, confirmationData);
      toast.success(`Payment ${status === 'CONFIRMED' ? 'confirmed' : 'rejected'} successfully`);
      refreshData();
      return true;
    } catch (error) {
      console.error(`Error ${status.toLowerCase()} payment:`, error);
      toast.error(`Failed to ${status.toLowerCase()} payment`);
      return false;
    }
  };
  
  // Bank account management (admin only)
  const addBankAccount = async (accountData: Omit<BankAccount, 'id'>) => {
    if (user?.role !== 'ADMIN') {
      toast.error('Only admins can manage bank accounts');
      return false;
    }
    
    try {
      await paymentService.addBankAccount(accountData);
      toast.success('Bank account added successfully');
      fetchBankAccounts();
      return true;
    } catch (error) {
      console.error('Error adding bank account:', error);
      toast.error('Failed to add bank account');
      return false;
    }
  };
  
  const updateBankAccount = async (id: string, accountData: Partial<BankAccount>) => {
    if (user?.role !== 'ADMIN') {
      toast.error('Only admins can manage bank accounts');
      return false;
    }
    
    try {
      await paymentService.updateBankAccount(id, accountData);
      toast.success('Bank account updated successfully');
      fetchBankAccounts();
      return true;
    } catch (error) {
      console.error('Error updating bank account:', error);
      toast.error('Failed to update bank account');
      return false;
    }
  };
  
  const deleteBankAccount = async (id: string) => {
    if (user?.role !== 'ADMIN') {
      toast.error('Only admins can manage bank accounts');
      return false;
    }
    
    try {
      await paymentService.deleteBankAccount(id);
      toast.success('Bank account deleted successfully');
      fetchBankAccounts();
      return true;
    } catch (error) {
      console.error('Error deleting bank account:', error);
      toast.error('Failed to delete bank account');
      return false;
    }
  };
  
  // Fetch data on mount and when refresh is triggered
  useEffect(() => {
    if (user) {
      fetchPayments();
      fetchBankAccounts();
    }
  }, [user, refreshTrigger, fetchPayments, fetchBankAccounts]);
  
  return {
    // Data
    payments,
    bankAccounts,
    loading,
    
    // Statistics
    pendingCount,
    unpaidCount,
    confirmedCount,
    rejectedCount,
    
    // Actions
    refreshData,
    getOrderCommission,
    submitPayment,
    confirmPayment,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount
  };
} 