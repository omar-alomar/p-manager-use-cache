"use client"

import { useState, useEffect, useRef } from "react"
import { updateTaskCompletionAction, verifyTaskUpdate, deleteTaskAction } from "@/actions/tasks"

interface TaskItemProps {
  id: number
  initialCompleted: boolean
  title: string
  projectId: number
  projectTitle: string
  userId: number
  userName?: string
  displayProject?: boolean
  displayUser?: boolean
}

export function TaskItem({ 
  id, 
  initialCompleted, 
  title, 
  projectId, 
  projectTitle, 
  userId,
  userName,
  displayProject = true,
  displayUser = false
}: TaskItemProps) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateCount, setUpdateCount] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(title)
  const [isDeleting, setIsDeleting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCompleted(initialCompleted)
  }, [initialCompleted])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  async function handleChange(newCompleted: boolean) {
    console.log(`Task ${id}: Changing from ${completed} to ${newCompleted}`)
    
    setCompleted(newCompleted)
    setIsUpdating(true)
    
    try {
      await updateTaskCompletionAction(id, {
        title: editedTitle,
        completed: newCompleted,
        userId,
        projectId
      })
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const verifiedTask = await verifyTaskUpdate(id)
      console.log(`Task ${id}: Verified state = ${verifiedTask?.completed}`)
      
      if (verifiedTask?.completed !== newCompleted) {
        console.error(`Task ${id}: Update failed! Reverting...`)
        setCompleted(!newCompleted)
        alert('Update failed! Please try again.')
      } else {
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

  async function handleSaveTitle() {
    if (editedTitle.trim() === '') {
      setEditedTitle(title)
      setIsEditing(false)
      return
    }

    if (editedTitle === title) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    
    try {
      await updateTaskCompletionAction(id, {
        title: editedTitle,
        completed,
        userId,
        projectId
      })
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const verifiedTask = await verifyTaskUpdate(id)
      
      if (verifiedTask?.title !== editedTitle) {
        console.error(`Task ${id}: Title update failed! Reverting...`)
        setEditedTitle(title)
        alert('Update failed! Please try again.')
      } else {
        setUpdateCount(c => c + 1)
      }
      
    } catch (error) {
      console.error('Failed to update task title:', error)
      setEditedTitle(title)
      alert('Update failed! Please try again.')
    } finally {
      setIsUpdating(false)
      setIsEditing(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      setEditedTitle(title)
      setIsEditing(false)
    }
  }

  function handleStartEdit() {
    setEditedTitle(title)
    setIsEditing(true)
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${editedTitle}"?`)) {
      return
    }

    setIsDeleting(true)
    
    try {
      await deleteTaskAction(id)
      // The redirect in deleteTaskAction will handle navigation
      // No need to set isDeleting to false as we're redirecting
    } catch (error) {
      // Check if this is a redirect error (which is expected)
      if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        // This is expected - the delete was successful and we're redirecting
        return
      }
      
      // Only show error for actual failures
      console.error('Failed to delete task:', error)
      alert('Failed to delete task. Please try again.')
      setIsDeleting(false)
    }
  }

  return (
    <li className="no-bullets task-item flex items-center gap-2 group" key={`${id}-${updateCount}`}>
      <input
        type="checkbox"
        checked={completed}
        onChange={(e) => handleChange(e.target.checked)}
        disabled={isUpdating || isDeleting}
        className="task-checkbox"
        style={{ opacity: isUpdating || isDeleting ? 0.5 : 1 }}
      />
      
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onBlur={handleSaveTitle}
          onKeyDown={handleKeyDown}
          disabled={isUpdating}
          className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ opacity: isUpdating ? 0.5 : 1 }}
        />
      ) : (
        <>
          <span 
            className={`${completed ? "strike-through" : ""} flex-1 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors`}
            onDoubleClick={handleStartEdit}
            style={{ opacity: isDeleting ? 0.5 : 1 }}
          >
            {editedTitle}
            {displayProject && (
              <span className="italic-text"> ({projectTitle})</span>
            )}
            {displayUser && userName && (
              <span className="italic-text"> ({userName})</span>
            )}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleStartEdit}
              disabled={isDeleting}
              className="opacity-0 group-hover:opacity-100 text-sm text-gray-500 hover:text-gray-700 transition-opacity p-1"
              title="Edit task"
            >
              ✏️
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="opacity-0 group-hover:opacity-100 text-sm text-red-500 hover:text-red-700 transition-opacity p-1"
              title="Delete task"
            >
              🗑️
            </button>
          </div>
        </>
      )}
    </li>
  )
}