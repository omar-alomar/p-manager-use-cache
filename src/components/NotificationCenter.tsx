'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationData } from '@/services/notificationService';

interface NotificationCenterProps {
  userId: number | null;
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const { notifications, isConnected, error, markAsRead, removeNotification, clearNotifications } = useNotifications(userId);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: NotificationData) => {
    markAsRead(notification.id);
    // You can add navigation logic here based on notification type
    if (notification.type === 'task_assigned' || notification.type === 'task_completed') {
      // Navigate to task or project page
      window.location.href = `/tasks/${notification.taskId}`;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-center">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="notification-bell"
        aria-label="Notifications"
      >
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {!isConnected && (
          <span className="connection-indicator disconnected" title="Disconnected" />
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3 className="notification-dropdown-title">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="notification-close-btn"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="notification-dropdown-actions">
              <button
                onClick={clearNotifications}
                className="notification-clear-btn"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    !notification.read ? 'unread' : ''
                  }`}
                >
                  <div 
                    className="notification-item-content"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={`notification-indicator ${
                      notification.type === 'task_assigned' ? 'task-assigned' : 'task-completed'
                    }`} />
                    <div className="notification-text">
                      <p className="notification-title">
                        {notification.title}
                      </p>
                      <p className="notification-message">
                        {notification.message}
                      </p>
                      <p className="notification-timestamp">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="notification-unread-dot" />
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                    className="notification-remove-btn"
                    aria-label="Remove notification"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
