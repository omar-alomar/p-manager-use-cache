"use client"

import { useState } from "react"
import { AddMilestoneModal } from "./AddMilestoneModal"

export function AddMilestoneButton({ projectId }: { projectId: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const [modalKey, setModalKey] = useState(0)

  const handleClose = () => {
    setIsOpen(false)
    setModalKey(prev => prev + 1)
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={() => setIsOpen(true)}
        title="Add milestone"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Milestone
      </button>
      <AddMilestoneModal
        key={modalKey}
        isOpen={isOpen}
        onClose={handleClose}
        projectId={projectId}
      />
    </>
  )
}
