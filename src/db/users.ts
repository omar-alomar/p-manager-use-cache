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

export async function deleteUser(userId: string | number) {
  const id = Number(userId)
  
  // Check if user exists first
  const user = await prisma.user.findUnique({ 
    where: { id } 
  })

  if (!user) {
    throw new Error(`User with id ${userId} not found`)
  }

  // Delete the user
  await prisma.user.delete({ where: { id } })

  revalidateTag("users:all")
  revalidateTag(`users:id=${id}`)
  revalidatePath("/admin")
  revalidatePath("/users")

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

