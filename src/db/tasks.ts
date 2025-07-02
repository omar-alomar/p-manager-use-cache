import prisma from "./db"

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

function wait(duration: number) {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}
