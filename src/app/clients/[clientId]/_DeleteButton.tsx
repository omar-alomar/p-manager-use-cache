"use client"

import { useState } from "react"
import { deleteClientAction } from "@/actions/clients"

interface DeleteClientButtonProps {
  clientId: number
}

export function DeleteClientButton({ clientId }: DeleteClientButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteClientAction(clientId)
    } catch (error) {
      console.error('Error deleting client:', error)
      setIsDeleting(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="delete-confirmation">
        <p className="delete-confirmation-text">
          Are you sure you want to delete this client? This action cannot be undone.
        </p>
        <div className="delete-confirmation-actions">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="hero-action-btn danger"
          >
            {isDeleting ? "Deleting..." : "Yes, Delete"}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            disabled={isDeleting}
            className="hero-action-btn secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="hero-action-btn danger"
    >
      Delete Client
    </button>
  )
}
