// List version history for an ACC file item
// Query params: accProjectId (required), itemId (required)
//
// Returns the derivative URN for each version — this is what the viewer needs.
// For ACC files, derivatives are auto-created on upload, so no translation step is needed.

import { NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/auth/session"
import { cookies } from "next/headers"
import { getValidAccessToken } from "@/auth/autodeskTokenManager"

const DM_BASE = "https://developer.api.autodesk.com"

function toBase64Url(str: string): string {
  return Buffer.from(str).toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const session = await getUserFromSession(cookieStore)
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const accProjectId = request.nextUrl.searchParams.get("accProjectId")
  const itemId = request.nextUrl.searchParams.get("itemId")
  if (!accProjectId || !itemId) {
    return NextResponse.json({ error: "accProjectId and itemId are required" }, { status: 400 })
  }

  const token = await getValidAccessToken(session.id)
  if (!token) {
    return NextResponse.json({ error: "Not connected to Autodesk", needsReauth: true }, { status: 401 })
  }

  try {
    const res = await fetch(
      `${DM_BASE}/data/v1/projects/b.${accProjectId}/items/${itemId}/versions`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: `Autodesk API error: ${res.status}` }, { status: res.status })
    }

    const raw = await res.json()
    const versions = (raw.data || []).map((v: {
      id: string
      relationships?: {
        derivatives?: { data?: { id: string } }
      }
      attributes: {
        versionNumber?: number
        name?: string
        displayName?: string
        lastModifiedTime?: string
        lastModifiedUserName?: string
        storageSize?: number
        fileType?: string
      }
    }) => {
      // The derivative ID is already base64-encoded — use it as-is.
      // Only encode the version ID if no derivative relationship exists.
      const derivativeId = v.relationships?.derivatives?.data?.id
      const urn = derivativeId || toBase64Url(v.id)

      return {
        id: v.id,
        versionNumber: v.attributes.versionNumber,
        name: v.attributes.displayName || v.attributes.name,
        lastModified: v.attributes.lastModifiedTime,
        lastModifiedBy: v.attributes.lastModifiedUserName,
        size: v.attributes.storageSize,
        fileType: v.attributes.fileType,
        urn,
      }
    })

    return NextResponse.json({ versions })
  } catch (error) {
    console.error("ACC versions error:", error)
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 })
  }
}
