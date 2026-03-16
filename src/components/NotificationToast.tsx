'use client';

import { useState, useEffect } from 'react';
import { NotificationData } from '@/services/notificationService';

interface NotificationToastProps {
  notification: NotificationData;
  onClose: () => void;
  duration?: number;
}

export function NotificationToast({ notification, onClose, duration = 5000 }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClick = () => {
    if (notification.type === 'project_assigned') {
      window.location.href = `/projects/${notification.projectId}`;
    } else if (notification.type === 'task_assigned' || notification.type === 'task_completed') {
      window.location.href = `/tasks/${notification.taskId}`;
    }
    onClose();
  };

  const indicatorClass = notification.type === 'task_completed' ? 'task-completed' : 'task-assigned';

  return (
    <div
      className={`notification-toast ${indicatorClass} ${isVisible ? '' : 'hidden'}`}
      onClick={handleClick}
    >
      <div className="notification-toast-content">
        <div className="notification-toast-header">
          <div className={`notification-toast-indicator ${indicatorClass}`} />
          <div className="notification-toast-text">
            <h4 className="notification-toast-title">
              {notification.title}
            </h4>
            <p className="notification-toast-message">
              {notification.message}
            </p>
            <p className="notification-toast-timestamp">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="notification-toast-close"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface NotificationToasterProps {
  notifications: NotificationData[];
  onRemoveNotification: (id: string) => void;
}

export function NotificationToaster({ notifications, onRemoveNotification }: NotificationToasterProps) {
  return (
    <div className="notification-toast-container">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => onRemoveNotification(notification.id)}
        />
      ))}
    </div>
  );
}
