import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/services/notificationService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: userIdParam } = await params;
    const userId = parseInt(userIdParam);
    
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const notifications = await notificationService.getUserNotifications(userId);
    
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: userIdParam } = await params;
    const userId = parseInt(userIdParam);
    
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Check if it's a specific notification removal or clear all
    const url = new URL(request.url);
    const notificationId = url.searchParams.get('notificationId');
    
    if (notificationId) {
      // Remove specific notification
      await notificationService.removeUserNotification(userId, notificationId);
    } else {
      // Clear all notifications
      await notificationService.clearUserNotifications(userId);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error managing user notifications:', error);
    return NextResponse.json({ error: 'Failed to manage notifications' }, { status: 500 });
  }
}
