import { PrismaClient, Role } from "@prisma/client"
import seedData from "./seed.json"
import { convertToUTCISO } from "../src/utils/dateUtils"

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
          password: user.password,
          salt: user.salt,
          role: user.role as Role,
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
          projectId: task.projectId
        },
      })
    })
  )
}

async function createProjects() {
  await prisma.project.deleteMany()
  return Promise.all(
    seedData.projects.map(async project => {
      // Convert MM/DD/YYYY string to ISO date string (UTC)
      const convertMilestoneDate = (dateStr: string) => {
        return convertToUTCISO(dateStr)
      }

      return prisma.project.create({
        data: {
          id: project.id,
          title: project.title,
          body: project.body,
          userId: project.userId,
          milestone: convertMilestoneDate(project.milestone),
          mbaNumber: project.mbaNumber,
          coFileNumbers: project.coFileNumbers,
          dldReviewer: project.dldReviewer,
          clientId: project.clientId,
        },
      })
    })
  )
}

async function createClients() {
  await prisma.client.deleteMany()
  return Promise.all(
    seedData.clients.map(async client => {
      return prisma.client.create({
        data: {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
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
          userId: 1, // Assign to first user
        },
      })
    })
  )
}

async function createMilestones() {
  await prisma.milestone.deleteMany()
  return Promise.all(
    seedData.milestones.map(async milestone => {
      // Convert MM/DD/YYYY string to ISO date string
      const convertMilestoneDate = (dateStr: string) => {
        const [month, day, year] = dateStr.split('/')
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString()
      }

      return prisma.milestone.create({
        data: {
          id: milestone.id,
          projectId: milestone.projectId,
          date: convertMilestoneDate(milestone.date),
          item: milestone.item,
        },
      })
    })
  )
}

async function main() {
  await createUsers()
  await createClients()
  await createProjects()
  await createTasks()
  await createComments()
  await createMilestones()
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
