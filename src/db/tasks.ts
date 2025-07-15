import prisma from "./db"
import { revalidateTag, unstable_cache } from "next/cache"

export async function getTasks() {
  "use cache"
  
  // Add cache tags
  cacheTag("tasks:all")

  await wait(2000)

  return prisma.task.findMany()
}

export async function getUserTasks(userId: string | number) {
  "use cache"
  
  // Add cache tags
  cacheTag("tasks:all")
  cacheTag(`tasks:userId=${userId}`)

  await wait(2000)
  return prisma.task.findMany({ where: { userId: Number(userId) } })
}

export async function getProjectTasks(projectId: string | number) {
  "use cache"
  
  // Add cache tags
  cacheTag("tasks:all")
  cacheTag(`tasks:projectId=${projectId}`)

  await wait(2000)
  return prisma.task.findMany({ where: { projectId: Number(projectId) } })
}

export async function getTask(taskId: string | number) {
  "use cache"
  
  // Add cache tags
  cacheTag(`tasks:id=${taskId}`)
  
  return prisma.task.findUnique({ where: { id: Number(taskId) } })
}

export async function createTask({
  title,
  completed,
  userId,
  projectId,
}: {
  title: string
  completed: boolean
  userId: number
  projectId: number
}) {
  await wait(2000)
  const task = await prisma.task.create({
    data: {
      title,
      completed,
      userId,
      projectId,
    },
  })

  revalidateTag("tasks:all")
  revalidateTag(`tasks:userId=${task.userId}`)
  revalidateTag(`tasks:projectId=${task.projectId}`)

  return task
}

export async function updateTask(
  taskId: string | number,
  {
    title,
    completed,
    userId,
    projectId
   }:{
     title: string,
     completed: boolean,
     userId: number,
     projectId: number

  }) {
  console.log('updateTask called with:', { taskId, title, completed, userId, projectId })
  
  await wait(2000)
  
  const task = await prisma.task.update({
    where: { id: Number(taskId) },
    data: {
      title,
      completed,
      userId,
      projectId
    },
  })
  
  console.log('Task after update:', task)

  // Revalidate all relevant caches
  revalidateTag("tasks:all")
  revalidateTag(`tasks:id=${task.id}`)
  revalidateTag(`tasks:userId=${task.userId}`)
  revalidateTag(`tasks:projectId=${task.projectId}`)

  return task
}

export async function deleteTask(taskId: string | number) {
  await wait(2000)

  const task = await prisma.task.delete({ where: { id: Number(taskId) } })

  revalidateTag("tasks:all")
  revalidateTag(`tasks:userId=${task.userId}`)
  revalidateTag(`tasks:projectId=${task.projectId}`)

  return task
}

function wait(duration: number) {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}

// Helper function to add cache tags
function cacheTag(tag: string) {
  // This is a placeholder - Next.js should handle this with "use cache"
  // But we need to ensure the tags are properly associated
}