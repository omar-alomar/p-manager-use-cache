"use server"

import { createComment, deleteComment } from "@/db/comments"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import prisma from "@/db/db"

const addCommentSchema = z.object({
  projectId: z.string().or(z.number()).nullable().optional(),
  taskId: z.string().or(z.number()).nullable().optional(),
  email: z.string().email("Please enter a valid email address"),
  body: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
  userId: z.string().transform(val => Number(val)).pipe(z.number())
}).refine(data => (data.projectId && data.projectId !== 'null') || (data.taskId && data.taskId !== 'null'), {
  message: "Either projectId or taskId must be provided"
})

const deleteCommentSchema = z.object({
  commentId: z.string().transform(val => Number(val)).pipe(z.number()),
  userId: z.string().transform(val => Number(val)).pipe(z.number()),
  userRole: z.string()
})

export async function addCommentAction(formData: FormData) {
  const rawData = {
    projectId: formData.get("projectId"),
    taskId: formData.get("taskId"),
    email: formData.get("email"),
    body: formData.get("body"),
    userId: formData.get("userId")
  }

  const { success, data, error } = addCommentSchema.safeParse(rawData)

  if (!success) {
    return {
      success: false,
      message: error.issues[0]?.message || "Invalid input"
    }
  }

  try {
    await createComment(data.projectId, data.taskId, data.email, data.body, data.userId)
    
    // Revalidate the appropriate page to show the new comment
    if (data.projectId) {
      revalidatePath(`/projects/${data.projectId}`)
    }
    if (data.taskId) {
      revalidatePath(`/tasks/${data.taskId}`)
    }
    
    return {
      success: true,
      message: "Comment added successfully"
    }
  } catch (error) {
    console.error("Error adding comment:", error)
    return {
      success: false,
      message: "Failed to add comment. Please try again."
    }
  }
}

export async function deleteCommentAction(formData: FormData) {
  const rawData = {
    commentId: formData.get("commentId"),
    userId: formData.get("userId"),
    userRole: formData.get("userRole")
  }

  const { success, data, error } = deleteCommentSchema.safeParse(rawData)

  if (!success) {
    return {
      success: false,
      message: error.issues[0]?.message || "Invalid input"
    }
  }

  try {
    // Get the comment to check permissions
    const comment = await prisma.comment.findUnique({
      where: { id: data.commentId },
      select: { userId: true, projectId: true, taskId: true }
    })

    if (!comment) {
      return {
        success: false,
        message: "Comment not found"
      }
    }

    // Check permissions: user can delete their own comments, admins can delete all
    if (data.userRole !== 'admin' && comment.userId !== data.userId) {
      return {
        success: false,
        message: "You can only delete your own comments"
      }
    }

    await deleteComment(data.commentId)
    
    // Revalidate the appropriate page to remove the deleted comment
    if (comment.projectId) {
      revalidatePath(`/projects/${comment.projectId}`)
    }
    if (comment.taskId) {
      revalidatePath(`/tasks/${comment.taskId}`)
    }
    
    return {
      success: true,
      message: "Comment deleted successfully"
    }
  } catch (error) {
    console.error("Error deleting comment:", error)
    return {
      success: false,
      message: "Failed to delete comment. Please try again."
    }
  }
}
