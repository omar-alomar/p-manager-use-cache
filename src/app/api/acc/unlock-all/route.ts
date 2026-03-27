// Recursively find and unlock all locked files in an ACC project
// Body: { accProjectId, accHubId }
//
// Traverses the entire folder tree, finds locked files, unlocks them all.

import { NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/auth/session"
import { getValidAccessToken } from "@/auth/autodeskTokenManager"
import { cookies } from "next/headers"

const DM_BASE = "https://developer.api.autodesk.com"

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const session = await getUserFromSession(cookieStore)
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { accProjectId, accHubId } = await request.json()
  if (!accProjectId || !accHubId) {
    return NextResponse.json({ error: "accProjectId and accHubId are required" }, { status: 400 })
  }

  const token = await getValidAccessToken(session.id)
  if (!token) {
    return NextResponse.json({ error: "Not connected to Autodesk", needsReauth: true }, { status: 401 })
  }

  try {
    // Get top folders
    const topRes = await fetch(
      `${DM_BASE}/project/v1/hubs/b.${accHubId}/projects/b.${accProjectId}/topFolders`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    )
    if (!topRes.ok) {
      return NextResponse.json({ error: "Failed to list folders" }, { status: topRes.status })
    }

    const topData = await topRes.json()
    const topFolders = (topData.data || []).map((f: { id: string }) => f.id)

    // Recursively scan all folders for locked files
    const lockedItems: string[] = []
    await scanFolders(token, accProjectId, topFolders, lockedItems)

    if (lockedItems.length === 0) {
      return NextResponse.json({ unlocked: 0, found: 0, message: "No locked files found" })
    }

    // Unlock all found locked files
    const results = await Promise.allSettled(
      lockedItems.map((itemId) =>
        fetch(`${DM_BASE}/data/v1/projects/b.${accProjectId}/items/${itemId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/vnd.api+json",
          },
          body: JSON.stringify({
            jsonapi: { version: "1.0" },
            data: {
              type: "items",
              id: itemId,
              attributes: { reserved: false },
            },
          }),
        })
      )
    )

    const unlocked = results.filter((r) => r.status === "fulfilled").length

    return NextResponse.json({ unlocked, found: lockedItems.length })
  } catch (error) {
    console.error("Unlock all error:", error)
    return NextResponse.json({ error: "Failed to unlock files" }, { status: 500 })
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
  lockedItems: string[]
): Promise<void> {
  for (const folderId of folderIds) {
    try {
      const res = await fetch(
        `${DM_BASE}/data/v1/projects/b.${projectId}/folders/${folderId}/contents`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      )
      if (!res.ok) continue // Skip folders we can't access (permission-gated)

      const data = await res.json()
      const subFolders: string[] = []

      for (const item of data.data || []) {
        if (item.type === "folders") {
          subFolders.push(item.id)
        } else if (item.type === "items" && item.attributes?.reserved && isDwg(item.attributes?.fileType || item.attributes?.displayName || "")) {
          lockedItems.push(item.id)
        }
      }

      // Recurse into subfolders
      if (subFolders.length > 0) {
        await scanFolders(token, projectId, subFolders, lockedItems)
      }
    } catch {
      // Skip folders that fail
    }
  }
}
