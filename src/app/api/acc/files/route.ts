// List files in an ACC project folder
// Query params: accProjectId (required), folderId (optional — omit for top folders), refresh (optional)

import { NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/auth/session"
import { listTopFolders, listFolderContents } from "@/services/autodeskApi"
import { getRedis } from "@/redis/redis"
import { cookies } from "next/headers"
import { getAccProjectLinks } from "@/db/autodesk"

function getEnvPrefix(): string {
  const env = process.env.NODE_ENV || "development"
  if (env === "production") return "prod"
  if (env.includes("staging")) return "staging"
  return "dev"
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const session = await getUserFromSession(cookieStore)
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const accProjectId = request.nextUrl.searchParams.get("accProjectId")
  if (!accProjectId) {
    return NextResponse.json({ error: "accProjectId is required" }, { status: 400 })
  }

  const folderId = request.nextUrl.searchParams.get("folderId")
  const refresh = request.nextUrl.searchParams.get("refresh") === "1"

  // Check Redis cache (5-min TTL, per-user)
  const r = getRedis()
  const cacheKey = `${getEnvPrefix()}:acc:files:${accProjectId}:${folderId || "top"}:${session.id}`

  if (!refresh && r) {
    const cached = await r.get(cacheKey)
    if (cached) {
      return NextResponse.json(JSON.parse(cached))
    }
  }

  // Find the hub ID for this ACC project from any link
  // (We need hubId for top folder requests)
  let hubId: string | null = null
  if (!folderId) {
    // Find a link that has this accProjectId to get the hubId
    // Search across all project links
    const allLinks = await findHubForAccProject(accProjectId)
    hubId = allLinks
  }

  let result
  if (folderId) {
    result = await listFolderContents(session.id, accProjectId, folderId)
  } else {
    if (!hubId) {
      return NextResponse.json({ error: "Could not determine hub for this project" }, { status: 400 })
    }
    result = await listTopFolders(session.id, hubId, accProjectId)
  }

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, needsReauth: result.needsReauth },
      { status: result.status || 500 }
    )
  }

  const responseData = { items: "folders" in result ? result.folders : "items" in result ? result.items : [] }

  // Cache for 5 minutes
  if (r) {
    await r.setex(cacheKey, 300, JSON.stringify(responseData))
  }

  return NextResponse.json(responseData)
}

// Helper: find hubId for an ACC project by checking AccProjectLink records
async function findHubForAccProject(accProjectId: string): Promise<string | null> {
  const prisma = (await import("@/db/db")).default
  const link = await prisma.accProjectLink.findFirst({
    where: { accProjectId },
    select: { accHubId: true },
  })
  return link?.accHubId || null
}
