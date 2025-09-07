import { cookies } from "next/headers"
import { getUserFromSession } from "../auth/session"
import { cache } from "react"
import { redirect } from "next/navigation"
import prisma from "@/db/db"

type FullUser = Exclude<
  Awaited<ReturnType<typeof getUserFromDb>>,
  undefined | null
>

type User = Exclude<
  Awaited<ReturnType<typeof getUserFromSession>>,
  undefined | null
>

function _getCurrentUser(options: {
  withFullUser: true
  redirectIfNotFound: true
}): Promise<FullUser>
function _getCurrentUser(options: {
  withFullUser: true
  redirectIfNotFound?: false
}): Promise<FullUser | null>
function _getCurrentUser(options: {
  withFullUser?: false
  redirectIfNotFound: true
}): Promise<User>
function _getCurrentUser(options?: {
  withFullUser?: false
  redirectIfNotFound?: false
}): Promise<User | null>
async function _getCurrentUser({
  withFullUser = false,
  redirectIfNotFound = false,
} = {}) {
  console.log("_getCurrentUser: Starting...")
  const user = await getUserFromSession(await cookies())
  console.log("_getCurrentUser: Got session user:", user ? "found" : "null")

  if (user == null) {
    if (redirectIfNotFound) return redirect("/login")
    return null
  }

  if (withFullUser) {
    console.log("_getCurrentUser: Getting full user from DB...")
    const fullUser = await getUserFromDb(user.id)
    console.log("_getCurrentUser: Got full user:", fullUser ? "found" : "null")
    
    // If user exists in session but not in database, clear the session and redirect
    if (fullUser == null) {
      console.log("_getCurrentUser: User not found in database, clearing session...")
      const { clearInvalidSession } = await import("../actions/auth")
      await clearInvalidSession()
      
      if (redirectIfNotFound) return redirect("/login")
      return null
    }
    
    return fullUser
  }

  return user
}

export const getCurrentUser = cache(_getCurrentUser)

function getUserFromDb(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: { 
      id: true, 
      email: true, 
      role: true, 
      name: true 
    }
  })
}