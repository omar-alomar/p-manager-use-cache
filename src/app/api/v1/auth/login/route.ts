import { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { signInSchema } from "@/schemas/schemas"
import prisma from "@/db/db"
import { comparePasswords } from "@/auth/passwordHasher"
import { createUserSession } from "@/auth/session"
import { APP_VERSION } from "@/constants/version"
import { jsonSuccess, jsonError, jsonUnauthorized } from "../../_lib/responses"

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const parsed = signInSchema.safeParse(body)
  if (!parsed.success) {
    return jsonError("Invalid credentials", 400)
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { password: true, salt: true, id: true, email: true, name: true, role: true, lastSeenVersion: true }
  })

  if (!user || !user.password || !user.salt) {
    return jsonUnauthorized("Invalid email or password")
  }

  const isCorrectPassword = await comparePasswords({
    hashedPassword: user.password,
    password: parsed.data.password,
    salt: user.salt,
  })

  if (!isCorrectPassword) {
    return jsonUnauthorized("Invalid email or password")
  }

  // Create session — sets cookie for browser clients and returns the token
  const token = await createUserSession({ id: user.id, role: user.role }, await cookies())

  return jsonSuccess({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      lastSeenVersion: user.lastSeenVersion,
      needsVersionAck: user.lastSeenVersion !== APP_VERSION,
    }
  })
}
