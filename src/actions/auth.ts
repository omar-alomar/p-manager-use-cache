"use server"

import { z } from "zod"
import { signInSchema, signUpSchema } from "../schemas/schemas"
import prisma from "@/db/db"
import {
  comparePasswords,
  generateSalt,
  hashPassword,
} from "../auth/passwordHasher"
import { cookies } from "next/headers"
import { createUserSession, removeUserFromSession } from "../auth/session"

export const runtime = "nodejs";
export const revalidate = 0; // or: export const dynamic = "force-dynamic";

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