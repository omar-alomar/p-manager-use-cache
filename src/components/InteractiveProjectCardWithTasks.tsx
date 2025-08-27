"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { UserIcon, BriefcaseIcon } from "@/components/icons"
import { updateTaskCompletionAction } from "@/actions/tasks"

interface Task {
  id: number
  title: string
  completed: boolean
  userId: number
  projectId: number
}

interface ProjectManager {
  id: number
  name: string
}

interface InteractiveProjectCardWithTasksProps {
  id: number
  title: string
  client: string
  body: string
  apfo: string
  userId: number
  showManager?: boolean
  tasks: Task[]
  projectManager?: ProjectManager | null
}

export function InteractiveProjectCardWithTasks({
  id,
  title,
  client,
  body,
  apfo,
  userId,
  showManager = true,
  tasks,
  projectManager
}: InteractiveProjectCardWithTasksProps) {
  // Validate and filter tasks
  const validTasks = Array.isArray(tasks) ? tasks.filter(task => 
    task && typeof task === 'object' && 
    typeof task.id === 'number' && 
    typeof task.title === 'string' &&
    typeof task.completed === 'boolean'
  ) : []
  
  const [localTasks, setLocalTasks] = useState<Task[]>(validTasks)
  const [updatingTasks, setUpdatingTasks] = useState<Set<number>>(new Set())

  const activeTasks = localTasks.filter(task => !task.completed)
  const completedTasks = localTasks.filter(task => task.completed)

  // Sync local tasks with tasks prop
  useEffect(() => {
    const validTasks = Array.isArray(tasks) ? tasks.filter(task => 
      task && typeof task === 'object' && 
      typeof task.id === 'number' && 
      typeof task.title === 'string' &&
      typeof task.completed === 'boolean'
    ) : []
    
    setLocalTasks(validTasks)
  }, [tasks])

  const handleTaskToggle = async (taskId: number, newCompleted: boolean) => {
    const task = localTasks.find(t => t.id === taskId)
    if (!task) return

    // Optimistically update the UI
    setLocalTasks(prev => 
      prev.map(t => 
        t.id === taskId ? { ...t, completed: newCompleted } : t
      )
    )
    
    setUpdatingTasks(prev => new Set(prev).add(taskId))

    try {
      await updateTaskCompletionAction(taskId, {
        title: task.title,
        completed: newCompleted,
        userId: task.userId,
        projectId: task.projectId
      })
    } catch (error) {
      console.error('Failed to update task:', error)
      // Revert the optimistic update on error
      setLocalTasks(prev => 
        prev.map(t => 
          t.id === taskId ? { ...t, completed: !newCompleted } : t
        )
      )
      
      // Show user-friendly error message
      alert(`Failed to update task. Please try again.`)
    } finally {
      setUpdatingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  return (
    <div className="enhanced-project-card with-tasks">
      <div className="project-card-header">
        <div className="project-title-section">
          <h3 className="project-title">{title}</h3>
          <div className="project-client">
            <BriefcaseIcon />
            <span>{client || 'No client specified'}</span>
          </div>
        </div>
        
        <div className="project-meta">
          {apfo && (
            <div className="project-apfo">
              <span className="apfo-label">APFO</span>
              <span className="apfo-value">{apfo}</span>
            </div>
          )}
          {showManager && projectManager && <ProjectManagerInline projectManager={projectManager} />}
        </div>
      </div>

      <div className="project-card-body">
        <div className="project-description">
          {body ? (
            <p className="project-text">{body.length > 150 ? `${body.substring(0, 150)}...` : body}</p>
          ) : (
            <p className="project-text-placeholder">No description available</p>
          )}
        </div>
        
        {/* Tasks Section */}
        {localTasks.length > 0 && (
          <div className="project-tasks-section">
            <div className="tasks-header">
              <h4 className="tasks-title">
                Tasks ({activeTasks.length} active, {completedTasks.length} completed)
              </h4>
            </div>
            
            <div className="project-tasks-list">
              {localTasks.slice(0, 5).map(task => (
                <div 
                  key={task.id} 
                  className={`project-task-item ${task.completed ? 'completed' : 'active'} ${updatingTasks.has(task.id) ? 'updating' : ''}`}
                >
                  <div className="task-checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) => handleTaskToggle(task.id, e.target.checked)}
                      disabled={updatingTasks.has(task.id)}
                      className="project-task-checkbox"
                      title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                    />
                    {updatingTasks.has(task.id) && (
                      <div className="task-updating-indicator">
                        <div className="spinner-ring"></div>
                      </div>
                    )}
                  </div>
                  <div className="task-status-indicator"></div>
                  <span className="task-title">{task.title}</span>
                </div>
              ))}
              
              {localTasks.length > 5 && (
                <div className="more-tasks-indicator">
                  <span className="more-tasks-text">+{localTasks.length - 5} more tasks</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="project-card-footer">
        <Link className="project-view-btn" href={`/projects/${id}`}>
          View Project
          <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>
    </div>
  )
}

function ProjectManagerInline({ projectManager }: { projectManager: ProjectManager }) {
  if (!projectManager || !projectManager.name) {
    return null
  }

  return (
    <div className="project-manager">
      <UserIcon />
      <span className="manager-name">{projectManager.name}</span>
    </div>
  )
}
