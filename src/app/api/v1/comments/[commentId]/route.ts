import { NextRequest } from "next/server"
import { deleteComment } from "@/db/comments"
import prisma from "@/db/db"
import { requireAuth, isErrorResponse } from "../../_lib/auth"
import { checkMaintenance } from "../../_lib/maintenance"
import { jsonNoContent, jsonNotFound, jsonForbidden } from "../../_lib/responses"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const blocked = await checkMaintenance(auth)
  if (blocked) return blocked

  const { commentId } = await params
  const comment = await prisma.comment.findUnique({
    where: { id: Number(commentId) },
    select: { id: true, userId: true },
  })

  if (!comment) return jsonNotFound("Comment not found")

  // Only the comment author or admins can delete
  if (comment.userId !== auth.id && auth.role !== "admin") {
    return jsonForbidden("You can only delete your own comments")
  }

  await deleteComment(Number(commentId))
  return jsonNoContent()
}
