'use client';

import React, { useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import TranslatedText from '@/components/TranslatedText';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const { t } = useLanguage();

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    
    // Mark all as read when opening
    if (!showDropdown && unreadCount > 0) {
      const unreadIds = notifications
        .filter(notification => !notification.read)
        .map(notification => notification.id);
      
      markAsRead(unreadIds);
    }
  };

  // Format notification time
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'recently';
    }
  };
  
  // Check if the notification content is a translation key
  const isTranslationKey = (text: string | undefined): boolean => 
    Boolean(text && text.startsWith('notification.'));

  return (
    <div className="dropdown position-relative">
      <button 
        className="btn btn-link text-decoration-none position-relative"
        onClick={toggleDropdown}
      >
        <FaBell size={20} className={unreadCount > 0 ? 'text-warning' : 'text-muted'} />
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="dropdown-menu dropdown-menu-end show notification-dropdown" style={{ minWidth: '300px', maxHeight: '400px', overflowY: 'auto' }}>
          <div className="dropdown-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0">{t('notifications')}</h6>
            <span className="badge bg-primary">{notifications.length}</span>
          </div>
          
          <div className="dropdown-divider"></div>
          
          {notifications.length === 0 ? (
            <div className="dropdown-item text-center text-muted">
              {t('noNotifications')}
            </div>
          ) : (
            notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`dropdown-item ${!notification.read ? 'bg-light' : ''}`}
              >
                <h6 className="mb-1">
                  <TranslatedText 
                    text={notification.title} 
                    translation={isTranslationKey(notification.title)} 
                  />
                </h6>
                <p className="mb-1">
                  <TranslatedText 
                    text={notification.message} 
                    translation={isTranslationKey(notification.message)} 
                  />
                </p>
                <small className="text-muted">{formatTime(notification.createdAt)}</small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 