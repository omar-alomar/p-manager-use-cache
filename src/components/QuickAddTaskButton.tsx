"use client"

import { useState } from "react"
import { QuickAddTaskModal } from "./QuickAddTaskModal"

interface QuickAddTaskButtonProps {
  userId: number
  userName: string
  className?: string
}

export function QuickAddTaskButton({ userId, userName, className = "" }: QuickAddTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = () => setIsOpen(true)
  const handleClose = () => setIsOpen(false)

  return (
    <>
      <button
        onClick={handleOpen}
        className={className || "quick-add-task-btn"}
        aria-label={`Quick add task for ${userName}`}
        title={`Quick add task for ${userName}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        <span>Quick Add Task</span>
      </button>

      <QuickAddTaskModal
        isOpen={isOpen}
        onClose={handleClose}
        presetUserId={userId}
        presetUserName={userName}
      />
    </>
  )
}
