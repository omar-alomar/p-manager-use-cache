import { NextRequest } from "next/server"
import { clientSchema } from "@/schemas/schemas"
import { getClient, updateClient, deleteClient } from "@/db/clients"
import { requireAuth, isErrorResponse } from "../../_lib/auth"
import { checkMaintenance } from "../../_lib/maintenance"
import { jsonSuccess, jsonNoContent, jsonError, jsonNotFound } from "../../_lib/responses"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const { clientId } = await params
  const client = await getClient(clientId)
  if (!client) return jsonNotFound("Client not found")

  return jsonSuccess(client)
}

export async function PUT(
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

  const parsed = clientSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const e of parsed.error.issues) {
      fieldErrors[e.path.join(".")] = e.message
    }
    return jsonError("Validation failed", 400, fieldErrors)
  }

  const client = await updateClient({ id: Number(clientId), ...parsed.data })
  return jsonSuccess(client)
}

export async function DELETE(
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

  await deleteClient(clientId)
  return jsonNoContent()
}
