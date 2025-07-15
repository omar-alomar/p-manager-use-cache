"use client"

import { useState, useEffect } from "react"
import { updateTaskCompletionAction } from "@/actions/tasks"

interface TaskItemProps {
  id: number
  initialCompleted: boolean
  title: string
  projectId: number
  projectTitle: string
  userId: number
}

export function TaskItem({ id, initialCompleted, title, projectId, projectTitle, userId }: TaskItemProps) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    setCompleted(initialCompleted)
  }, [initialCompleted])

  async function handleChange(newCompleted: boolean) {
    setCompleted(newCompleted)
    setIsUpdating(true)
    
    try {
      await updateTaskCompletionAction(id, {
        title,
        completed: newCompleted,
        userId,
        projectId
      })
    } catch (error) {
      console.error('Failed to update task:', error)
      setCompleted(!newCompleted)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <li className="no-bullets">
      <input
        type="checkbox"
        checked={completed}
        onChange={(e) => handleChange(e.target.checked)}
        disabled={isUpdating}
        className="mr-2"
        style={{ opacity: isUpdating ? 0.5 : 1 }}
      />
      <span className={completed ? "strike-through" : ""}>
        {title} ({projectTitle})
      </span>
    </li>
  )
}