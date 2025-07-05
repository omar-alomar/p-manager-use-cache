import { PrismaClient } from "@prisma/client"
import seedData from "./seed.json"

const prisma = new PrismaClient()

async function createUsers() {
  await prisma.user.deleteMany()
  return Promise.all(
    seedData.users.map(async user => {
      return prisma.user.create({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
    })
  )
}

async function createTasks() {
  await prisma.task.deleteMany()
  return Promise.all(
    seedData.tasks.map(async task => {
      return prisma.task.create({
        data: {
          id: task.id,
          title: task.title,
          completed: task.completed,
          userId: task.userId,
        },
      })
    })
  )
}

async function createProjects() {
  await prisma.project.deleteMany()
  return Promise.all(
    seedData.projects.map(async project => {
      return prisma.project.create({
        data: {
          id: project.id,
          title: project.title,
          client: project.client,
          body: project.body,
          userId: project.userId,
          apfo: project.apfo
        },
      })
    })
  )
}

async function createComments() {
  await prisma.comment.deleteMany()
  return Promise.all(
    seedData.comments.map(async comment => {
      return prisma.comment.create({
        data: {
          id: comment.id,
          email: comment.email,
          body: comment.body,
          projectId: comment.projectId,
        },
      })
    })
  )
}

async function main() {
  await createUsers()
  await createTasks()
  await createProjects()
  await createComments()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
