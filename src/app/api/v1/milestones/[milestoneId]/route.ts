import { NextRequest } from "next/server"
import prisma from "@/db/db"
import { revalidateTag } from "next/cache"
import { requireAuth, isErrorResponse } from "../../_lib/auth"
import { checkMaintenance } from "../../_lib/maintenance"
import { jsonSuccess, jsonNoContent, jsonError, jsonNotFound } from "../../_lib/responses"

export async function PUT(
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

  const { date, item, apfo } = body as { date?: string; item?: string; apfo?: boolean }

  const milestone = await prisma.milestone.update({
    where: { id: Number(milestoneId) },
    data: {
      ...(date !== undefined ? { date: new Date(date) } : {}),
      ...(item !== undefined ? { item } : {}),
      ...(apfo !== undefined ? { apfo } : {}),
    },
  })

  revalidateTag(`projects:id=${milestone.projectId}`)
  revalidateTag("projects:all")

  return jsonSuccess(milestone)
}

export async function DELETE(
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

  await prisma.milestone.delete({ where: { id: Number(milestoneId) } })

  revalidateTag(`projects:id=${existing.projectId}`)
  revalidateTag("projects:all")

  return jsonNoContent()
}
