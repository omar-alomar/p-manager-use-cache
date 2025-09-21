"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { updateTaskCompletionAction, verifyTaskUpdate, deleteTaskAction } from "@/actions/tasks"
import { formatDate } from "@/utils/dateUtils"
import { SearchableSelect } from "./SearchableSelect"

interface TaskItemProps {
  id: number
  initialCompleted: boolean
  title: string
  projectId?: number | null
  projectTitle: string
  userId: number
  userName?: string
  createdAt: Date
  displayProject?: boolean
  displayUser?: boolean
  displayCreatedAt?: boolean
  users?: { id: number; name: string }[]
  projects?: { id: number; title: string }[]
  onUpdate?: (taskId: number, updates: { completed?: boolean; title?: string; deleted?: boolean }) => void
}

export function TaskItem({ 
  id, 
  initialCompleted, 
  title, 
  projectId, 
  projectTitle, 
  userId,
  userName,
  createdAt,
  displayProject = true,
  displayUser = false,
  displayCreatedAt = true,
  users = [],
  projects = [],
  onUpdate
}: TaskItemProps) {
  const [completed, setCompleted] = useState(initialCompleted)
  
  // Derive status from completed field
  const currentStatus = completed ? 'COMPLETED' : 'IN_PROGRESS'
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateCount, setUpdateCount] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(title)
  const [currentTitle, setCurrentTitle] = useState(title)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(userId)
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(projectId ?? undefined)
  const inputRef = useRef<HTMLInputElement>(null)
  const taskCardRef = useRef<HTMLDivElement>(null)


  useEffect(() => {
    setCompleted(initialCompleted)
  }, [initialCompleted])

  useEffect(() => {
    setCurrentTitle(title)
    setEditedTitle(title)
  }, [title])

  const handleSaveTitle = useCallback(async () => {
    if (editedTitle.trim() === '') {
      setEditedTitle(currentTitle)
      setIsEditing(false)
      return
    }

    if (editedTitle === currentTitle) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    
    try {
      await updateTaskCompletionAction(id, {
        title: editedTitle,
        completed,
        userId,
        projectId: projectId || undefined
      })
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const verifiedTask = await verifyTaskUpdate(id)
      
      if (verifiedTask?.title !== editedTitle) {
        console.error(`Task ${id}: Title update failed! Reverting...`)
        setEditedTitle(currentTitle)
        alert('Update failed! Please try again.')
      } else {
        setUpdateCount(c => c + 1)
        // Update local title state to reflect the change
        setCurrentTitle(editedTitle)
        // Notify parent component of the update
        onUpdate?.(id, { title: editedTitle })
      }
      
    } catch (error) {
      console.error('Failed to update task title:', error)
      setEditedTitle(currentTitle)
      alert('Update failed! Please try again.')
    } finally {
      setIsUpdating(false)
      setIsEditing(false)
    }
  }, [editedTitle, currentTitle, id, completed, userId, projectId, onUpdate])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Simple click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isEditing) return
      
      const target = event.target as Node
      
      // Don't exit if clicking inside the task card
      if (taskCardRef.current && taskCardRef.current.contains(target)) {
        return
      }
      
      // Don't exit if clicking on SearchableSelect elements (they're rendered via portal)
      if (target instanceof Element) {
        const isSearchableSelect = target.closest('.searchable-select__dropdown') || 
                                 target.closest('.searchable-select__trigger') ||
                                 target.closest('.searchable-select')
        if (isSearchableSelect) {
          return
        }
      }
      
      // Click is outside both task card and dropdowns, save and exit
      handleSaveTitle()
    }

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditing, handleSaveTitle])


  async function handleChange(newCompleted: boolean) {
    console.log(`Task ${id}: Changing from ${completed} to ${newCompleted}`)
    
    setCompleted(newCompleted)
    setIsUpdating(true)
    
    try {
      await updateTaskCompletionAction(id, {
        title: editedTitle,
        completed: newCompleted,
        userId,
        projectId: projectId || undefined
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
        // Notify parent component of the update
        onUpdate?.(id, { completed: newCompleted })
      }
      
    } catch (error) {
      console.error('Failed to update task:', error)
      setCompleted(!newCompleted)
      alert('Update failed! Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setEditedTitle(currentTitle)
      setIsEditing(false)
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveTitle()
    }
    // Shift+Enter would create new lines, but this is an input field so it won't work
    // Save happens on Enter or blur (clicking off)
  }

  function handleStartEdit() {
    setEditedTitle(currentTitle)
    setIsEditing(true)
  }

  async function handleUserChange(value: string | number | undefined) {
    const newUserId = typeof value === 'string' ? parseInt(value) : value
    if (newUserId === selectedUserId || isUpdating) return
    
    setIsUpdating(true)
    try {
      await updateTaskCompletionAction(id, {
        title: editedTitle,
        completed,
        userId: newUserId!,
        projectId: selectedProjectId
      })
      setSelectedUserId(newUserId)
      setUpdateCount(c => c + 1)
    } catch (error) {
      console.error('Failed to update user assignment:', error)
      alert('Failed to update user assignment. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleProjectChange(value: string | number | undefined) {
    const newProjectId = typeof value === 'string' ? parseInt(value) : value
    if (newProjectId === selectedProjectId || isUpdating) return
    
    setIsUpdating(true)
    try {
      await updateTaskCompletionAction(id, {
        title: editedTitle,
        completed,
        userId: selectedUserId!,
        projectId: newProjectId
      })
      setSelectedProjectId(newProjectId)
      setUpdateCount(c => c + 1)
    } catch (error) {
      console.error('Failed to update project assignment:', error)
      alert('Failed to update project assignment. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${editedTitle}"?`)) {
      return
    }

    setIsDeleting(true)
    
    try {
      const result = await deleteTaskAction(id)
      
      // Check if the action returned an error
      if (result && 'success' in result && !result.success) {
        alert(result.message || 'Failed to delete task. Please try again.')
        setIsDeleting(false)
        return
      }
      
      // If we get here, the delete was successful
      // Check if we have an onUpdate callback to notify parent component
      if (onUpdate) {
        // Notify parent component to remove this task from local state
        onUpdate(id, { deleted: true })
      }
      
      // If there's a redirectTo in the result, we'll be redirected
      // Otherwise, we're in a context where we need to handle the UI update locally
      if (!result?.redirectTo) {
        setIsDeleting(false)
      }
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
    // Don't toggle if clicking on action buttons, if currently updating, or if in edit mode
    if (isUpdating || isDeleting || isEditing) return
    
    // Check if the click target is an action button or its children
    const target = e.target as HTMLElement
    if (target.closest('.task-actions') || target.closest('.task-checkbox-wrapper')) {
      return
    }
    
    // Toggle the completion state
    handleChange(!completed)
  }


  return (
    <div ref={taskCardRef} className={`task-card ${completed ? 'task-completed' : ''} ${isUpdating ? 'task-updating' : ''} ${isEditing ? 'task-editing' : ''}`} key={`${id}-${updateCount}`}>
      <div className="task-card-content">
        <div className="task-checkbox-wrapper">
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => handleChange(e.target.checked)}
            disabled={isUpdating || isDeleting || isEditing}
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
            <div className="task-edit-container">
              <div className="task-edit-input">
                <input
                  ref={inputRef}
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isUpdating}
                  className="edit-input"
                  placeholder="Task title..."
                />
                <div className="edit-hint">Enter to save, Escape to cancel</div>
              </div>
              
              <div className="task-edit-fields">
                <div className="task-edit-field">
                  <label className="task-edit-label">Project:</label>
                  <SearchableSelect
                    options={[{ value: 0, label: "No Project" }, ...projects.map(project => ({ value: project.id, label: project.title }))]}
                    value={selectedProjectId ?? 0}
                    onChange={handleProjectChange}
                    placeholder="Select project"
                    disabled={isUpdating}
                    className="task-edit-select"
                  />
                </div>
                
                <div className="task-edit-field">
                  <label className="task-edit-label">Assigned To:</label>
                  <SearchableSelect
                    options={users.map(user => ({ value: user.id, label: user.name }))}
                    value={selectedUserId}
                    onChange={handleUserChange}
                    placeholder="Select user"
                    disabled={isUpdating}
                    className="task-edit-select"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="task-title-wrapper">
                <div className="task-header">
                  <h4 className={`task-title ${completed ? 'completed' : ''}`}>
                    {currentTitle}
                  </h4>
                  <div className="task-badges">
                    <span className={`status-badge status-${currentStatus.toLowerCase().replace('_', '-')}`}>
                      {currentStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
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
                  
                  {displayCreatedAt && (
                    <span className="task-created" title={`Created on ${formatDate(createdAt)}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                      <span className="task-created-label">Created</span>
                      {formatDate(createdAt)}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="task-actions">
                <a
                  href={`/tasks/${id}`}
                  className="task-action-btn comment-btn"
                  title="View task details"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </a>
                
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