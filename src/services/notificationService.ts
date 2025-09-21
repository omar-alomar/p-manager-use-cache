import { getRedis } from '@/redis/redis';

export interface NotificationData {
  id: string;
  type: 'task_assigned' | 'task_completed' | 'mention';
  title: string;
  message: string;
  taskId?: number;
  taskTitle?: string;
  projectId?: number;
  projectTitle?: string;
  commentId?: number;
  assignedUserId: number;
  assignedUserName: string;
  assignerUserId?: number;
  assignerUserName?: string;
  timestamp: string;
  read: boolean;
}

export class NotificationService {
  private redis = getRedis();

  async sendNotification(notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) {
    if (!this.redis) {
      console.warn('Redis not available, notification not sent');
      return;
    }

    const notificationData: NotificationData = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    // Store notification in database for persistence
    await this.storeNotificationInDatabase(notificationData);

    // Publish to user-specific channel (for real-time delivery to logged-in users)
    await this.redis.publish(
      `notifications:${notification.assignedUserId}`,
      JSON.stringify(notificationData)
    );

    return notificationData;
  }

  private async storeNotificationInDatabase(notification: NotificationData) {
    if (!this.redis) {
      console.warn('Redis not available, notification not stored');
      return;
    }

    try {
      // Store in Redis for quick access (this could be extended to use a proper database)
      await this.redis.lpush(`notifications:user:${notification.assignedUserId}`, JSON.stringify(notification));
      await this.redis.ltrim(`notifications:user:${notification.assignedUserId}`, 0, 99); // Keep last 100 notifications
    } catch (error) {
      console.error('Failed to store notification in database:', error);
    }
  }

  async notifyTaskAssigned({
    taskId,
    taskTitle,
    assignedUserId,
    assignedUserName,
    assignerUserId,
    assignerUserName,
    projectId,
    projectTitle,
  }: {
    taskId: number;
    taskTitle: string;
    assignedUserId: number;
    assignedUserName: string;
    assignerUserId: number;
    assignerUserName: string;
    projectId?: number;
    projectTitle?: string;
  }) {
    // Only notify if the assigner is different from the assignee (don't notify yourself)
    if (assignedUserId === assignerUserId) {
      console.log('Skipping notification: user assigned task to themselves');
      return null;
    }

    return this.sendNotification({
      type: 'task_assigned',
      title: 'New Task Assignment',
      message: `You have been assigned a new task: "${taskTitle}"${projectTitle ? ` in project "${projectTitle}"` : ''}`,
      taskId,
      taskTitle,
      projectId,
      projectTitle,
      assignedUserId,
      assignedUserName,
      assignerUserId,
      assignerUserName,
    });
  }

  async notifyTaskCompleted({
    taskId,
    taskTitle,
    completedByUserId,
    completedByUserName,
    assignerUserId,
    assignerUserName,
    projectId,
    projectTitle,
  }: {
    taskId: number;
    taskTitle: string;
    completedByUserId: number;
    completedByUserName: string;
    assignerUserId: number;
    assignerUserName: string;
    projectId?: number;
    projectTitle?: string;
  }) {
    // Only notify the assigner if they're different from the completer
    // (don't notify yourself about completing your own task)
    if (assignerUserId === completedByUserId) {
      console.log('Skipping notification: user completed their own task');
      return null;
    }

    return this.sendNotification({
      type: 'task_completed',
      title: 'Task Completed',
      message: `Task "${taskTitle}" has been completed by ${completedByUserName}${projectTitle ? ` in project "${projectTitle}"` : ''}`,
      taskId,
      taskTitle,
      projectId,
      projectTitle,
      assignedUserId: assignerUserId,
      assignedUserName: assignerUserName,
      assignerUserId: completedByUserId,
      assignerUserName: completedByUserName,
    });
  }

  async getUserNotifications(userId: number, limit = 50) {
    if (!this.redis) {
      return [];
    }

    try {
      const notifications = await this.redis.lrange(`notifications:user:${userId}`, 0, limit - 1);
      return notifications.map(notification => {
        try {
          return JSON.parse(notification);
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
  }

  async clearUserNotifications(userId: number) {
    if (!this.redis) {
      console.warn('Redis not available, notifications not cleared from server');
      return;
    }

    try {
      await this.redis.del(`notifications:user:${userId}`);
    } catch (error) {
      console.error('Error clearing user notifications from server:', error);
    }
  }

  async removeUserNotification(userId: number, notificationId: string) {
    if (!this.redis) {
      console.warn('Redis not available, notification not removed from server');
      return;
    }

    try {
      // Get all notifications for the user
      const notifications = await this.redis.lrange(`notifications:user:${userId}`, 0, -1);
      
      // Filter out the notification to remove
      const updatedNotifications = notifications.filter(notification => {
        try {
          const parsed = JSON.parse(notification);
          return parsed.id !== notificationId;
        } catch {
          return true; // Keep malformed notifications
        }
      });

      // Replace the entire list with the filtered notifications
      if (updatedNotifications.length > 0) {
        await this.redis.del(`notifications:user:${userId}`);
        for (const notification of updatedNotifications) {
          await this.redis.lpush(`notifications:user:${userId}`, notification);
        }
      } else {
        // If no notifications left, delete the key entirely
        await this.redis.del(`notifications:user:${userId}`);
      }
    } catch (error) {
      console.error('Error removing user notification from server:', error);
    }
  }

  async sendMentionNotification(
    mentionedUserId: number,
    commentAuthorName: string,
    commentId: number,
    commentBody: string,
    context: { projectTitle?: string; taskTitle?: string; projectId?: number; taskId?: number }
  ) {
    console.log('sendMentionNotification called with:', {
      mentionedUserId,
      commentAuthorName,
      commentId,
      commentBody,
      context
    });

    const title = 'You were mentioned in a comment';
    let message = `${commentAuthorName} mentioned you in a comment`;
    
    if (context.projectTitle) {
      message += ` on project "${context.projectTitle}"`;
    } else if (context.taskTitle) {
      message += ` on task "${context.taskTitle}"`;
    }

    // Add comment preview (truncated to 100 characters)
    const commentPreview = commentBody.length > 100 
      ? commentBody.substring(0, 100) + '...' 
      : commentBody;
    message += `: "${commentPreview}"`;

    console.log('Sending mention notification:', { title, message, mentionedUserId });

    return this.sendNotification({
      type: 'mention',
      title,
      message,
      commentId,
      projectId: context.projectId,
      projectTitle: context.projectTitle,
      taskId: context.taskId,
      taskTitle: context.taskTitle,
      assignedUserId: mentionedUserId,
      assignedUserName: '', // Will be filled by the system
      assignerUserId: undefined,
      assignerUserName: commentAuthorName,
    });
  }
}

export const notificationService = new NotificationService();
