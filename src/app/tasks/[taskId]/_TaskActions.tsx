"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteTaskAction } from "@/actions/tasks"

interface TaskActionsProps {
  taskId: string
}

export function TaskActions({ taskId }: TaskActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteTaskAction(Number(taskId))
      router.push("/tasks")
      router.refresh()
    } catch (error) {
      console.error("Failed to delete task:", error)
      alert("Failed to delete task. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="task-actions">
      <div className="action-buttons">
        <Link href={`/tasks/${taskId}/edit`} className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          Edit Task
        </Link>
        
        <Link href="/tasks" className="btn btn-outline">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Tasks
        </Link>
        
        <button 
          onClick={handleDelete} 
          disabled={isDeleting}
          className="btn btn-outline btn-danger"
        >
          {isDeleting ? (
            <>
              <div className="spinner-ring"></div>
              Deleting...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
              </svg>
              Delete Task
            </>
          )}
        </button>
      </div>
      
      <div className="action-info">
        <div className="info-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          <span>Task ID: {taskId}</span>
        </div>
        <div className="info-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          <span>Click Edit to modify task details</span>
        </div>
      </div>
    </div>
  )
}


