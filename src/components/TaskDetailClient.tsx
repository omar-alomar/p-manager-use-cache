"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateTaskCompletionAction, deleteTaskAction } from "@/actions/tasks"

interface TaskDetailActionsProps {
  task: {
    id: number
    title: string
    completed: boolean
    urgency?: string | null
    userId: number
    projectId: number | null
  }
}

export function TaskDetailActions({ task }: TaskDetailActionsProps) {
  const router = useRouter()
  const [completed, setCompleted] = useState(task.completed)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleToggleComplete() {
    if (isUpdating || isDeleting) return
    const newCompleted = !completed
    setCompleted(newCompleted)
    setIsUpdating(true)
    try {
      await updateTaskCompletionAction(task.id, {
        title: task.title,
        completed: newCompleted,
        urgency: task.urgency,
        userId: task.userId,
        projectId: task.projectId || undefined,
      })
    } catch {
      setCompleted(!newCompleted)
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) return
    setIsDeleting(true)
    try {
      const result = await deleteTaskAction(task.id)
      if (result && !result.success) {
        alert(result.message || "Failed to delete task.")
        setIsDeleting(false)
        return
      }
      router.push("/tasks")
    } catch (error) {
      if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) return
      alert("Failed to delete task.")
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        className={`btn ${completed ? "btn-success" : "btn-primary"}`}
        onClick={handleToggleComplete}
        disabled={isUpdating || isDeleting}
      >
        {isUpdating ? (
          <div className="spinner-ring"></div>
        ) : completed ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Completed
          </>
        ) : (
          "Mark Complete"
        )}
      </button>
      <button
        className="btn btn-outline btn-danger-outline"
        onClick={handleDelete}
        disabled={isDeleting}
        title="Delete task"
      >
        {isDeleting ? (
          <div className="spinner-ring"></div>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        )}
      </button>
    </>
  )
}
