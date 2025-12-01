import prisma from "./db"
import { Prisma } from "@prisma/client"

export async function getTasks() {
  "use cache"
  
  await wait(500)
  return prisma.task.findMany({
    include: {
      Project: true,
      User: true
    },
    orderBy: [
      { createdAt: 'desc' }
    ]
  })
}

export async function getTasksByCompletion(completed: boolean) {
  "use cache"
  
  await wait(500)
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
  
  await wait(500)
  return prisma.task.findMany({ 
    where: { userId: Number(userId) },
    include: {
      Project: true,
      User: true
    },
    orderBy: [
      { createdAt: 'desc' }
    ]
  })
}

export async function getProjectTasks(projectId: string | number) {
  "use cache"
  
  await wait(500)
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
  
  await wait(500)
  return prisma.task.findUnique({
    where: { id: Number(taskId) },
    include: {
      Project: true,
      User: true
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
  
  // Use a transaction to ensure atomicity and prevent race conditions
  const result = await prisma.$transaction(async (tx) => {
    return tx.$queryRaw<Array<{
      id: number
      title: string
      completed: boolean
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
        id, title, completed, urgency, "userId", "assignedById", "projectId", "createdAt", "updatedAt"
      )
      SELECT 
        next_id,
        ${title},
        ${completed},
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

  // Return in Prisma format
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
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
    projectId
   }:{
     title: string,
     completed: boolean,
     urgency?: string | null,
     userId: number,
     projectId?: number
  }) {
  console.log('updateTask called with:', { taskId, title, completed, userId, projectId })
  
  // Use transaction for consistency
  const task = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: Number(taskId) },
      data: {
        title,
        completed,
        urgency: urgency as any || 'MEDIUM',
        userId,
        projectId: projectId || null,
        updatedAt: new Date()
      },
    })
    
    // Verify the update within the transaction
    const verified = await tx.task.findUnique({
      where: { id: Number(taskId) }
    })
    
    console.log('Task after update (in transaction):', verified)
    
    return updated
  })
  
  // Double-check outside transaction
  const finalCheck = await prisma.task.findUnique({
    where: { id: Number(taskId) }
  })
  console.log('Final task state:', finalCheck)

  return task
}

export async function deleteTask(taskId: string | number) {
  const task = await prisma.$transaction(async (tx) => {
    return tx.task.delete({ where: { id: Number(taskId) } })
  })

  return task
}

function wait(duration: number) {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}