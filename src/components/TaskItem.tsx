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
  status?: 'IN_PROGRESS' | 'COMPLETED'
  description?: string
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
  displayUser = false,
  status = 'IN_PROGRESS',
  description
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
        description,
        status,
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
        description,
        status,
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

  // Handle clicking on the main task area to toggle completion
  const handleTaskAreaClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on action buttons or if currently updating
    if (isUpdating || isDeleting) return
    
    // Check if the click target is an action button or its children
    const target = e.target as HTMLElement
    if (target.closest('.task-actions') || target.closest('.task-checkbox-wrapper')) {
      return
    }
    
    // Toggle the completion state
    handleChange(!completed)
  }

  return (
    <div className={`task-card ${completed ? 'task-completed' : ''} ${isUpdating ? 'task-updating' : ''}`} key={`${id}-${updateCount}`}>
      <div className="task-card-content">
        <div className="task-checkbox-wrapper">
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => handleChange(e.target.checked)}
            disabled={isUpdating || isDeleting}
            className="task-checkbox"
          />
          {isUpdating && (
            <div className="task-updating-indicator">
              <div className="spinner-ring"></div>
            </div>
          )}
        </div>
        
        <div className="task-main-content" onClick={handleTaskAreaClick}>
          {isEditing ? (
            <div className="task-edit-input">
              <input
                ref={inputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={handleKeyDown}
                disabled={isUpdating}
                className="edit-input"
                placeholder="Task title..."
              />
              <div className="edit-hint">Press Enter to save, Escape to cancel</div>
            </div>
          ) : (
            <>
              <div className="task-title-wrapper">
                <div className="task-header">
                  <h4 className={`task-title ${completed ? 'completed' : ''}`}>
                    {editedTitle}
                  </h4>
                  <div className="task-badges">
                    <span className={`status-badge status-${status.toLowerCase().replace('_', '-')}`}>
                      {status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                {description && (
                  <p className="task-description">{description}</p>
                )}
                
                <div className="task-meta">
                  {displayProject && projectTitle && (
                    <span className="task-project">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9,22 9,12 15,12 15,22"/>
                      </svg>
                      {projectTitle}
                    </span>
                  )}
                  
                  {displayUser && userName && (
                    <span className="task-user">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      {userName}
                    </span>
                  )}
                  

                </div>
              </div>
              
              <div className="task-actions">
                <button
                  onClick={handleStartEdit}
                  disabled={isDeleting}
                  className="task-action-btn edit-btn"
                  title="Edit task"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="task-action-btn delete-btn"
                  title="Delete task"
                >
                  {isDeleting ? (
                    <div className="spinner-ring"></div>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}