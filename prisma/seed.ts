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
          website: user.website,
          companyName: user.company.name,
          city: user.address.city,
          street: user.address.street,
          suite: user.address.suite,
          zipcode: user.address.zipcode,
        },
      })
    })
  )
}

async function createTodos() {
  await prisma.todo.deleteMany()
  return Promise.all(
    seedData.todos.map(async todo => {
      return prisma.todo.create({
        data: {
          id: todo.id,
          title: todo.title,
          completed: todo.completed,
          userId: todo.userId,
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
          body: project.body,
          userId: project.userId,
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
  await createTodos()
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
