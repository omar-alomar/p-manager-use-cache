import prisma from "./db"
import { Prisma } from "@prisma/client"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { revalidateTag } from "next/cache"


export async function getTasks() {
  "use cache"
  cacheTag("tasks:all")

  return prisma.task.findMany({
    include: {
      Project: true,
      User: true,
      AssignedBy: true
    },
    orderBy: [
      { createdAt: 'desc' }
    ]
  })
}

export async function getTasksByCompletion(completed: boolean) {
  "use cache"
  cacheTag("tasks:all")

  return prisma.task.findMany({ 
    where: { completed },
    include: {
      Project: true,
      User: true
    },
    orderBy: [
      { createdAt: 'desc' }
    ]
  })
}



export async function getUserTasks(userId: string | number) {
  "use cache"
  cacheTag(`tasks:userId=${userId}`)

  return prisma.task.findMany({
    where: { userId: Number(userId) },
    include: {
      Project: true,
      User: true,
      AssignedBy: true
    },
    orderBy: [
      { createdAt: 'desc' }
    ]
  })
}

export async function getTasksAssignedByUser(userId: string | number) {
  "use cache"
  cacheTag(`tasks:assignedBy=${userId}`)

  return prisma.task.findMany({
    where: {
      assignedById: Number(userId),
      NOT: { userId: Number(userId) }
    },
    include: {
      Project: true,
      User: true,
      AssignedBy: true
    },
    orderBy: [
      { createdAt: 'desc' }
    ]
  })
}

export async function getProjectTasks(projectId: string | number) {
  "use cache"
  cacheTag(`tasks:projectId=${projectId}`)

  return prisma.task.findMany({ 
    where: { projectId: Number(projectId) },
    include: {
      Project: true,
      User: true
    }
  })
}

export async function getTask(taskId: string | number) {
  "use cache"
  cacheTag(`tasks:id=${taskId}`)

  return prisma.task.findUnique({
    where: { id: Number(taskId) },
    include: {
      Project: true,
      User: true,
      AssignedBy: true
    }
  })
}

export async function createTask({
  title,
  completed,
  urgency,
  userId,
  projectId,
  assignedById,
}: {
  title: string
  completed: boolean
  urgency?: string | null
  userId: number
  projectId?: number
  assignedById?: number
}) {
  // Use raw SQL with explicit ID calculation - completely bypass sequence
  const urgencyValue = urgency || 'MEDIUM'
  const projectIdValue = projectId && projectId > 0 ? projectId : null
  const assignedByIdValue = assignedById || null
  const completedAtValue = completed ? new Date() : null

  // Use a transaction to ensure atomicity and prevent race conditions
  const result = await prisma.$transaction(async (tx) => {
    return tx.$queryRaw<Array<{
      id: number
      title: string
      completed: boolean
      completedAt: Date | null
      urgency: string | null
      userId: number
      assignedById: number | null
      projectId: number | null
      createdAt: Date
      updatedAt: Date
    }>>(Prisma.sql`
      WITH max_id AS (
        SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM "Task"
      )
      INSERT INTO "Task" (
        id, title, completed, "completedAt", urgency, "userId", "assignedById", "projectId", "createdAt", "updatedAt"
      )
      SELECT
        next_id,
        ${title},
        ${completed},
        ${completedAtValue}::timestamp,
        ${urgencyValue}::"Urgency",
        ${userId},
        ${assignedByIdValue},
        ${projectIdValue},
        NOW(),
        NOW()
      FROM max_id
      RETURNING *;
    `)
  })

  const task = result[0]

  if (!task) {
    throw new Error('Failed to create task')
  }

  revalidateTag("tasks:all")
  if (task.userId) revalidateTag(`tasks:userId=${task.userId}`)
  if (assignedById) revalidateTag(`tasks:assignedBy=${assignedById}`)
  if (task.projectId) revalidateTag(`tasks:projectId=${task.projectId}`)

  // Return in Prisma format
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    completedAt: task.completedAt,
    urgency: task.urgency as any,
    userId: task.userId,
    assignedById: task.assignedById,
    projectId: task.projectId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }
}

export async function updateTask(
  taskId: string | number,
  {
    title,
    completed,
    urgency,
    userId,
    projectId,
    completedAt
   }:{
     title: string,
     completed: boolean,
     urgency?: string | null,
     userId: number,
     projectId?: number
     completedAt?: Date | null
  }) {
  // Fetch old task to know if projectId is changing
  const oldTask = await prisma.task.findUnique({ where: { id: Number(taskId) }, select: { projectId: true, userId: true } })

  const task = await prisma.task.update({
    where: { id: Number(taskId) },
    data: {
      title,
      completed,
      completedAt,
      urgency: urgency as any || 'MEDIUM',
      userId,
      projectId: projectId || null,
      updatedAt: new Date()
    },
  })

  revalidateTag("tasks:all")
  revalidateTag(`tasks:id=${taskId}`)
  revalidateTag(`tasks:userId=${userId}`)
  if (oldTask?.userId && oldTask.userId !== userId) revalidateTag(`tasks:userId=${oldTask.userId}`)
  if (projectId) revalidateTag(`tasks:projectId=${projectId}`)
  if (oldTask?.projectId && oldTask.projectId !== projectId) revalidateTag(`tasks:projectId=${oldTask.projectId}`)

  return task
}

export async function deleteTask(taskId: string | number) {
  const task = await prisma.$transaction(async (tx) => {
    return tx.task.delete({ where: { id: Number(taskId) } })
  })

  revalidateTag("tasks:all")
  revalidateTag(`tasks:id=${taskId}`)
  revalidateTag(`tasks:userId=${task.userId}`)
  if (task.projectId) revalidateTag(`tasks:projectId=${task.projectId}`)

  return task
}

