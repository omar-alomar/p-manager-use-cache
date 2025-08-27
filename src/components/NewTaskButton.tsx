"use client"

import { useState } from "react"
import { QuickAddTaskModal } from "./QuickAddTaskModal"

export function NewTaskButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button 
        className="btn btn-primary" 
        onClick={() => setIsModalOpen(true)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        New Task
      </button>

      <QuickAddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
