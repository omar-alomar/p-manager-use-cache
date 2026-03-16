import prisma from "./db"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { revalidateTag } from "next/cache"


export async function getProjectComments(projectId: string | number) {
  "use cache"
  cacheTag(`comments:projectId=${projectId}`)

  return prisma.comment.findMany({ 
    where: { projectId: Number(projectId) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getTaskComments(taskId: string | number) {
  "use cache"
  cacheTag(`comments:taskId=${taskId}`)

  return prisma.comment.findMany({ 
    where: { taskId: Number(taskId) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createComment(projectId: string | number | null, taskId: string | number | null, email: string, body: string, userId: number) {
  const comment = await prisma.comment.create({
    data: {
      projectId: projectId ? Number(projectId) : null,
      taskId: taskId ? Number(taskId) : null,
      email,
      body,
      userId
    }
  })

  if (projectId) revalidateTag(`comments:projectId=${projectId}`)
  if (taskId) revalidateTag(`comments:taskId=${taskId}`)

  return comment
}

export async function deleteComment(commentId: number) {
  const comment = await prisma.comment.delete({
    where: { id: commentId }
  })

  if (comment.projectId) revalidateTag(`comments:projectId=${comment.projectId}`)
  if (comment.taskId) revalidateTag(`comments:taskId=${comment.taskId}`)

  return comment
}

