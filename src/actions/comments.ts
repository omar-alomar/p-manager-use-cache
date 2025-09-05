"use server"

import { createComment } from "@/db/comments"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const addCommentSchema = z.object({
  projectId: z.string().or(z.number()),
  email: z.string().email("Please enter a valid email address"),
  body: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long")
})

export async function addCommentAction(formData: FormData) {
  const rawData = {
    projectId: formData.get("projectId"),
    email: formData.get("email"),
    body: formData.get("body")
  }

  const { success, data, error } = addCommentSchema.safeParse(rawData)

  if (!success) {
    return {
      success: false,
      message: error.issues[0]?.message || "Invalid input"
    }
  }

  try {
    await createComment(data.projectId, data.email, data.body)
    
    // Revalidate the project page to show the new comment
    revalidatePath(`/projects/${data.projectId}`)
    
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
