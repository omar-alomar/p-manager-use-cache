import { NextRequest } from "next/server"
import { isMaintenanceMode, setMaintenanceMode } from "@/redis/maintenance"
import { requireAdmin, isErrorResponse } from "../../_lib/auth"
import { jsonSuccess, jsonError } from "../../_lib/responses"

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isErrorResponse(auth)) return auth

  const enabled = await isMaintenanceMode()
  return jsonSuccess({ enabled })
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isErrorResponse(auth)) return auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const { enabled } = body as { enabled?: boolean }
  if (typeof enabled !== "boolean") {
    return jsonError("enabled must be a boolean", 400)
  }

  await setMaintenanceMode(enabled)
  return jsonSuccess({ enabled })
}
