'use server'

import prisma from '@/db/db'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getCurrentUser } from '@/auth/currentUser'
import { milestoneSchema } from '@/schemas/schemas'

export async function updateMilestoneCompletionAction(
  milestoneId: number,
  completed: boolean
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: 'Unauthorized' }
    }

    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: { completed },
      include: { project: true }
    })

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

export async function updateMilestoneAction(
  milestoneId: number,
  prevState: unknown,
  formData: FormData
) {
  const result = milestoneSchema.safeParse({
    date: formData.get("date"),
    item: formData.get("item"),
  })

  if (!result.success) {
    const errors: Record<string, string> = {}
    result.error.issues.forEach(issue => {
      if (issue.path[0]) errors[issue.path[0] as string] = issue.message
    })
    return { errors }
  }

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { errors: { general: 'Unauthorized' } }
    }

    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        date: new Date(result.data.date),
        item: result.data.item,
      },
      include: { project: true }
    })

    revalidatePath(`/projects/${updatedMilestone.projectId}`)
    revalidatePath('/projects')
    revalidateTag(`projects:id=${updatedMilestone.projectId}`)
    revalidateTag('projects:all')

    return { success: true }
  } catch (error) {
    console.error("Error updating milestone:", error)
    return { errors: { general: "Failed to update milestone. Please try again." } }
  }
}

export async function deleteMilestoneAction(milestoneId: number) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: 'Unauthorized' }
    }

    const milestone = await prisma.milestone.delete({
      where: { id: milestoneId },
      include: { project: true }
    })

    revalidatePath(`/projects/${milestone.projectId}`)
    revalidatePath('/projects')
    revalidateTag(`projects:id=${milestone.projectId}`)
    revalidateTag('projects:all')

    return { success: true, message: 'Milestone deleted successfully' }
  } catch (error) {
    console.error('Error deleting milestone:', error)
    return { success: false, message: 'Failed to delete milestone' }
  }
}
