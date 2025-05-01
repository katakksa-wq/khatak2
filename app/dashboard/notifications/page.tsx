'use client';

import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Notification } from '@/services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { FaCheck, FaFilter, FaSync } from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';
import TranslatedText from '@/components/TranslatedText';

const NotificationsPage = () => {
  const { notifications, loading, error, fetchNotifications, markAsRead } = useNotifications();
  const { t } = useLanguage();
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<string>('all'); // 'all', 'unread', 'read'
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  // Get unique notification types
  const notificationTypes = ['all', ...Array.from(new Set(notifications.map(n => n.type)))];

  // Apply filters
  useEffect(() => {
    let filtered = [...notifications];
    
    // Filter by read status
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.read);
    }
    
    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(n => n.type === selectedType);
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setFilteredNotifications(filtered);
  }, [notifications, filter, selectedType]);

  // Format notification time
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'recently';
    }
  };

  // Handle marking selected notifications as read
  const handleMarkAsRead = async () => {
    const unreadSelected = selectedNotifications.filter(id => 
      notifications.find(n => n.id === id && !n.read)
    );
    
    if (unreadSelected.length > 0) {
      await markAsRead(unreadSelected);
      setSelectedNotifications([]);
    }
  };

  // Handle select all notifications
  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  // Handle select individual notification
  const handleSelectNotification = (id: string) => {
    if (selectedNotifications.includes(id)) {
      setSelectedNotifications(selectedNotifications.filter(nId => nId !== id));
    } else {
      setSelectedNotifications([...selectedNotifications, id]);
    }
  };

  // Get notification type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'order':
        return 'primary';
      case 'payment':
        return 'success';
      case 'account':
        return 'info';
      case 'system':
        return 'secondary';
      default:
        return 'dark';
    }
  };

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{t('user.notifications')}</h5>
              <div>
                <button 
                  className="btn btn-sm btn-outline-primary me-2" 
                  onClick={() => fetchNotifications()}
                  disabled={loading}
                >
                  <FaSync className={loading ? 'spin me-1' : 'me-1'} /> 
                  {loading ? t('loading.message') : t('admin.refresh')}
                </button>
                {selectedNotifications.length > 0 && (
                  <button 
                    className="btn btn-sm btn-success" 
                    onClick={handleMarkAsRead}
                    disabled={loading}
                  >
                    <FaCheck className="me-1" /> {t('notifications.markSelected')}
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              {/* Filters */}
              <div className="row mb-3">
                <div className="col-md-6 d-flex align-items-center mb-2 mb-md-0">
                  <span className="me-2"><FaFilter /> {t('notifications.filter')}</span>
                  <div className="btn-group me-3">
                    <button 
                      className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setFilter('all')}
                    >
                      {t('notifications.all')}
                    </button>
                    <button 
                      className={`btn btn-sm ${filter === 'unread' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setFilter('unread')}
                    >
                      {t('notifications.unread')}
                    </button>
                    <button 
                      className={`btn btn-sm ${filter === 'read' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setFilter('read')}
                    >
                      {t('notifications.read')}
                    </button>
                  </div>
                </div>
                <div className="col-md-6 d-flex align-items-center">
                  <span className="me-2">{t('notifications.type')}</span>
                  <select 
                    className="form-select form-select-sm" 
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    {notificationTypes.map(type => (
                      <option key={type} value={type}>
                        {type === 'all' 
                          ? t('notifications.all')
                          : type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notifications List */}
              {error && (
                <div className="alert alert-danger">{error}</div>
              )}

              {loading && filteredNotifications.length === 0 ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t('loading.message')}</span>
                  </div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="alert alert-info text-center">
                  {t('notifications.empty')}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>
                          <input 
                            type="checkbox" 
                            className="form-check-input" 
                            checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                            onChange={handleSelectAll}
                            aria-label={t('notifications.select')}
                          />
                        </th>
                        <th style={{ width: '120px' }}>{t('notifications.type')}</th>
                        <th>{t('notifications.details')}</th>
                        <th style={{ width: '180px' }}>{t('notifications.time')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNotifications.map(notification => (
                        <tr 
                          key={notification.id} 
                          className={notification.read ? '' : 'table-light fw-bold'}
                        >
                          <td>
                            <input 
                              type="checkbox" 
                              className="form-check-input" 
                              checked={selectedNotifications.includes(notification.id)}
                              onChange={() => handleSelectNotification(notification.id)}
                              aria-label={t('notifications.select')}
                            />
                          </td>
                          <td>
                            <span className={`badge bg-${getTypeBadgeColor(notification.type)}`}>
                              {notification.type}
                            </span>
                          </td>
                          <td>
                            <div className="fw-bold"><TranslatedText text={notification.title} translation={false} /></div>
                            <div className={notification.read ? 'text-muted' : ''}><TranslatedText text={notification.message} translation={false} /></div>
                          </td>
                          <td>
                            <small className="text-muted">{formatTime(notification.createdAt)}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="card-footer text-muted">
              {filteredNotifications.length > 0 && (
                <small>
                  {t('notifications.showing').replace('{0}', filteredNotifications.length.toString())}
                </small>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage; 