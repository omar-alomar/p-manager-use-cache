import { NextRequest } from "next/server"
import prisma from "@/db/db"
import { updateProfileSchema } from "@/schemas/schemas"
import { requireAuth, isErrorResponse } from "../../_lib/auth"
import { checkMaintenance } from "../../_lib/maintenance"
import { jsonSuccess, jsonError, jsonNotFound } from "../../_lib/responses"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { id: true, email: true, name: true, role: true, lastSeenVersion: true, createdAt: true }
  })

  if (!user) return jsonNotFound("User not found")

  return jsonSuccess(user)
}

export async function PATCH(request: NextRequest) {
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

  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return jsonError("Invalid profile data", 400)
  }

  const user = await prisma.user.update({
    where: { id: auth.id },
    data: { name: parsed.data.name },
    select: { id: true, email: true, name: true, role: true, lastSeenVersion: true, createdAt: true }
  })

  return jsonSuccess(user)
}
