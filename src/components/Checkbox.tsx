"use client"

import { useState, useEffect } from "react"
import { updateTaskCompletionAction } from "@/actions/tasks"
import { useRouter } from "next/navigation"

interface CheckboxProps {
  taskId: number
  initialChecked: boolean
  title: string
  userId: number
  projectId: number
}

export function Checkbox({ taskId, initialChecked, title, userId, projectId }: CheckboxProps) {
  const [checked, setChecked] = useState(initialChecked)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  // Update local state if prop changes
  useEffect(() => {
    console.log(`Checkbox ${taskId} prop changed: ${initialChecked}`)
    setChecked(initialChecked)
  }, [initialChecked, taskId])

  async function handleChange(newChecked: boolean) {
    console.log('Checkbox clicked:', { taskId, checked: newChecked, userId, projectId })
    
    // Update local state immediately
    setChecked(newChecked)
    
    setIsUpdating(true)
    try {
      await updateTaskCompletionAction(taskId, {
        title,
        completed: newChecked,
        userId,
        projectId
      })
      console.log('Update successful, refreshing...')
      
      // Force refresh with timestamp to break cache
      router.refresh()
      
      // Force a hard refresh after a short delay
      setTimeout(() => {
        router.refresh()
      }, 100)
    } catch (error) {
      console.error('Failed to update task:', error)
      // Revert on error
      setChecked(!newChecked)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => handleChange(e.target.checked)}
      disabled={isUpdating}
      className="mr-2"
      style={{ opacity: isUpdating ? 0.5 : 1 }}
    />
  )
}