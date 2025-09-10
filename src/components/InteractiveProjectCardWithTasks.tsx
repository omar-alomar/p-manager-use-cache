"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { UserIcon, BriefcaseIcon } from "@/components/icons"
import { TaskItem } from "./TaskItem"
import { formatDate } from "@/utils/dateUtils"

function getApfoStatus(apfo: Date | null): string {
  if (!apfo) return 'normal'
  
  const today = new Date()
  const apfoDate = new Date(apfo)
  const diffTime = apfoDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 14) return 'urgent'
  if (diffDays <= 28) return 'warning'
  return 'normal'
}

interface Task {
  id: number
  title: string
  completed: boolean
  userId: number
  projectId: number
  User?: { name: string }
  Project?: { title: string }
}

interface ProjectManager {
  id: number
  name: string
}

interface InteractiveProjectCardWithTasksProps {
  id: number
  title: string
  client: string
  clientId?: number | null
  body: string
  apfo: Date | null
  apfos?: { id: number; date: Date; item: string }[]
  userId: number
  showManager?: boolean
  showClient?: boolean
  tasks: Task[]
  projectManager?: ProjectManager | null
}

export function InteractiveProjectCardWithTasks({
  id,
  title,
  client,
  clientId,
  body,
  apfo,
  apfos,
  userId,
  showManager = true,
  showClient = true,
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
  const [deletedTaskIds, setDeletedTaskIds] = useState<Set<number>>(new Set())

  const activeTasks = localTasks.filter(task => !task.completed)
  const completedTasks = localTasks.filter(task => task.completed)

  // Sync local tasks with tasks prop, but filter out deleted tasks
  useEffect(() => {
    const validTasks = Array.isArray(tasks) ? tasks.filter(task => 
      task && typeof task === 'object' && 
      typeof task.id === 'number' && 
      typeof task.title === 'string' &&
      typeof task.completed === 'boolean'
    ) : []
    
    // Filter out any tasks that we've marked as deleted
    const filteredTasks = validTasks.filter(task => !deletedTaskIds.has(task.id))
    setLocalTasks(filteredTasks)
  }, [tasks, deletedTaskIds])

  // Handle task updates from TaskItem component
  const handleTaskUpdate = (taskId: number, updates: { completed?: boolean; title?: string; deleted?: boolean }) => {
    if (updates.deleted) {
      // Add the task ID to our deleted set
      setDeletedTaskIds(prev => new Set([...prev, taskId]))
    } else {
      // Update the task in local state
      setLocalTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, ...updates }
            : task
        )
      )
    }
  }

  return (
    <div className="enhanced-project-card with-tasks">
      <div className="project-card-header">
        <div className="project-title-section">
          <h3 className="project-title">{title}</h3>
          {showClient && (
            <div className="project-client">
              <BriefcaseIcon />
              {client && clientId ? (
                <Link href={`/clients/${clientId}`} className="client-name-link">
                  <span className="client-name">{client}</span>
                </Link>
              ) : (
                <span className="client-name-placeholder">No client specified</span>
              )}
            </div>
          )}
        </div>
        
        <div className="project-meta">
          {(() => {
            // Use nearest APFO date from apfos array if available, otherwise fall back to single apfo
            const nearestApfo = apfos && apfos.length > 0 
              ? apfos.reduce((nearest, current) => {
                  const now = new Date()
                  const nearestDate = new Date(nearest.date)
                  const currentDate = new Date(current.date)
                  
                  // If current is in the future and nearest is not, or if both are in future and current is closer
                  if (currentDate >= now && (nearestDate < now || currentDate < nearestDate)) {
                    return current
                  }
                  // If both are in the past, take the most recent
                  if (currentDate < now && nearestDate < now && currentDate > nearestDate) {
                    return current
                  }
                  return nearest
                })
              : apfo ? { date: apfo, item: '' } : null

            return nearestApfo && (
              <div className={`project-apfo ${getApfoStatus(nearestApfo.date)}`}>
                <span className="apfo-label">APFO</span>
                <span className="apfo-value">
                  {formatDate(nearestApfo.date)}
                </span>
              </div>
            )
          })()}
          {showManager && projectManager && <ProjectManagerInline projectManager={projectManager} />}
        </div>
      </div>

      <div className="project-card-body">
        <div className="project-description">
          {body ? (
            <div className="project-text">{body.length > 150 ? `${body.substring(0, 150)}...` : body}</div>
          ) : (
            <div className="project-text-placeholder">No description available</div>
          )}
        </div>
        
        {/* Tasks Section */}
        {localTasks.length > 0 && (
          <div className="project-tasks-section">
            <div className="tasks-header">
              <h4 className="tasks-title">
                Assigned Tasks ({activeTasks.length} active, {completedTasks.length} completed)
              </h4>
            </div>
            
            <div className="project-tasks-list">
              {localTasks.slice(0, 5).map(task => (
                <TaskItem
                  key={task.id}
                  id={task.id}
                  initialCompleted={task.completed}
                  title={task.title}
                  projectId={task.projectId}
                  projectTitle={task.Project?.title || title}
                  userId={task.userId}
                  userName={task.User?.name || ''}
                  displayProject={false}
                  displayUser={false}
                  onUpdate={handleTaskUpdate}
                />
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
      <Link href={`/users/${projectManager.id}`} className="manager-name-link">
        <span className="manager-name">{projectManager.name}</span>
      </Link>
    </div>
  )
}
