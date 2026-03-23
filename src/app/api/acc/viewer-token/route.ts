// Returns a short-lived access token for the Autodesk Viewer JS component
// The viewer needs a token with viewables:read scope to load SVF2 derivatives

import { NextResponse } from "next/server"
import { getUserFromSession } from "@/auth/session"
import { getValidAccessToken } from "@/auth/autodeskTokenManager"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const session = await getUserFromSession(cookieStore)
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const token = await getValidAccessToken(session.id)
  if (!token) {
    return NextResponse.json({ error: "Not connected to Autodesk", needsReauth: true }, { status: 401 })
  }

  return NextResponse.json({ accessToken: token })
}
