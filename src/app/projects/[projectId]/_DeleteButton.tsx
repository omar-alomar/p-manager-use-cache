"use client"

import { deleteProjectAction } from "@/actions/projects"
import { useTransition } from "react"

export function DeleteButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return
    }

    startTransition(async () => {
      await deleteProjectAction(projectId)
    })
  }

  return (
    <button
      disabled={isPending}
      className="hero-action-btn danger"
      onClick={handleDelete}
    >
      {isPending ? "Deleting..." : "Delete Project"}
    </button>
  )
}
