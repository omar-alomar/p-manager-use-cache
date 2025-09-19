import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/services/notificationService';

export async function POST(request: NextRequest) {
  try {
    const { type, assignedUserId, assignerUserId } = await request.json();
    
    if (type === 'task_assigned') {
      await notificationService.notifyTaskAssigned({
        taskId: 999,
        taskTitle: 'Test Task Assignment',
        assignedUserId: assignedUserId,
        assignedUserName: 'Test User',
        assignerUserId: assignerUserId,
        assignerUserName: 'Test Assigner',
        projectId: 1,
        projectTitle: 'Test Project',
      });
    } else if (type === 'task_completed') {
      await notificationService.notifyTaskCompleted({
        taskId: 999,
        taskTitle: 'Test Task Completion',
        completedByUserId: assignedUserId,
        completedByUserName: 'Test User',
        assignerUserId: assignerUserId,
        assignerUserName: 'Test Assigner',
        projectId: 1,
        projectTitle: 'Test Project',
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Test ${type} notification sent`,
      assignedUserId,
      assignerUserId,
      shouldNotify: assignedUserId !== assignerUserId
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json({ error: 'Failed to send test notification' }, { status: 500 });
  }
}
