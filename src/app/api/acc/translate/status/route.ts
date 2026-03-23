// Check translation progress
// Query param: urn

import { NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/auth/session"
import { getValidAccessToken } from "@/auth/autodeskTokenManager"
import { getRedis } from "@/redis/redis"
import { cookies } from "next/headers"

const MD_BASE = "https://developer.api.autodesk.com/modelderivative/v2/designdata"

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

  const urn = request.nextUrl.searchParams.get("urn")
  if (!urn) {
    return NextResponse.json({ error: "urn is required" }, { status: 400 })
  }

  const token = await getValidAccessToken(session.id)
  if (!token) {
    return NextResponse.json({ error: "Not connected to Autodesk", needsReauth: true }, { status: 401 })
  }

  try {
    const res = await fetch(`${MD_BASE}/${urn}/manifest`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Manifest check failed: ${res.status}` }, { status: res.status })
    }

    const manifest = await res.json()

    // Detect format from derivatives
    let format = "svf2"
    for (const d of manifest.derivatives || []) {
      if (d.outputType === "svf") { format = "svf"; break }
      if (d.outputType === "svf2") { format = "svf2"; break }
    }

    // Cache on success
    if (manifest.status === "success") {
      const r = getRedis()
      if (r) {
        const cacheKey = `${getEnvPrefix()}:acc:translated:${urn}`
        await r.setex(cacheKey, 7 * 24 * 60 * 60, "1")
        await r.setex(`${cacheKey}:format`, 7 * 24 * 60 * 60, format)
      }
    }

    return NextResponse.json({
      status: manifest.status,
      progress: manifest.progress || "0%",
      urn,
      format,
    })
  } catch (error) {
    console.error("Translation status error:", error)
    return NextResponse.json({ error: "Failed to check translation status" }, { status: 500 })
  }
}
