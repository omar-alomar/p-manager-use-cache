// List ACC projects within a hub (linking UI step 2)
// Query param: ?hubId=<hub-id>

import { NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/auth/session"
import { listProjects } from "@/services/autodeskApi"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const session = await getUserFromSession(cookieStore)
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const hubId = request.nextUrl.searchParams.get("hubId")
  if (!hubId) {
    return NextResponse.json({ error: "hubId is required" }, { status: 400 })
  }

  const result = await listProjects(session.id, hubId)

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, needsReauth: result.needsReauth },
      { status: result.status || 500 }
    )
  }

  return NextResponse.json({ projects: result.projects })
}
