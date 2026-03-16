"use server"

import { getUsers, deleteUserWithReassignment, getUserDeletionImpact, updateUserRole, updateUserEmail, updateUserPassword, updateUserLastSeenVersion, createUser } from "@/db/users"
import { Role } from "@prisma/client"
import { z } from "zod"
import { isBlocked } from "@/utils/maintenance"
import { getCurrentUser } from "@/auth/currentUser"

const MAINTENANCE_MSG = "Site is under maintenance. Please try again later."

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "admin"]).optional(),
})

export async function getUsersAction() {
  return await getUsers()
}

export async function getUserDeletionImpactAction(userId: string | number) {
  try {
    return await getUserDeletionImpact(userId)
  } catch (error: any) {
    throw error
  }
}

export async function deleteUserAction(userId: string | number, reassignToUserId: string | number) {
  if (await isBlocked()) return { success: false, message: MAINTENANCE_MSG }
  try {
    const currentUser = await getCurrentUser()
    await deleteUserWithReassignment(userId, reassignToUserId, currentUser?.id)
    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to delete user" }
  }
}

export async function updateUserRoleAction(userId: string | number, newRole: string) {
  if (await isBlocked()) return { success: false, message: MAINTENANCE_MSG }
  return await updateUserRole(userId, newRole)
}

export async function updateUserEmailAction(userId: string | number, newEmail: string) {
  if (await isBlocked()) return { success: false, message: MAINTENANCE_MSG }
  return await updateUserEmail(userId, newEmail)
}

export async function updateUserPasswordAction(userId: string | number, hashedPassword: string, salt: string) {
  if (await isBlocked()) return { success: false, message: MAINTENANCE_MSG }
  return await updateUserPassword(userId, hashedPassword, salt)
}

export async function updateUserLastSeenVersionAction(userId: string | number, version: string | null) {
  if (await isBlocked()) return { success: false, message: MAINTENANCE_MSG }
  return await updateUserLastSeenVersion(userId, version)
}

export async function createUserAction(prevState: unknown, formData: FormData) {
  if (await isBlocked()) return { success: false, error: MAINTENANCE_MSG }
  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as string | undefined,
  }

  const validation = createUserSchema.safeParse(rawData)

  if (!validation.success) {
    const errors: Record<string, string> = {}
    validation.error.issues.forEach((err) => {
      if (err.path[0]) {
        errors[err.path[0] as string] = err.message
      }
    })
    return { ...errors, success: false }
  }

  try {
    const user = await createUser({
      name: validation.data.name,
      email: validation.data.email,
      password: validation.data.password,
      role: validation.data.role as Role | undefined,
    })

    return { success: true, user }
  } catch (error: any) {
    return {
      error: error.message || "Failed to create user",
      success: false,
    }
  }
}