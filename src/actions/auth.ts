"use server"

import { z } from "zod"
import { signInSchema, signUpSchema, updateProfileSchema, changePasswordSchema } from "../schemas/schemas"
import prisma from "@/db/db"
import {
  comparePasswords,
  generateSalt,
  hashPassword,
} from "../auth/passwordHasher"
import { cookies } from "next/headers"
import { createUserSession, removeUserFromSession } from "../auth/session"
import { getCurrentUser } from "../auth/currentUser"


export async function signIn(unsafeData: z.infer<typeof signInSchema>) {
  const { success, data } = signInSchema.safeParse(unsafeData)

  if (!success) return "Unable to log you in"

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: { 
      password: true, 
      salt: true, 
      id: true, 
      email: true, 
      role: true 
    }
  })

  if (user == null || user.password == null || user.salt == null) {
    return "Unable to log you in"
  }

  const isCorrectPassword = await comparePasswords({
    hashedPassword: user.password,
    password: data.password,
    salt: user.salt,
  })

  if (!isCorrectPassword) return "Unable to log you in"

  await createUserSession({ id: user.id, role: user.role as "user" | "admin" }, await cookies())

  // Return null to indicate success (no error)
  return null
}

export async function signUp(unsafeData: z.infer<typeof signUpSchema>) {
  const { success, data } = signUpSchema.safeParse(unsafeData) // zod; type safety.

  if (!success) return "Unable to create account"

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  })

  if (existingUser != null) return "Account already exists for this email"

  try {
    const salt = generateSalt()
    const hashedPassword = await hashPassword(data.password, salt)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        salt,
        role: 'user' // Set default role
      },
      select: { 
        id: true, 
        role: true 
      }
    })

    if (user == null) return "Unable to create account"
    
    await createUserSession({ id: user.id, role: user.role as "user" | "admin" }, await cookies())
  } catch (error) {
    console.error("Signup error:", error)
    return "Unable to create account"
  }

  // Return null to indicate success (no error)
  return null
}

export async function logOut() {
  try {
    console.log("Logout: Starting...")
    await removeUserFromSession(await cookies())
    console.log("Logout: Success")
    // Return null to indicate success (no error)
    return null
  } catch (error) {
    console.error("Logout error:", error)
    return "Logout failed"
  }
}

export async function updateProfile(unsafeData: z.infer<typeof updateProfileSchema>) {
  const { success, data } = updateProfileSchema.safeParse(unsafeData)

  if (!success) return "Invalid profile data"

  try {
    // Get current user from session
    const currentUser = await getCurrentUser({ redirectIfNotFound: true })
    
    // Update user profile
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { name: data.name }
    })

    return null // Success
  } catch (error) {
    console.error("Update profile error:", error)
    return "Failed to update profile"
  }
}

export async function changePassword(unsafeData: z.infer<typeof changePasswordSchema>) {
  const { success, data } = changePasswordSchema.safeParse(unsafeData)

  if (!success) return "Invalid password data"

  try {
    // Get current user from session
    const currentUser = await getCurrentUser({ redirectIfNotFound: true })
    
    // Get user with password data
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { password: true, salt: true }
    })

    if (!user || !user.password || !user.salt) {
      return "User not found or invalid password setup"
    }

    // Verify current password
    const isCorrectPassword = await comparePasswords({
      hashedPassword: user.password,
      password: data.currentPassword,
      salt: user.salt,
    })

    if (!isCorrectPassword) return "Current password is incorrect"

    // Hash new password
    const newSalt = generateSalt()
    const hashedNewPassword = await hashPassword(data.newPassword, newSalt)

    // Update password
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { 
        password: hashedNewPassword,
        salt: newSalt
      }
    })

    return null // Success
  } catch (error) {
    console.error("Change password error:", error)
    return "Failed to change password"
  }
}