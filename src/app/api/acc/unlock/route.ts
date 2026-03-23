// Unlock a locked file in ACC
// Body: { accProjectId, itemId }

import { NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/auth/session"
import { unlockFile } from "@/services/autodeskApi"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const session = await getUserFromSession(cookieStore)
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json()
  const { accProjectId, itemId } = body
  if (!accProjectId || !itemId) {
    return NextResponse.json({ error: "accProjectId and itemId are required" }, { status: 400 })
  }

  const result = await unlockFile(session.id, accProjectId, itemId)

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, needsReauth: result.needsReauth },
      { status: result.status || 500 }
    )
  }

  return NextResponse.json({ success: true })
}
