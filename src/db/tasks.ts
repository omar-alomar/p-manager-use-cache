import prisma from "./db"
import { revalidateTag } from "next/cache"

export async function getTasks() {
  "use cache"

  await wait(2000)

  return prisma.task.findMany()
}

export async function getUserTasks(userId: string | number) {
  "use cache"

  await wait(2000)
  return prisma.task.findMany({ where: { userId: Number(userId) } })
}

export async function getProjectTasks(projectId: string | number) {
  "use cache"

  await wait(2000)
  return prisma.task.findMany({ where: { projectId: Number(projectId) } })
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
  revalidateTag(`tasks:id=${task.id}`)
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

  revalidateTag("tasks:all")
  revalidateTag(`tasks:id=${task.id}`)
  revalidateTag(`tasks:projectId=${task.projectId}`)

  return task
}

export async function deleteTask(taskId: string | number) {
  await wait(2000)

  const task = await prisma.task.delete({ where: { id: Number(taskId) } })

  revalidateTag("tasks:all")
  revalidateTag(`tasks:id=${task.id}`)
  revalidateTag(`tasks:projectId=${task.projectId}`)

  return task
}

function wait(duration: number) {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}
