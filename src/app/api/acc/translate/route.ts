// Start/check SVF2 translation for a file
// Body: { accProjectId, itemId } — resolves the correct version URN server-side
// OR: { urn } — use a pre-resolved URN directly
//
// Checks Redis cache first. If already translated, returns immediately (no Flex token cost).

import { NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "@/auth/session"
import { getValidAccessToken } from "@/auth/autodeskTokenManager"
import { getRedis } from "@/redis/redis"
import { cookies } from "next/headers"

const DM_BASE = "https://developer.api.autodesk.com"
const MD_BASE = "https://developer.api.autodesk.com/modelderivative/v2/designdata"

function getEnvPrefix(): string {
  const env = process.env.NODE_ENV || "development"
  if (env === "production") return "prod"
  if (env.includes("staging")) return "staging"
  return "dev"
}

function toBase64Url(str: string): string {
  return Buffer.from(str).toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

// Detect whether manifest used SVF or SVF2
function detectFormat(manifest: { derivatives?: Array<{ outputType?: string }> }): string {
  for (const d of manifest.derivatives || []) {
    if (d.outputType === "svf2") return "svf2"
    if (d.outputType === "svf") return "svf"
  }
  return "svf2"
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const session = await getUserFromSession(cookieStore)
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json()
  let { urn } = body
  const { accProjectId, itemId } = body

  const token = await getValidAccessToken(session.id)
  if (!token) {
    return NextResponse.json({ error: "Not connected to Autodesk", needsReauth: true }, { status: 401 })
  }

  try {
    // If no URN provided, resolve it from the item's tip version
    if (!urn && accProjectId && itemId) {
      const tipRes = await fetch(
        `${DM_BASE}/data/v1/projects/b.${accProjectId}/items/${itemId}/tip`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      )

      if (!tipRes.ok) {
        return NextResponse.json({ error: `Failed to get file version: ${tipRes.status}` }, { status: tipRes.status })
      }

      const tipData = await tipRes.json()
      // The derivative URN is the version ID, base64url-encoded
      const versionId = tipData.data?.id
      if (!versionId) {
        return NextResponse.json({ error: "Could not resolve file version" }, { status: 400 })
      }
      urn = toBase64Url(versionId)
    }

    if (!urn) {
      return NextResponse.json({ error: "urn or accProjectId+itemId required" }, { status: 400 })
    }

    // Check Redis cache
    const r = getRedis()
    const cacheKey = `${getEnvPrefix()}:acc:translated:${urn}`
    if (r) {
      const cached = await r.get(cacheKey)
      if (cached) {
        const cachedFormat = await r.get(`${cacheKey}:format`) || "svf2"
        return NextResponse.json({ status: "success", urn, format: cachedFormat, cached: true })
      }
    }

    // Check if translation already exists (ACC often auto-translates)
    const manifestRes = await fetch(`${MD_BASE}/${urn}/manifest`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })

    if (manifestRes.ok) {
      const manifest = await manifestRes.json()
      // Detect format from manifest derivatives
      const detectedFormat = detectFormat(manifest)
      if (manifest.status === "success") {
        if (r) {
          await r.setex(cacheKey, 7 * 24 * 60 * 60, "1")
          await r.setex(`${cacheKey}:format`, 7 * 24 * 60 * 60, detectedFormat)
        }
        return NextResponse.json({ status: "success", urn, format: detectedFormat, cached: false })
      }
      if (manifest.status === "inprogress") {
        return NextResponse.json({ status: "inprogress", progress: manifest.progress, urn, format: detectedFormat })
      }
      if (manifest.status === "failed") {
        // Try re-submitting
      }
    }

    // Start new translation job — try SVF2 first, fall back to SVF
    for (const format of ["svf2", "svf"] as const) {
      const jobRes = await fetch(`${MD_BASE}/job`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: { urn },
          output: {
            formats: [{ type: format, views: ["2d", "3d"] }],
          },
        }),
      })

      if (jobRes.ok) {
        return NextResponse.json({ status: "started", urn, format })
      }

      const text = await jobRes.text()
      // 406 = format not supported for this file — try next format
      if (jobRes.status === 406 && format === "svf2") {
        console.log("SVF2 not supported, falling back to SVF")
        continue
      }

      console.error("Translation job failed:", jobRes.status, text)
      return NextResponse.json({ error: "Failed to start translation", details: text }, { status: jobRes.status })
    }

    return NextResponse.json({ error: "No supported translation format" }, { status: 406 })
  } catch (error) {
    console.error("Translation error:", error)
    return NextResponse.json({ error: "Translation request failed" }, { status: 500 })
  }
}
