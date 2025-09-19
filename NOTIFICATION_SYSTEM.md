# Notification System Documentation

This document describes the notification system implemented for the project management platform using Server-Sent Events (SSE).

## Overview

The notification system provides real-time notifications for:
- **Task Assignments**: Users are notified when they are assigned a new task
- **Task Completions**: Users are notified when a task they assigned to someone else gets completed
- **Offline Notifications**: Users receive notifications they missed while logged out when they log back in

## Architecture

### Backend Components

1. **SSE Endpoint** (`/api/notifications/stream`)
   - Provides real-time notification stream using Server-Sent Events
   - Uses Redis pub/sub for message distribution
   - Handles user-specific notification channels

2. **User Notifications Endpoint** (`/api/notifications/user/[userId]`)
   - Provides stored notifications for specific users
   - Fetches notifications from Redis storage
   - Used when users log in to get missed notifications

3. **Notification Service** (`/src/services/notificationService.ts`)
   - Manages notification creation and sending
   - Handles Redis pub/sub operations for real-time delivery
   - Stores notifications in Redis for persistence
   - Provides methods for different notification types

4. **Task Actions Integration** (`/src/actions/tasks.ts`)
   - Modified to send notifications on task assignment and completion
   - Integrates with the notification service

### Frontend Components

1. **Notification Hook** (`/src/hooks/useNotifications.ts`)
   - React hook for managing SSE connection
   - Fetches stored notifications when user logs in
   - Manages localStorage persistence for immediate display
   - Handles notification state and connection status

2. **Notification Center** (`/src/components/NotificationCenter.tsx`)
   - Dropdown component showing notification history
   - Displays unread count and connection status
   - Only available for logged-in users

3. **Notification Toast** (`/src/components/NotificationToast.tsx`)
   - Toast notifications for immediate feedback
   - Auto-dismisses after 5 seconds

4. **Notification Context** (`/src/contexts/NotificationContext.tsx`)
   - Global state management for notifications
   - Provides notification management functions

## Usage

### Basic Setup

The notification system is automatically integrated into the main layout. Users will see:
- A notification bell icon in the top navigation
- Toast notifications for immediate feedback
- A dropdown with notification history

### Testing

Use the `NotificationDemo` component to test the notification system:

```tsx
import { NotificationDemo } from '@/components/NotificationDemo';

// Add to any page for testing
<NotificationDemo />
```

### Programmatic Usage

```tsx
import { useNotificationContext } from '@/contexts/NotificationContext';

function MyComponent() {
  const { addNotification, notifications, clearNotifications } = useNotificationContext();
  
  // Add a custom notification
  addNotification({
    id: 'custom_123',
    type: 'task_assigned',
    title: 'Custom Notification',
    message: 'This is a custom notification',
    // ... other properties
  });
}
```

## Configuration

### Environment Variables

Ensure Redis is properly configured:
- `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`
- The system uses environment-specific Redis databases

### Redis Channels

Notifications are sent to user-specific channels:
- Format: `notifications:{userId}`
- Each user receives notifications on their dedicated channel

## Notification Types

### Task Assignment
- **Trigger**: When a task is created or assigned to a user
- **Recipients**: The assigned user
- **Content**: Task title, project information, assigner name

### Task Completion
- **Trigger**: When a task is marked as completed
- **Recipients**: 
  - The user who completed the task (confirmation)
  - The user who originally assigned the task (notification)
- **Content**: Task title, project information, completer name

## Data Structure

```typescript
interface NotificationData {
  id: string;
  type: 'task_assigned' | 'task_completed';
  title: string;
  message: string;
  taskId: number;
  taskTitle: string;
  projectId?: number;
  projectTitle?: string;
  assignedUserId: number;
  assignedUserName: string;
  assignerUserId?: number;
  assignerUserName?: string;
  timestamp: string;
  read: boolean;
}
```

## Features

- **Real-time Updates**: Uses SSE for instant notifications
- **Offline Notifications**: Users get notifications they missed while logged out
- **User-specific Channels**: Each user gets their own notification stream
- **Persistent Storage**: Notifications stored in Redis for reliability
- **Toast Notifications**: Immediate visual feedback
- **Notification History**: Dropdown with recent notifications
- **Unread Count**: Visual indicator of unread notifications
- **Connection Status**: Shows if SSE connection is active
- **Auto-dismiss**: Toast notifications auto-dismiss after 5 seconds
- **Click Navigation**: Click notifications to navigate to relevant tasks
- **localStorage Caching**: Notifications cached locally for immediate display

## Troubleshooting

### Common Issues

1. **No Notifications Received**
   - Check Redis connection
   - Verify user ID is correct
   - Check browser console for SSE errors

2. **Connection Lost**
   - The system automatically attempts to reconnect
   - Check network connectivity
   - Verify SSE endpoint is accessible

3. **Notifications Not Sending**
   - Check Redis pub/sub is working
   - Verify notification service is being called
   - Check server logs for errors

### Debug Mode

Enable debug logging by checking the browser console and server logs for:
- SSE connection status
- Redis pub/sub messages
- Notification service calls

## Future Enhancements

- Persistent notification storage in database
- Email notifications for important tasks
- Push notifications for mobile devices
- Notification preferences and settings
- Bulk notification operations
- Notification categories and filtering
