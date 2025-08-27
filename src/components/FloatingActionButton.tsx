"use client"

import { useState } from "react"
import { QuickAddTaskModal } from "./QuickAddTaskModal"

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = () => setIsOpen(true)
  const handleClose = () => setIsOpen(false)

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleOpen}
        className="fab"
        aria-label="Quick add task"
        title="Quick add task"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>

      <QuickAddTaskModal
        isOpen={isOpen}
        onClose={handleClose}
      />
    </>
  )
}
