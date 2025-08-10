import { z } from "zod"
import crypto from "crypto"
import { redisClient } from "../redis/redis"

// Define user roles as a const array
export const userRoles = ["user", "admin"] as const

// Seven days in seconds
const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7
const COOKIE_SESSION_KEY = "session-id"

const sessionSchema = z.object({
  id: z.number(), // Changed from string to number to match Prisma's Int id
  role: z.enum(userRoles),
})

type UserSession = z.infer<typeof sessionSchema>
export type Cookies = {
  set: (
    key: string,
    value: string,
    options: {
      secure?: boolean
      httpOnly?: boolean
      sameSite?: "strict" | "lax"
      expires?: number
    }
  ) => void
  get: (key: string) => { name: string; value: string } | undefined
  delete: (key: string) => void
}

export function getUserFromSession(cookies: Pick<Cookies, "get">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value
  if (sessionId == null) return null

  return getUserSessionById(sessionId)
}

export async function updateUserSessionData(
  user: UserSession,
  cookies: Pick<Cookies, "get">
) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value
  if (sessionId == null) return null

  await redisClient.setex(`session:${sessionId}`, SESSION_EXPIRATION_SECONDS, JSON.stringify(sessionSchema.parse(user)))
}

export async function createUserSession(
  user: UserSession,
  cookies: Pick<Cookies, "set">
) {
  const sessionId = crypto.randomBytes(512).toString("hex").normalize()
  
  const sessionData = sessionSchema.parse(user)
  
  const jsonData = JSON.stringify(sessionData)
  
  try {
    await redisClient.setex(`session:${sessionId}`, SESSION_EXPIRATION_SECONDS, jsonData)
  } catch (error) {
    console.error("Redis SET failed:", error)
    throw error
  }

  setCookie(sessionId, cookies)
}

export async function updateUserSessionExpiration(
  cookies: Pick<Cookies, "get" | "set">
) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value
  if (sessionId == null) return null

  const user = await getUserSessionById(sessionId)
  if (user == null) return

  await redisClient.setex(`session:${sessionId}`, SESSION_EXPIRATION_SECONDS, JSON.stringify(user))
  setCookie(sessionId, cookies)
}

export async function removeUserFromSession(
  cookies: Pick<Cookies, "get" | "delete">
) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value
  if (sessionId == null) return null

  await redisClient.del(`session:${sessionId}`)
  cookies.delete(COOKIE_SESSION_KEY)
}

function setCookie(sessionId: string, cookies: Pick<Cookies, "set">) {
  cookies.set(COOKIE_SESSION_KEY, sessionId, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    expires: Date.now() + SESSION_EXPIRATION_SECONDS * 1000,
  })
}

async function getUserSessionById(sessionId: string) {
  const rawUser = await redisClient.get(`session:${sessionId}`)
  
  if (!rawUser) return null
  
  try {
    const parsedUser = JSON.parse(rawUser)
    const { success, data: user } = sessionSchema.safeParse(parsedUser)
    return success ? user : null
  } catch {
    return null
  }
}