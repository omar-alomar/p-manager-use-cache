"use client"

import { useState, useEffect } from "react"
import { updateTaskCompletionAction, verifyTaskUpdate } from "@/actions/tasks"

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
  const [updateCount, setUpdateCount] = useState(0)

  useEffect(() => {
    setCompleted(initialCompleted)
  }, [initialCompleted])

  async function handleChange(newCompleted: boolean) {
    console.log(`Task ${id}: Changing from ${completed} to ${newCompleted}`)
    
    setCompleted(newCompleted)
    setIsUpdating(true)
    
    try {
      // Update the task
      await updateTaskCompletionAction(id, {
        title,
        completed: newCompleted,
        userId,
        projectId
      })
      
      // Wait a bit for DB to settle
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Verify the update actually happened
      const verifiedTask = await verifyTaskUpdate(id)
      console.log(`Task ${id}: Verified state = ${verifiedTask?.completed}`)
      
      if (verifiedTask?.completed !== newCompleted) {
        console.error(`Task ${id}: Update failed! Reverting...`)
        setCompleted(!newCompleted)
        alert('Update failed! Please try again.')
      } else {
        // Force a re-render with a counter
        setUpdateCount(c => c + 1)
      }
      
    } catch (error) {
      console.error('Failed to update task:', error)
      setCompleted(!newCompleted)
      alert('Update failed! Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <li className="no-bullets" key={`${id}-${updateCount}`}>
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