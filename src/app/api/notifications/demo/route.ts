import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/services/notificationService';

export async function POST(request: NextRequest) {
  try {
    const { type, userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    if (type === 'task_assigned') {
      await notificationService.notifyTaskAssigned({
        taskId: 999,
        taskTitle: 'Demo Task Assignment',
        assignedUserId: userId,
        assignedUserName: 'Demo User',
        assignerUserId: 1,
        assignerUserName: 'Demo Assigner',
        projectId: 1,
        projectTitle: 'Demo Project',
      });
    } else if (type === 'task_completed') {
      await notificationService.notifyTaskCompleted({
        taskId: 999,
        taskTitle: 'Demo Task Completion',
        completedByUserId: userId,
        completedByUserName: 'Demo User',
        assignerUserId: 1,
        assignerUserName: 'Demo Assigner',
        projectId: 1,
        projectTitle: 'Demo Project',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating demo notification:', error);
    return NextResponse.json({ error: 'Failed to create demo notification' }, { status: 500 });
  }
}
