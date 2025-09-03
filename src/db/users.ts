import prisma from "./db"
import { revalidateTag } from "next/cache"

export async function getUsers() {
  "use cache"
  
  await wait(500)
  
  return prisma.user.findMany({
    include: {
      projects: true,
      tasks: true
    },
    orderBy: {
      name: 'asc'
    }
  })
}

export async function getUser(userId: string | number) {
  "use cache"
  
  await wait(500)
  return prisma.user.findUnique({ where: { id: Number(userId) } })
}

export async function getUsersWithTasks() {
  "use cache"
  
  await wait(500)
  
  // This query should only return users who have at least one task
  const usersWithTasks = await prisma.user.findMany({
    where: {
      tasks: {
        some: {} // Only users who have at least one task
      }
    },
    include: {
      tasks: {
        include: {
          Project: true
        },
        orderBy: {
          createdAt: 'desc' // Order tasks by creation date
        }
      }
    },
    orderBy: {
      name: 'asc' // Order users alphabetically
    }
  })
  
  // // Log for debugging - remove in production
  // console.log(`Found ${usersWithTasks.length} users with tasks`)
  // usersWithTasks.forEach(user => {
  //   console.log(`${user.name}: ${user.tasks.length} tasks`)
  // })
  
  return usersWithTasks
}

export async function deleteUser(userId: string | number) {
  await wait(500)

  const user = await prisma.user.delete({ where: { id: Number(userId) } })

  revalidateTag("users:all")
  revalidateTag(`users:id=${user.id}`)

  return user
}

function wait(duration: number) {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}