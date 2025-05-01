import { apiClient, ApiResponse } from '@/utils/apiClient';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
}

// Helper function to format notification messages with parameters
export const formatNotificationMessage = (key: string, params: string[] | number[] | any[]): string => {
  // Replace {0}, {1}, etc. with corresponding parameter
  return params.reduce((msg, param, index) => {
    return msg.replace(`{${index}}`, param.toString());
  }, key);
};

// API endpoints
const ENDPOINTS = {
  notifications: '/api/notifications',
  markRead: '/api/notifications/mark-read',
};

// Notification service
export const notificationService = {
  // Get user notifications
  getUserNotifications: async (): Promise<ApiResponse<NotificationsResponse>> => {
    try {
      const response = await apiClient.get<NotificationsResponse>(ENDPOINTS.notifications);
      return response;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Mark notifications as read
  markNotificationsAsRead: async (notificationIds: string[]): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.post<void>(ENDPOINTS.markRead, { notificationIds });
      return response;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }
}; 