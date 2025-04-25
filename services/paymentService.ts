import { apiClient } from '@/lib/apiClient';

export interface AdminBankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  sortCode?: string;
  swiftCode?: string;
  description?: string;
  isActive: boolean;
}

export interface PaymentSubmission {
  paymentMethod: string;
  paymentReference: string;
  paymentScreenshot?: string;
}

export interface PaymentConfirmation {
  status: 'CONFIRMED' | 'REJECTED';
  notes?: string;
}

export interface CommissionData {
  order: {
    id: string;
    trackingNumber: string;
    price: number;
    commissionPaid: boolean;
  };
  commissionRate: number;
  commissionAmount: number;
  paymentStatus: string;
  payment?: {
    id: string;
    status: string;
    paymentMethod: string;
    paymentReference: string;
    notes?: string;
  };
}

export interface DriverPayment {
  id: string;
  orderId: string;
  driverId: string;
  amount: number;
  paymentMethod: string;
  paymentReference: string;
  paymentScreenshot?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    trackingNumber: string;
    price: number;
    commissionPaid: boolean;
    status?: string;
  };
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export interface Payment {
  id: string;
  status: string;
  amount: number;
  paymentMethod: string;
  paymentReference: string;
  driverConfirmed: boolean;
  hasIssue: boolean;
  issueDetails?: string;
  createdAt: string;
  updatedAt: string;
}

const paymentService = {
  // Bank account operations
  getBankAccounts: async (): Promise<AdminBankAccount[]> => {
    try {
      const response = await apiClient.get('/api/payments/bank-accounts');
      return response.data.data.bankAccounts;
    } catch (error) {
      console.error('Error getting bank accounts:', error);
      throw error;
    }
  },

  addBankAccount: async (accountData: Omit<AdminBankAccount, 'id'>): Promise<AdminBankAccount> => {
    try {
      const response = await apiClient.post('/api/payments/bank-accounts', accountData);
      return response.data.data.bankAccount;
    } catch (error) {
      console.error('Error adding bank account:', error);
      throw error;
    }
  },

  updateBankAccount: async (id: string, accountData: Partial<AdminBankAccount>): Promise<AdminBankAccount> => {
    try {
      const response = await apiClient.put(`/api/payments/bank-accounts/${id}`, accountData);
      return response.data.data.bankAccount;
    } catch (error) {
      console.error('Error updating bank account:', error);
      throw error;
    }
  },

  deleteBankAccount: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/payments/bank-accounts/${id}`);
    } catch (error) {
      console.error('Error deleting bank account:', error);
      throw error;
    }
  },

  // Commission payment operations
  getOrderCommission: async (orderId: string): Promise<CommissionData> => {
    try {
      const response = await apiClient.get(`/api/payments/commission/${orderId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting order commission:', error);
      throw error;
    }
  },

  submitPayment: async (orderId: string, paymentData: PaymentSubmission): Promise<any> => {
    try {
      const response = await apiClient.post(`/api/payments/submit/${orderId}`, paymentData);
      return response.data.data.payment;
    } catch (error) {
      console.error('Error submitting payment:', error);
      throw error;
    }
  },

  confirmPayment: async (paymentId: string, confirmationData: PaymentConfirmation): Promise<any> => {
    try {
      const response = await apiClient.put(`/api/payments/confirm/${paymentId}`, confirmationData);
      return response.data.data.payment;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  },

  // Payment history
  getPayments: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/api/payments');
      console.log('Payments API Response:', {
        status: response.status,
        data: response.data,
        payments: response.data.data.payments.map((p: any) => ({
          id: p.id,
          status: p.status,
          orderStatus: p.order?.status,
          driverId: p.driverId,
          commissionPaid: p.order?.commissionPaid,
          amount: p.amount
        }))
      });
      return response.data;
    } catch (error) {
      console.error('Error getting payments:', error);
      throw error;
    }
  },
};

export default paymentService; 
