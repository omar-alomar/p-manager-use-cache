"use client"

import { deleteClientAction } from "@/actions/clients"
import { useTransition } from "react"

interface DeleteClientButtonProps {
  clientId: number
}

export function DeleteClientButton({ clientId }: DeleteClientButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      return
    }

    startTransition(async () => {
      await deleteClientAction(clientId)
    })
  }

  return (
    <button
      disabled={isPending}
      className="hero-action-btn danger"
      onClick={handleDelete}
    >
      {isPending ? "Deleting..." : "Delete Client"}
    </button>
  )
}
