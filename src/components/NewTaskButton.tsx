"use client"

import { useState } from "react"
import { QuickAddTaskModal } from "./QuickAddTaskModal"

export function NewTaskButton({ 
  users, 
  projects 
}: { 
  users: { id: number; name: string }[]
  projects: { id: number; title: string }[]
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalKey, setModalKey] = useState(0)

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    // Increment key to force complete remount of modal on next open
    setModalKey(prev => prev + 1)
  }

  return (
    <>
      <button 
        className="btn btn-primary" 
        onClick={handleOpenModal}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        New Task
      </button>

      <QuickAddTaskModal
        key={modalKey}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        users={users}
        projects={projects}
      />
    </>
  )
}
