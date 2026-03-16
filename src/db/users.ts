import prisma from "./db"
import { revalidateTag, revalidatePath } from "next/cache"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { Role } from "@prisma/client"
import { generateSalt, hashPassword } from "../auth/passwordHasher"


export async function getUsers() {
  "use cache"
  cacheTag("users:all")

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
  cacheTag(`users:id=${userId}`)

  return prisma.user.findUnique({ where: { id: Number(userId) } })
}

export async function getUsersWithTasks() {
  "use cache"
  cacheTag("users:all")

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

export async function getUserDeletionImpact(userId: string | number) {
  const id = Number(userId)

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new Error(`User with id ${userId} not found`)

  const [projects, tasks] = await Promise.all([
    prisma.project.findMany({
      where: { userId: id },
      select: { id: true, title: true }
    }),
    prisma.task.findMany({
      where: { userId: id },
      select: { id: true, title: true, projectId: true, completed: true }
    })
  ])

  const managedProjectIds = new Set(projects.map(p => p.id))

  // Tasks on projects they manage (all come with the project)
  const projectTasks = tasks.filter(t => t.projectId && managedProjectIds.has(t.projectId))
  // Standalone uncompleted tasks not on their managed projects
  const stragglerTasks = tasks.filter(
    t => (!t.projectId || t.projectId === 0 || !managedProjectIds.has(t.projectId)) && !t.completed
  )

  return {
    user: { id: user.id, name: user.name },
    projects,
    projectTasks,
    stragglerTasks
  }
}

export async function deleteUserWithReassignment(userId: string | number, reassignToUserId: string | number) {
  const id = Number(userId)
  const reassignId = Number(reassignToUserId)

  const [user, reassignTo] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.user.findUnique({ where: { id: reassignId } })
  ])

  if (!user) throw new Error(`User with id ${userId} not found`)
  if (!reassignTo) throw new Error(`Reassignment target user with id ${reassignToUserId} not found`)
  if (id === reassignId) throw new Error("Cannot reassign to the same user being deleted")

  // Get managed project IDs before transaction
  const managedProjects = await prisma.project.findMany({
    where: { userId: id },
    select: { id: true }
  })
  const managedProjectIds = managedProjects.map(p => p.id)

  await prisma.$transaction([
    // Reassign all projects managed by this user
    prisma.project.updateMany({
      where: { userId: id },
      data: { userId: reassignId }
    }),
    // Reassign all tasks on managed projects assigned to this user (completed or not — they belong to the project)
    ...(managedProjectIds.length > 0 ? [
      prisma.task.updateMany({
        where: { userId: id, projectId: { in: managedProjectIds } },
        data: { userId: reassignId }
      })
    ] : []),
    // Reassign straggler uncompleted tasks (not on managed projects)
    prisma.task.updateMany({
      where: {
        userId: id,
        completed: false,
        ...(managedProjectIds.length > 0
          ? { NOT: { projectId: { in: managedProjectIds } } }
          : {})
      },
      data: { userId: reassignId }
    }),
    // Delete user — cascades: completed straggler tasks, comments, mentions, notifications
    prisma.user.delete({ where: { id } })
  ])

  revalidateTag("users:all")
  revalidateTag(`users:id=${id}`)
  revalidateTag(`users:id=${reassignId}`)
  revalidateTag("projects:all")
  revalidateTag(`projects:userId=${id}`)
  revalidateTag(`projects:userId=${reassignId}`)
  revalidateTag("tasks:all")
  revalidateTag(`tasks:userId=${id}`)
  revalidateTag(`tasks:userId=${reassignId}`)
  revalidatePath("/admin")
  revalidatePath("/users")
  revalidatePath("/projects")
  revalidatePath("/tasks")

  return user
}

export async function updateUserRole(userId: string | number, newRole: string) {
  const user = await prisma.user.update({
    where: { id: Number(userId) },
    data: { role: newRole as Role }
  })

  revalidateTag("users:all")
  revalidateTag(`users:id=${user.id}`)

  return user
}

export async function updateUserEmail(userId: string | number, newEmail: string) {
  const user = await prisma.user.update({
    where: { id: Number(userId) },
    data: { email: newEmail }
  })

  revalidateTag("users:all")
  revalidateTag(`users:id=${user.id}`)

  return user
}

export async function updateUserPassword(userId: string | number, hashedPassword: string, salt: string) {
  const user = await prisma.user.update({
    where: { id: Number(userId) },
    data: { 
      password: hashedPassword,
      salt: salt
    }
  })

  revalidateTag("users:all")
  revalidateTag(`users:id=${user.id}`)

  return user
}

export async function updateUserLastSeenVersion(userId: string | number, version: string | null) {
  const user = await prisma.user.update({
    where: { id: Number(userId) },
    data: { lastSeenVersion: version }
  })

  revalidateTag("users:all")
  revalidateTag(`users:id=${user.id}`)

  return user
}

export async function createUser(data: {
  name: string
  email: string
  password: string
  role?: Role
}) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  })

  if (existingUser) {
    throw new Error("User with this email already exists")
  }

  // Hash password
  const salt = generateSalt()
  const hashedPassword = await hashPassword(data.password, salt)

  // Create user
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      salt,
      role: data.role || Role.user
    }
  })

  revalidateTag("users:all")
  revalidatePath("/admin")
  revalidatePath("/users")

  return user
}

