"use client"

import { useState } from "react"
import { QuickAddTaskModal } from "./QuickAddTaskModal"

interface ProjectEmptyStateActionsProps {
  projectId: string
}

export function ProjectEmptyStateActions({ projectId }: ProjectEmptyStateActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button 
        className="btn btn-primary"
        onClick={() => setIsModalOpen(true)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Create First Task
      </button>

      <QuickAddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        presetProjectId={Number(projectId)}
      />
    </>
  )
}
