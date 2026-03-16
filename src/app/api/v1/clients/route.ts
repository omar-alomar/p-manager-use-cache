import { NextRequest } from "next/server"
import { clientSchema } from "@/schemas/schemas"
import { getClients, createClient } from "@/db/clients"
import { requireAuth, isErrorResponse } from "../_lib/auth"
import { checkMaintenance } from "../_lib/maintenance"
import { jsonSuccess, jsonCreated, jsonError } from "../_lib/responses"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query") ?? undefined

  const clients = await getClients({ query })
  return jsonSuccess(clients)
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const blocked = await checkMaintenance(auth)
  if (blocked) return blocked

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

  const client = await createClient(parsed.data)
  return jsonCreated(client)
}
