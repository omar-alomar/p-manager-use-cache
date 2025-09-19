'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { NotificationData } from '@/services/notificationService';
import { NotificationToaster } from '@/components/NotificationToast';

interface NotificationContextType {
  notifications: NotificationData[];
  addNotification: (notification: NotificationData) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = useCallback((notification: NotificationData) => {
    setNotifications(prev => [notification, ...prev].slice(0, 5)); // Show max 5 toasts
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
      }}
    >
      {children}
      <NotificationToaster
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}
