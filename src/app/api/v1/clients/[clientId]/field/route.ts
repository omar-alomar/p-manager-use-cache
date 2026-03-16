import { NextRequest } from "next/server"
import { updateClientField, getClient } from "@/db/clients"
import { requireAuth, isErrorResponse } from "../../../_lib/auth"
import { checkMaintenance } from "../../../_lib/maintenance"
import { jsonSuccess, jsonError, jsonNotFound } from "../../../_lib/responses"

const ALLOWED_FIELDS = ["companyName", "address"] as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const blocked = await checkMaintenance(auth)
  if (blocked) return blocked

  const { clientId } = await params
  const existing = await getClient(clientId)
  if (!existing) return jsonNotFound("Client not found")

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const { field, value } = body as { field?: string; value?: string | null }
  if (!field || !ALLOWED_FIELDS.includes(field as typeof ALLOWED_FIELDS[number])) {
    return jsonError(`Invalid field. Allowed: ${ALLOWED_FIELDS.join(", ")}`, 400)
  }
  if (value !== null && typeof value !== "string") {
    return jsonError("Value must be a string or null", 400)
  }

  const client = await updateClientField(
    Number(clientId),
    field as typeof ALLOWED_FIELDS[number],
    value ?? null
  )
  return jsonSuccess(client)
}
