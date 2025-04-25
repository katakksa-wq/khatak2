'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { notificationService, Notification } from '@/services/notificationService';
import { toast } from 'react-toastify';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);

  // Calculate unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await notificationService.getUserNotifications();
      
      if (response.status === 'success' && response.data) {
        const notificationsArray = response.data.notifications || [];
        setNotifications(notificationsArray);
        
        // If we have new unread notifications since the last fetch, show them as toasts
        if (notificationsArray.length > lastNotificationCount) {
          const newNotifications = notificationsArray
            .filter(n => !n.read)
            .slice(0, notificationsArray.length - lastNotificationCount);
            
          newNotifications.forEach(notification => {
            toast.info(
              <div>
                <strong>{notification.title}</strong>
                <p>{notification.message}</p>
              </div>
            );
          });
        }
        
        setLastNotificationCount(notificationsArray.length);
      }
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  // Mark notifications as read
  const markAsRead = async (notificationIds: string[]) => {
    if (!user || notificationIds.length === 0) return;
    
    try {
      setLoading(true);
      await notificationService.markNotificationsAsRead(notificationIds);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notificationIds.includes(notification.id) 
            ? { ...notification, read: true } 
            : notification
        )
      );
    } catch (err: any) {
      console.error('Error marking notifications as read:', err);
      setError(err.message || 'Failed to mark notifications as read');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling for new notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Poll for new notifications every minute
      const intervalId = setInterval(fetchNotifications, 60000);
      
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [user]);

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount,
        loading, 
        error, 
        fetchNotifications, 
        markAsRead 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext; 