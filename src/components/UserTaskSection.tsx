"use client"

import { useState } from "react"
import { TaskItem } from "./TaskItem"

interface Task {
  id: number
  title: string
  completed: boolean
  userId: number
  projectId: number | null
  createdAt: Date
  updatedAt: Date
  User: { id: number; name: string }
  Project?: { id: number; title: string } | null
}

interface UserTaskSectionProps {
  user: { id: number; name: string }
  tasks: Task[]
  users: { id: number; name: string }[]
  projects: { id: number; title: string }[]
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function UserTaskSection({ 
  user, 
  tasks, 
  users, 
  projects, 
  isCollapsed = true,
  onToggleCollapse 
}: UserTaskSectionProps) {
  const [isSectionCollapsed, setIsSectionCollapsed] = useState(isCollapsed)
  
  const completedTasks = tasks.filter(task => task.completed)
  const inProgressTasks = tasks.filter(task => !task.completed)

  const handleToggleCollapse = () => {
    setIsSectionCollapsed(!isSectionCollapsed)
    onToggleCollapse?.()
  }

  return (
    <div className="user-task-section">
      <div 
        className="user-section-header"
        onClick={handleToggleCollapse}
        style={{ cursor: 'pointer' }}
      >
        <div className="user-info">
          <div className="user-avatar">
            <span className="user-initials">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div className="user-details">
            <h3 className="user-name">{user.name}</h3>
          </div>
        </div>
        
        <div className="user-section-right">
          <div className="user-stats">
            <span className="stat-item">
              <span className="stat-number">{tasks.length}</span>
              <span className="stat-label">total</span>
            </span>
            <span className="stat-item">
              <span className="stat-number">{completedTasks.length}</span>
              <span className="stat-label">completed</span>
            </span>
            <span className="stat-item">
              <span className="stat-number">{inProgressTasks.length}</span>
              <span className="stat-label">in progress</span>
            </span>
          </div>
          
          <button 
            className="collapse-toggle"
            aria-label={isSectionCollapsed ? "Expand section" : "Collapse section"}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              style={{ 
                transform: isSectionCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            >
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </button>
        </div>
      </div>

      {!isSectionCollapsed && (
        <div className="user-tasks-content">
          {tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"/>
                  <path d="M9 11V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                  <path d="M9 7h6"/>
                </svg>
              </div>
              <h4 className="empty-state-title">No tasks assigned</h4>
              <p className="empty-state-description">
                This user doesn't have any tasks assigned yet.
              </p>
            </div>
          ) : (
            <div className="user-tasks-list">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  id={task.id}
                  initialCompleted={task.completed}
                  title={task.title}
                  projectId={task.projectId}
                  projectTitle={task.Project?.title || "No Project"}
                  userId={task.userId}
                  userName={task.User.name}
                  createdAt={task.createdAt}
                  displayProject={true}
                  displayUser={false}
                  displayCreatedAt={true}
                  users={users}
                  projects={projects}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
