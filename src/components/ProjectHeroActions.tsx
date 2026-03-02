"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { setProjectArchivedAction } from "@/actions/projects"
import { AddMilestoneModal } from "./AddMilestoneModal"

interface ProjectHeroActionsProps {
  projectId: string
  archived?: boolean
}

export function ProjectHeroActions({ projectId, archived = false }: ProjectHeroActionsProps) {
  const router = useRouter()
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false)
  const [modalKey, setModalKey] = useState(0)
  const [archiving, setArchiving] = useState(false)

  const handleOpenModal = () => {
    setIsMilestoneModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsMilestoneModalOpen(false)
    // Increment key to force complete remount of modal on next open
    setModalKey(prev => prev + 1)
  }

  async function handleArchiveToggle() {
    if (archiving) return
    setArchiving(true)
    try {
      await setProjectArchivedAction(projectId, !archived)
      router.refresh()
    } finally {
      setArchiving(false)
    }
  }

  return (
    <>
      <button
        onClick={handleArchiveToggle}
        className="hero-action-btn secondary"
        disabled={archiving}
        title={archived ? "Unarchive project" : "Archive project"}
      >
        {archiving ? "…" : archived ? "Unarchive" : "Archive"}
      </button>
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
