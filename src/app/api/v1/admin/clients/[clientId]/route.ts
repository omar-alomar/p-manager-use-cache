import { NextRequest } from "next/server"
import { deleteClient, getClient } from "@/db/clients"
import { requireAdmin, isErrorResponse } from "../../../_lib/auth"
import { checkMaintenance } from "../../../_lib/maintenance"
import { jsonNoContent, jsonNotFound } from "../../../_lib/responses"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin(request)
  if (isErrorResponse(auth)) return auth

  const blocked = await checkMaintenance(auth)
  if (blocked) return blocked

  const { clientId } = await params
  const existing = await getClient(clientId)
  if (!existing) return jsonNotFound("Client not found")

  await deleteClient(clientId)
  return jsonNoContent()
}
