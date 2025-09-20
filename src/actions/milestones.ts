'use server'

import prisma from '@/db/db'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getCurrentUser } from '@/auth/currentUser'

export async function updateMilestoneCompletionAction(
  milestoneId: number,
  completed: boolean
) {
  try {
    // Get current user for authorization
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: 'Unauthorized' }
    }

    // Update the milestone
    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: { completed },
      include: { project: true }
    })

    // Revalidate relevant caches
    revalidatePath(`/projects/${updatedMilestone.projectId}`)
    revalidatePath('/projects')
    revalidateTag(`projects:id=${updatedMilestone.projectId}`)
    revalidateTag('projects:all')

    return { 
      success: true, 
      message: `Milestone ${completed ? 'completed' : 'uncompleted'} successfully`,
      milestone: updatedMilestone
    }
  } catch (error) {
    console.error('Error updating milestone completion:', error)
    return { 
      success: false, 
      message: 'Failed to update milestone completion status' 
    }
  }
}
