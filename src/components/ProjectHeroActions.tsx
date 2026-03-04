"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { setProjectArchivedAction } from "@/actions/projects"
import { ProjectForm } from "./ProjectForm"

interface ProjectHeroActionsProps {
  projectId: string
  archived?: boolean
  users: { id: number; name: string }[]
  clients: { id: number; name: string; email: string }[]
  project: {
    id: number
    title: string
    client: string
    clientId: number | null
    body: string
    milestone: Date | null
    mbaNumber: string
    coFileNumbers: string
    dldReviewer: string
    userId: number
    milestones?: { id: number; date: Date; item: string; completed?: boolean }[]
  }
}

export function ProjectHeroActions({ projectId, archived = false, users, clients, project }: ProjectHeroActionsProps) {
  const router = useRouter()
  const [archiving, setArchiving] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerKey, setDrawerKey] = useState(0)

  // Apply grey-out class to page container when project is archived
  useEffect(() => {
    const container = document.querySelector('.project-profile-container')
    if (!container) return
    if (archived) {
      container.classList.add('project-page-archived')
    } else {
      container.classList.remove('project-page-archived')
    }
  }, [archived])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setDrawerKey(prev => prev + 1)
  }, [])

  const handleDrawerSuccess = useCallback(() => {
    closeDrawer()
    router.refresh()
  }, [closeDrawer, router])

  // Escape key closes drawer
  useEffect(() => {
    if (!drawerOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [drawerOpen, closeDrawer])

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [drawerOpen])

  async function handleArchiveToggle() {
    if (archiving) return
    setArchiving(true)
    // Immediately apply/remove grey-out for visual feedback
    const container = document.querySelector('.project-profile-container')
    if (container) {
      if (!archived) {
        container.classList.add('project-page-archived')
      } else {
        container.classList.remove('project-page-archived')
      }
    }
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
        onClick={() => setDrawerOpen(true)}
        className="hero-action-btn primary"
      >
        Edit Project
      </button>

      {drawerOpen && createPortal(
        <>
          <div className="drawer-backdrop" onClick={closeDrawer} />
          <div className="drawer-panel">
            <div className="drawer-header">
              <h2 className="modal-title">Edit Project</h2>
              <button className="modal-close-btn" onClick={closeDrawer}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="drawer-body">
              <ProjectForm
                key={drawerKey}
                users={users}
                clients={clients}
                project={project}
                onSuccess={handleDrawerSuccess}
                onCancel={closeDrawer}
                hideDescription
              />
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
