"use client"

import { useState } from "react"
import { QuickAddTaskModal } from "./QuickAddTaskModal"

export function EmptyStateActions() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="empty-state-actions">
        <button 
          className="btn btn-primary" 
          onClick={() => setIsModalOpen(true)}
        >
          Create First Task
        </button>
        <p className="empty-state-hint">Or use the quick add buttons below</p>
      </div>

      <QuickAddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
