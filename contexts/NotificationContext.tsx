'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { notificationService, Notification } from '@/services/notificationService';
import { toast } from 'react-toastify';
import TranslatedText from '@/components/TranslatedText';

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
  const [shownNotifications, setShownNotifications] = useState<string[]>([]);

  // Clean up old notifications from localStorage
  const cleanupOldNotifications = () => {
    if (!user || typeof window === 'undefined') return;
    
    // Get current notifications to make sure we don't remove active ones
    const currentIds = new Set(notifications.map(n => n.id));
    const updatedShownNotifications = shownNotifications.filter(id => currentIds.has(id));
    
    // Only keep a maximum of 100 notification IDs to prevent localStorage from growing too large
    if (updatedShownNotifications.length > 100) {
      updatedShownNotifications.splice(0, updatedShownNotifications.length - 100);
    }
    
    setShownNotifications(updatedShownNotifications);
    localStorage.setItem(
      `shown_notifications_${user.id}`,
      JSON.stringify(updatedShownNotifications)
    );
  };

  // Load previously shown notifications from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const storedNotifications = localStorage.getItem(`shown_notifications_${user.id}`);
      if (storedNotifications) {
        setShownNotifications(JSON.parse(storedNotifications));
      }
    }
  }, [user]);

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
        
        // Filter out notifications that have already been shown
        const newNotifications = notificationsArray
          .filter(n => !n.read && !shownNotifications.includes(n.id));
            
        // Show toast for each new notification
        if (newNotifications.length > 0) {
          // Get IDs of new notifications to mark as read
          const newNotificationIds = newNotifications.map(n => n.id);
          
          // Show toast notifications
          newNotifications.forEach(notification => {
            // Check if the notification content is a translation key
            const isTranslationKey = (text: string | undefined): boolean => 
              Boolean(text && text.startsWith('notification.'));
            
            toast.info(
              <div>
                <strong>
                  <TranslatedText 
                    text={notification.title} 
                    translation={isTranslationKey(notification.title)} 
                  />
                </strong>
                <p>
                  <TranslatedText 
                    text={notification.message} 
                    translation={isTranslationKey(notification.message)} 
                  />
                </p>
              </div>
            );
          });
          
          // Update shown notifications in state and localStorage
          const updatedShownNotifications = [
            ...shownNotifications,
            ...newNotifications.map(n => n.id)
          ];
          
          setShownNotifications(updatedShownNotifications);
          
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              `shown_notifications_${user.id}`, 
              JSON.stringify(updatedShownNotifications)
            );
          }
          
          try {
            // Mark them as read directly through the API
            await notificationService.markNotificationsAsRead(newNotificationIds);
            
            // Update notifications in local state
            notificationsArray.forEach(notification => {
              if (newNotificationIds.includes(notification.id)) {
                notification.read = true;
              }
            });
          } catch (markError) {
            console.error('Error marking notifications as read:', markError);
          }
        }
        
        // Update the state with all notifications including the newly read ones
        setNotifications(notificationsArray);
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
      
      // Add read notifications to shown notifications to prevent showing them again
      const updatedShownNotifications = [
        ...shownNotifications,
        ...notificationIds.filter(id => !shownNotifications.includes(id))
      ];
      
      setShownNotifications(updatedShownNotifications);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `shown_notifications_${user.id}`,
          JSON.stringify(updatedShownNotifications)
        );
      }
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
      
      // Clean up old notifications every day
      const cleanupIntervalId = setInterval(cleanupOldNotifications, 86400000);
      
      return () => {
        clearInterval(intervalId);
        clearInterval(cleanupIntervalId);
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