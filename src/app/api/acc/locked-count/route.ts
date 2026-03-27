// Count all locked files in an ACC project (recursive folder scan)
// Query params: accProjectId, accHubId

import { NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/auth/session"
import { getValidAccessToken } from "@/auth/autodeskTokenManager"
import { cookies } from "next/headers"

const DM_BASE = "https://developer.api.autodesk.com"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const session = await getUserFromSession(cookieStore)
  if (!session) {
    return NextResponse.json({ count: 0 })
  }

  const accProjectId = request.nextUrl.searchParams.get("accProjectId")
  const accHubId = request.nextUrl.searchParams.get("accHubId")
  if (!accProjectId || !accHubId) {
    return NextResponse.json({ count: 0 })
  }

  const token = await getValidAccessToken(session.id)
  if (!token) {
    return NextResponse.json({ count: 0 })
  }

  try {
    const topRes = await fetch(
      `${DM_BASE}/project/v1/hubs/b.${accHubId}/projects/b.${accProjectId}/topFolders`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    )
    if (!topRes.ok) return NextResponse.json({ count: 0 })

    const topData = await topRes.json()
    const topFolders = (topData.data || []).map((f: { id: string }) => f.id)

    let count = 0
    await scanFolders(token, accProjectId, topFolders, (n) => { count += n })

    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}

function isDwg(nameOrType: string): boolean {
  const lower = nameOrType.toLowerCase()
  return lower.endsWith(".dwg") || lower === "dwg"
}

async function scanFolders(
  token: string,
  projectId: string,
  folderIds: string[],
  addCount: (n: number) => void
): Promise<void> {
  for (const folderId of folderIds) {
    try {
      const res = await fetch(
        `${DM_BASE}/data/v1/projects/b.${projectId}/folders/${folderId}/contents`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      )
      if (!res.ok) continue

      const data = await res.json()
      const subFolders: string[] = []
      let locked = 0

      for (const item of data.data || []) {
        if (item.type === "folders") {
          subFolders.push(item.id)
        } else if (item.type === "items" && item.attributes?.reserved && isDwg(item.attributes?.fileType || item.attributes?.displayName || "")) {
          locked++
        }
      }

      if (locked > 0) addCount(locked)
      if (subFolders.length > 0) {
        await scanFolders(token, projectId, subFolders, addCount)
      }
    } catch {
      continue
    }
  }
}
