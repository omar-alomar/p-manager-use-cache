'use client';

import { useState } from 'react';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useAuth } from '@/components/auth/AuthContext';

export function NotificationDemo() {
  const { addNotification } = useNotificationContext();
  const { user } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState(false);

  const sendTestNotification = async (type: 'task_assigned' | 'task_completed') => {
    if (!user) {
      alert('Please log in to test notifications');
      return;
    }

    try {
      // Send to server to create a real notification
      const response = await fetch('/api/notifications/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, userId: user.id }),
      });

      if (response.ok) {
        // The notification will be delivered via SSE or fetched from server
        console.log('Demo notification sent successfully');
      } else {
        console.error('Failed to create demo notification');
      }
    } catch (error) {
      console.error('Error creating demo notification:', error);
    }
  };

  if (!isDemoMode) {
    return (
      <div className="notification-demo">
        <h3 className="notification-demo-title">Notification System Demo</h3>
        <p className="notification-demo-description">
          This is a demo component to test the notification system. 
          Click the button below to enable demo mode and test notifications.
        </p>
        <button
          onClick={() => setIsDemoMode(true)}
          className="notification-demo-btn primary"
        >
          Enable Demo Mode
        </button>
      </div>
    );
  }

  return (
    <div className="notification-demo">
      <h3 className="notification-demo-title">Notification System Demo</h3>
      <p className="notification-demo-description">
        Click the buttons below to test different types of notifications.
        You should see toast notifications appear in the top-right corner.
      </p>
      <div className="notification-demo-actions">
        <button
          onClick={() => sendTestNotification('task_assigned')}
          className="notification-demo-btn primary"
        >
          Test Task Assignment
        </button>
        <button
          onClick={() => sendTestNotification('task_completed')}
          className="notification-demo-btn success"
        >
          Test Task Completion
        </button>
        <button
          onClick={() => setIsDemoMode(false)}
          className="notification-demo-btn secondary"
        >
          Disable Demo Mode
        </button>
      </div>
    </div>
  );
}
