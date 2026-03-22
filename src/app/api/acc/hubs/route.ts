// List ACC hubs the current user has access to (linking UI step 1)

import { NextResponse } from "next/server"
import { getUserFromSession } from "@/auth/session"
import { listHubs } from "@/services/autodeskApi"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const session = await getUserFromSession(cookieStore)
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const result = await listHubs(session.id)

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, needsReauth: result.needsReauth },
      { status: result.status || 500 }
    )
  }

  return NextResponse.json({ hubs: result.hubs })
}
