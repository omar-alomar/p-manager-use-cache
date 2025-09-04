"use client"

import { useTransition } from "react"

interface AdminDeleteButtonProps {
  itemId: number
  itemName: string
  itemType: 'user' | 'project' | 'task'
  onDelete: (id: number) => Promise<void>
}

export function AdminDeleteButton({ 
  itemId, 
  itemName, 
  itemType, 
  onDelete 
}: AdminDeleteButtonProps) {
  const [isPending, startTransition] = useTransition()
  
  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete this ${itemType} "${itemName}"? This action cannot be undone.`)) {
      return
    }
    
    startTransition(async () => {
      await onDelete(itemId)
    })
  }
  
  return (
    <button
      disabled={isPending}
      className="admin-delete-btn"
      onClick={handleDelete}
      title={`Delete ${itemType}: ${itemName}`}
      aria-label={`Delete ${itemType}: ${itemName}`}
    >
      {isPending ? (
        <div className="admin-delete-btn-spinner">
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
