import { useState, useEffect, useCallback } from 'react';
import { NotificationData } from '@/services/notificationService';

interface SSEMessage {
  type: 'connected' | 'task_assigned' | 'task_completed';
  message?: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface UseNotificationsReturn {
  notifications: NotificationData[];
  isConnected: boolean;
  error: string | null;
  addNotification: (notification: NotificationData) => void;
  markAsRead: (notificationId: string) => void;
  removeNotification: (notificationId: string) => void;
  clearNotifications: () => void;
}

// Load notifications from localStorage for a specific user
function loadStoredNotifications(userId: number | null): NotificationData[] {
  if (!userId) return [];
  
  try {
    const stored = localStorage.getItem(`notifications_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save notifications to localStorage for a specific user
function saveNotifications(userId: number | null, notifications: NotificationData[]) {
  if (!userId) return;
  
  try {
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications.slice(0, 50)));
  } catch (error) {
    console.error('Failed to save notifications:', error);
  }
}

export function useNotifications(userId: number | null): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justCleared, setJustCleared] = useState(false);

  const addNotification = useCallback((notification: NotificationData) => {
    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, 50);
      saveNotifications(userId, updated);
      return updated;
    });
    // Reset the justCleared flag when we get a new notification
    setJustCleared(false);
  }, [userId]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      );
      saveNotifications(userId, updated);
      return updated;
    });
  }, [userId]);

  const removeNotification = useCallback(async (notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.filter(notif => notif.id !== notificationId);
      saveNotifications(userId, updated);
      return updated;
    });
    
    // Also remove from server
    if (userId) {
      try {
        await fetch(`/api/notifications/user/${userId}?notificationId=${notificationId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error removing notification from server:', error);
      }
    }
  }, [userId]);

  const clearNotifications = useCallback(async () => {
    setNotifications([]);
    setJustCleared(true);
    if (userId) {
      localStorage.removeItem(`notifications_${userId}`);
      
      // Also clear from server
      try {
        await fetch(`/api/notifications/user/${userId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error clearing notifications from server:', error);
      }
    }
  }, [userId]);

  // Load stored notifications on mount and when user changes
  useEffect(() => {
    if (userId) {
      // First load from localStorage (for immediate display)
      const stored = loadStoredNotifications(userId);
      setNotifications(stored);
      
      // Then fetch from server to get any missed notifications (unless we just cleared)
      const fetchStoredNotifications = async () => {
        if (justCleared) {
          setJustCleared(false);
          return;
        }
        
        try {
          const response = await fetch(`/api/notifications/user/${userId}`);
          if (response.ok) {
            const data = await response.json();
            const serverNotifications = data.notifications || [];
            
            // Only merge if we have server notifications and they're different from what we have
            if (serverNotifications.length > 0) {
              setNotifications(prev => {
                const existingIds = new Set(prev.map(n => n.id));
                const newNotifications = serverNotifications.filter((n: NotificationData) => !existingIds.has(n.id));
                
                if (newNotifications.length > 0) {
                  const updated = [...newNotifications, ...prev].slice(0, 50);
                  saveNotifications(userId, updated);
                  return updated;
                }
                
                return prev;
              });
            }
          }
        } catch (error) {
          console.error('Error fetching stored notifications:', error);
        }
      };
      
      fetchStoredNotifications();
    } else {
      setNotifications([]);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setIsConnected(false);
      return;
    }

    // For logged-in users, use SSE
    const eventSource = new EventSource(`/api/notifications/stream?userId=${userId}`);
    
    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);
        
        // Skip connection messages
        if (message.type === 'connected') {
          return;
        }
        
        // Only process actual notifications
        if (message.type === 'task_assigned' || message.type === 'task_completed') {
          addNotification(message as unknown as NotificationData);
        }
      } catch (err) {
        console.error('Error parsing notification:', err);
        setError('Failed to parse notification');
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      setIsConnected(false);
      setError('Connection lost. Attempting to reconnect...');
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [userId, addNotification, justCleared]);

  return {
    notifications,
    isConnected,
    error,
    addNotification,
    markAsRead,
    removeNotification,
    clearNotifications,
  };
}
