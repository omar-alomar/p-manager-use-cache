"use client"

import { useState, useTransition } from "react"
import { updateTaskCompletionAction, deleteTaskAction } from "@/actions/tasks"
import { useRouter } from "next/navigation"
import { getUrgencyDisplay } from "@/constants/urgency"
import { formatDate } from "@/utils/dateUtils"
import Link from "next/link"

interface TaskDetailHeroProps {
  task: {
    id: number
    title: string
    completed: boolean
    urgency: string | null
    createdAt: Date
    updatedAt: Date
    userId: number
    projectId: number | null
  }
  userName: string
  projectTitle: string | null
  projectId: number | null
}

export function TaskDetailHero({ task, userName, projectTitle, projectId }: TaskDetailHeroProps) {
  const router = useRouter()
  const [completed, setCompleted] = useState(task.completed)
  const [isToggling, startToggle] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  const urgency = getUrgencyDisplay(task.urgency)

  function handleToggle() {
    const newVal = !completed
    setCompleted(newVal)
    startToggle(async () => {
      try {
        await updateTaskCompletionAction(task.id, {
          title: task.title,
          completed: newVal,
          urgency: task.urgency,
          userId: task.userId,
          projectId: task.projectId || undefined,
        })
      } catch {
        setCompleted(!newVal)
      }
    })
  }

  async function handleDelete() {
    if (!confirm(`Delete "${task.title}"?`)) return
    setIsDeleting(true)
    try {
      await deleteTaskAction(task.id)
    } catch (e) {
      if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) return
      setIsDeleting(false)
    }
  }

  return (
    <div className="task-detail-hero">
      {/* Row 1: Identity */}
      <div className="hero-top-row">
        <div className="hero-identity">
          <div className="hero-avatar">
            <button
              className={`task-detail-status-circle ${completed ? "is-completed" : ""}`}
              onClick={handleToggle}
              disabled={isToggling || isDeleting}
              title={completed ? "Mark incomplete" : "Mark complete"}
            >
              {isToggling ? (
                <div className="spinner-ring"></div>
              ) : completed ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              )}
            </button>
          </div>
          <div className="hero-title-group">
            <div className="hero-title-row">
              <h1 className={`hero-name ${completed ? "task-title-completed" : ""}`}>{task.title}</h1>
            </div>
            <div className="hero-tags">
              <span className={`hero-tag ${completed ? "task-status-done" : "task-status-active"}`}>
                {completed ? "Completed" : "In Progress"}
              </span>
              <span className={`hero-tag task-urgency-tag ${urgency.className}`}>
                {urgency.label}
              </span>
            </div>
          </div>
        </div>
        <div className="hero-actions">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn btn-outline btn-danger-outline"
            title="Delete task"
          >
            {isDeleting ? (
              <div className="spinner-ring"></div>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            )}
            Delete
          </button>
          <Link href="/tasks" className="btn btn-outline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Tasks
          </Link>
        </div>
      </div>

      {/* Row 2: Detail fields */}
      <div className="hero-details-row">
        {projectTitle && projectId && (
          <div className="hero-detail">
            <span className="hero-detail-label">Project</span>
            <Link href={`/projects/${projectId}`} className="hero-detail-link">
              {projectTitle}
            </Link>
          </div>
        )}
        <div className="hero-detail">
          <span className="hero-detail-label">Assigned To</span>
          <Link href={`/users/${task.userId}`} className="hero-detail-link">
            {userName}
          </Link>
        </div>
        <div className="hero-detail">
          <span className="hero-detail-label">Created</span>
          <span className="hero-detail-value">{formatDate(task.createdAt)}</span>
        </div>
        <div className="hero-detail">
          <span className="hero-detail-label">Updated</span>
          <span className="hero-detail-value">{formatDate(task.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}
