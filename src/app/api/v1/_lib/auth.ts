import { cookies } from "next/headers"
import { getSessionByToken, COOKIE_SESSION_KEY } from "@/auth/session"
import { jsonUnauthorized, jsonForbidden } from "./responses"
import { NextRequest } from "next/server"

export type SessionUser = { id: number; role: "user" | "admin" }

/**
 * Extract session from Bearer token or cookie.
 * Returns the session user or null.
 */
export async function getApiUser(request: NextRequest): Promise<SessionUser | null> {
  // 1. Try Bearer token from Authorization header
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    if (token) {
      const session = await getSessionByToken(token)
      if (session) return session
    }
  }

  // 2. Fall back to session cookie
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(COOKIE_SESSION_KEY)
  if (sessionCookie?.value) {
    const session = await getSessionByToken(sessionCookie.value)
    if (session) return session
  }

  return null
}

/**
 * Require an authenticated user. Returns the session or a 401 response.
 */
export async function requireAuth(request: NextRequest): Promise<SessionUser | Response> {
  const user = await getApiUser(request)
  if (!user) return jsonUnauthorized()
  return user
}

/**
 * Require an admin user. Returns the session or a 401/403 response.
 */
export async function requireAdmin(request: NextRequest): Promise<SessionUser | Response> {
  const user = await getApiUser(request)
  if (!user) return jsonUnauthorized()
  if (user.role !== "admin") return jsonForbidden()
  return user
}

/**
 * Type guard to check if requireAuth/requireAdmin returned a Response (error).
 */
export function isErrorResponse(result: SessionUser | Response): result is Response {
  return result instanceof Response
}
