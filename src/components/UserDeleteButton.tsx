"use client"

import { deleteUserAction } from "@/actions/users"
import { useTransition } from "react"

export function UserDeleteButton({ userId, userName }: { userId: number, userName: string }) {
  const [isPending, startTransition] = useTransition()
  
  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
      return
    }
    
    startTransition(async () => {
      await deleteUserAction(userId)
    })
  }
  
  return (
    <button
      disabled={isPending}
      className="delete-btn"
      onClick={handleDelete}
      title={`Delete ${userName}`}
      aria-label={`Delete ${userName}`}
    >
      {isPending ? (
        <div className="delete-btn-spinner">
          <div className="spinner-ring"></div>
        </div>
      ) : (
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      )}
    </button>
  )
}
