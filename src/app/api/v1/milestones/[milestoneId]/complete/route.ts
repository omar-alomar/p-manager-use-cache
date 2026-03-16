import { NextRequest } from "next/server"
import prisma from "@/db/db"
import { revalidateTag } from "next/cache"
import { requireAuth, isErrorResponse } from "../../../_lib/auth"
import { checkMaintenance } from "../../../_lib/maintenance"
import { jsonSuccess, jsonError, jsonNotFound } from "../../../_lib/responses"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ milestoneId: string }> }
) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const blocked = await checkMaintenance(auth)
  if (blocked) return blocked

  const { milestoneId } = await params
  const existing = await prisma.milestone.findUnique({ where: { id: Number(milestoneId) } })
  if (!existing) return jsonNotFound("Milestone not found")

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const { completed } = body as { completed?: boolean }
  if (typeof completed !== "boolean") {
    return jsonError("completed must be a boolean", 400)
  }

  const milestone = await prisma.milestone.update({
    where: { id: Number(milestoneId) },
    data: { completed },
  })

  revalidateTag(`projects:id=${milestone.projectId}`)
  revalidateTag("projects:all")

  return jsonSuccess(milestone)
}
