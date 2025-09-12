"use client"

import { useState } from "react"
import Link from "next/link"
import { AddMilestoneModal } from "./AddMilestoneModal"

interface ProjectHeroActionsProps {
  projectId: string
}

export function ProjectHeroActions({ projectId }: ProjectHeroActionsProps) {
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false)
  const [modalKey, setModalKey] = useState(0)

  const handleOpenModal = () => {
    setIsMilestoneModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsMilestoneModalOpen(false)
    // Increment key to force complete remount of modal on next open
    setModalKey(prev => prev + 1)
  }

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="hero-action-btn secondary"
      >
        Add Milestone
      </button>
      <Link 
        href={`/projects/${projectId}/edit`}
        className="hero-action-btn primary"
      >
        Edit Project
      </Link>

      <AddMilestoneModal
        key={modalKey}
        isOpen={isMilestoneModalOpen}
        onClose={handleCloseModal}
        projectId={parseInt(projectId)}
      />
    </>
  )
}
