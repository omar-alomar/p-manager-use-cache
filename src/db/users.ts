import prisma from "./db"

export async function getUsers() {
  "use cache"
  
  await wait(2000)
  
  return prisma.user.findMany()
}

export async function getUser(userId: string | number) {
  "use cache"
  
  await wait(2000)
  return prisma.user.findUnique({ where: { id: Number(userId) } })
}

export async function getUsersWithTasks() {
  "use cache"
  
  await wait(2000)
  
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

function wait(duration: number) {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}