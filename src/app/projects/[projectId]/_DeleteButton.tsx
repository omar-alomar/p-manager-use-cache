"use client"

import { deleteProjectAction } from "@/actions/projects"
import { useTransition } from "react"

export function DeleteButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      disabled={isPending}
      className="hero-action-btn danger"
      onClick={() =>
        startTransition(async () => {
          await deleteProjectAction(projectId)
        })
      }
    >
      {isPending ? "Deleting" : "Delete"}
    </button>
  )
}
