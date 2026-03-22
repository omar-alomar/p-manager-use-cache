// Disconnect Autodesk account
//
// Deletes the user's AutodeskToken row. Clears cached access token from Redis.

import { NextResponse } from "next/server"
import { getUserFromSession } from "@/auth/session"
import { deleteAutodeskToken } from "@/db/autodesk"
import { getRedis } from "@/redis/redis"
import { cookies } from "next/headers"

const BASE_URL = process.env.APP_URL || "http://localhost:3000"

function getEnvPrefix(): string {
  const env = process.env.NODE_ENV || "development"
  if (env === "production") return "prod"
  if (env.includes("staging")) return "staging"
  return "dev"
}

export async function POST() {
  const cookieStore = await cookies()
  const session = await getUserFromSession(cookieStore)
  if (!session) {
    return NextResponse.redirect(new URL("/login", BASE_URL))
  }

  await deleteAutodeskToken(session.id)

  // Clear cached access token
  const r = getRedis()
  if (r) {
    await r.del(`${getEnvPrefix()}:acc:token:${session.id}`).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
