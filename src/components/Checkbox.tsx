"use client"

import { useOptimistic, useTransition } from "react"
import { updateTaskCompletionAction } from "@/actions/tasks"

interface CheckboxProps {
  taskId: number
  initialChecked: boolean
  title: string
  userId: number
  projectId: number
}

export function Checkbox({ taskId, initialChecked, title, userId, projectId }: CheckboxProps) {
  const [optimisticChecked, setOptimisticChecked] = useOptimistic(
    initialChecked ?? false,
    (state, newChecked: boolean) => newChecked
  )
  const [isPending, startTransition] = useTransition()

  function handleChange(checked: boolean) {
    startTransition(async () => {
      // Optimistically update the UI
      setOptimisticChecked(checked)
      
      try {
        // Update the task in the database
        await updateTaskCompletionAction(taskId, {
          title,
          completed: checked,
          userId,
          projectId
        })
      } catch (error) {
        console.error('Failed to update task:', error)
        // Revert the optimistic update on error
        setOptimisticChecked(!checked)
      }
    })
  }

  return (
    <input
      type="checkbox"
      checked={optimisticChecked ?? false}
      onChange={(e) => handleChange(e.target.checked)}
      disabled={isPending}
      className="mr-2"
    />
  )
}