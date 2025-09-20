import { getProjectComments } from "@/db/comments"
import { getProject } from "@/db/projects"
import { getUser, getUsers } from "@/db/users"
import { getProjects } from "@/db/projects"
import Link from "next/link"
import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/auth/currentUser"
import { DeleteButton } from "./_DeleteButton"
import { getProjectTasks } from "@/db/tasks"
import { TaskItem } from "@/components/TaskItem"
import { formatDate } from "@/utils/dateUtils"
import { EditableComments } from "@/components/EditableComments"
import { AddTaskToProjectButton } from "@/components/AddTaskToProjectButton"
import { ProjectEmptyStateActions } from "@/components/ProjectEmptyStateActions"
import { CommentForm } from "@/components/CommentForm"
import { CommentItem } from "@/components/CommentItem"
import { ProjectHeroActions } from "@/components/ProjectHeroActions"
import { MilestoneItem } from "@/components/MilestoneItem"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  // Check if user is authenticated
  const user = await getCurrentUser()
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login")
  }

  const { projectId } = await params

  return (
    <div className="project-profile-container">
      {/* Hero Section */}
      <Suspense
        fallback={
          <div className="project-hero skeleton-hero">
            <div className="hero-left-section">
              <div className="hero-avatar">
                <div className="avatar-circle skeleton-avatar"></div>
              </div>
              <div className="hero-basic-info">
                <div className="skeleton-title"></div>
                <div className="skeleton-subtitle"></div>
              </div>
            </div>
          </div>
        }
      >
        <ProjectHero projectId={projectId} />
      </Suspense>

      <div className="project-content-grid">
        {/* Project Details Section */}
        <div className="content-section">
          <div className="section-header">
            <div className="section-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="section-title-group">
              <h2 className="section-title">Project Details</h2>
              <p className="section-subtitle">Project information and metadata</p>
            </div>
          </div>
          
          <div className="section-content">
            <Suspense
              fallback={
                <div className="skeleton-content">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="skeleton-row">
                      <div className="skeleton-label"></div>
                      <div className="skeleton-value"></div>
                    </div>
                  ))}
                </div>
              }
            >
              <ProjectDetails projectId={projectId} />
            </Suspense>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="content-section">
          <div className="section-header">
            <div className="section-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22,4 12,14.01 9,11.01"/>
              </svg>
            </div>
            <div className="section-title-group">
              <h2 className="section-title">Tasks</h2>
              <p className="section-subtitle">Project task management</p>
            </div>
            <div className="section-actions">
              <AddTaskToProjectButton projectId={projectId} />
            </div>
          </div>
          
          <div className="section-content">
            <Suspense
              fallback={
                <div className="skeleton-content">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton-task"></div>
                  ))}
                </div>
              }
            >
              <Tasks projectId={projectId} />
            </Suspense>
          </div>
        </div>

        {/* Comments Section */}
        <div className="content-section">
          <div className="section-header">
            <div className="section-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="section-title-group">
              <h2 className="section-title">Project Comments</h2>
              <p className="section-subtitle">Share feedback and discuss this project</p>
            </div>
          </div>
          
          <div className="section-content">
            <CommentForm projectId={projectId} />
            
            <div className="comments-divider">
              <span>Recent Comments</span>
            </div>
            
            <Suspense
              fallback={
                <div className="skeleton-content">
                  <div className="skeleton-comment"></div>
                </div>
              }
            >
              <Comments projectId={projectId} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

async function ProjectHero({ projectId }: { projectId: string }) {
  try {
    const project = await getProject(projectId)
    if (project == null) return notFound()

    const tasks = await getProjectTasks(projectId)
    const completedTasks = tasks.filter(task => task.completed).length
    const activeTasks = tasks.filter(task => !task.completed).length

    return (
      <div className="project-hero">
        {/* Left Section - Project Info */}
        <div className="hero-left-section">
          <div className="hero-avatar">
            <Suspense fallback={<div className="avatar-circle skeleton-avatar"></div>}>
              <ProjectManagerAvatar projectId={projectId} />
            </Suspense>
          </div>
          
          <div className="hero-basic-info">
            <h1 className="hero-name">{project.title}</h1>
            <div className="hero-tags">
              {project.clientRef && (
                <Link 
                  href={`/clients/${project.clientRef.id}`}
                  className="hero-tag client clickable"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  {project.clientRef.name}
                </Link>
              )}
              {project.milestones && project.milestones.length > 0 && (() => {
                // Filter out completed milestones
                const activeMilestones = project.milestones.filter(milestone => !milestone.completed)
                
                if (activeMilestones.length === 0) return null
                
                const nearestMilestone = activeMilestones.reduce((nearest, current) => {
                  const now = new Date()
                  // Normalize to UTC midnight for date-only comparison (milestone dates are stored in UTC)
                  const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
                  const nearestDate = new Date(nearest.date)
                  const nearestDateUTC = new Date(Date.UTC(nearestDate.getUTCFullYear(), nearestDate.getUTCMonth(), nearestDate.getUTCDate()))
                  const currentDate = new Date(current.date)
                  const currentDateUTC = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()))
                  
                  // If current is today or in the future and nearest is not, or if both are today/future and current is closer
                  if (currentDateUTC >= todayUTC && (nearestDateUTC < todayUTC || currentDate < nearestDate)) {
                    return current
                  }
                  // If both are in the past, take the most recent
                  if (currentDateUTC < todayUTC && nearestDateUTC < todayUTC && currentDate > nearestDate) {
                    return current
                  }
                  return nearest
                })
                
                // Calculate milestone color class based on date proximity
                const getMilestoneColorClass = (milestoneDate: Date) => {
                  const now = new Date()
                  const milestone = new Date(milestoneDate)
                  const diffTime = milestone.getTime() - now.getTime()
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                  
                  if (diffDays <= 14) {
                    return 'milestone-urgent' // Red - within 2 weeks
                  } else if (diffDays <= 30) {
                    return 'milestone-warning' // Yellow - within a month
                  } else {
                    return 'milestone-safe' // Green - more than a month
                  }
                }
                
                return (
                  <span className={`hero-tag milestone ${getMilestoneColorClass(nearestMilestone.date)}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    {formatDate(nearestMilestone.date)}
                  </span>
                )
              })()}
            </div>
            
            <div className="hero-comments">
              <EditableComments
                projectId={project.id}
                initialComments={project.body}
                title={project.title}
                clientId={project.clientId}
                body={project.body}
                milestone={project.milestone}
                mbaNumber={project.mbaNumber || ""}
                coFileNumbers={project.coFileNumbers || ""}
                dldReviewer={project.dldReviewer || ""}
                userId={project.userId}
              />
            </div>
          </div>
        </div>

        {/* Right Section - Stats & Actions */}
        <div className="hero-right-section">
          <div className="hero-stats">
            <div className="stat-card primary">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-number">{tasks.length}</div>
                <div className="stat-label">Total</div>
              </div>
            </div>
            
            <div className="stat-card success">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-number">{completedTasks}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
            
            <div className="stat-card warning">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-number">{activeTasks}</div>
                <div className="stat-label">Active</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="hero-actions">
            <ProjectHeroActions projectId={projectId} />
            <DeleteButton projectId={projectId} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error in ProjectHero:', error)
    return (
      <div className="project-hero error">
        <div className="hero-error-content">
          <h1 className="hero-error-title">Error Loading Project</h1>
          <p className="hero-error-message">There was an error loading the project information.</p>
        </div>
      </div>
    )
  }
}

async function ProjectDetails({ projectId }: { projectId: string }) {
  try {
    const project = await getProject(projectId)
    if (project == null) return notFound()

    return (
      <div className="project-details-grid">
        <div className="detail-item">
          <label className="detail-label">
            Project Manager
          </label>
          <div className="detail-value">
            <Suspense fallback={<span className="loading-text">Loading...</span>}>
              <UserDetails userId={project.userId} />
            </Suspense>
          </div>
        </div>

        {project.clientRef && (
          <div className="detail-item">
            <label className="detail-label">
              Client
            </label>
            <div className="detail-value">
              <Link 
                href={`/clients/${project.clientRef.id}`}
                className="user-link"
              >
                {project.clientRef.name}
              </Link>
            </div>
          </div>
        )}

        {project.milestones && project.milestones.length > 0 && (
          <div className="detail-item">
            <label className="detail-label">
              Milestones
            </label>
            <div className="detail-value">
              <div className="milestone-details-grid">
                {project.milestones
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((milestone, index) => (
                    <MilestoneItem
                      key={milestone.id || index}
                      id={milestone.id}
                      date={milestone.date}
                      item={milestone.item}
                      completed={milestone.completed || false}
                      projectId={project.id}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}



      </div>
    )
  } catch (error) {
    console.error('Error in ProjectDetails:', error)
    return (
      <div className="error-state">
        <p className="error-message">Error loading project details</p>
      </div>
    )
  }
}

async function ProjectManagerAvatar({ projectId }: { projectId: string }) {
  try {
    const project = await getProject(projectId)
    if (project == null) return notFound()
    
    const user = await getUser(project.userId)
    if (user == null) return notFound()

    // Generate initials from user name
    const initials = user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    return (
      <Link href={`/users/${user.id}`} className="avatar-link">
        <div className="avatar-circle">
          <span className="avatar-text">{initials}</span>
        </div>
      </Link>
    )
  } catch (error) {
    console.error('Error in ProjectManagerAvatar:', error)
    return (
      <div className="avatar-circle error">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
    )
  }
}

async function UserDetails({ userId }: { userId: number }) {
  try {
    const user = await getUser(userId)
    if (user == null) return notFound()

    return (
      <Link 
        href={`/users/${user.id}`} 
        className="user-link"
      >
        {user.name}
      </Link>
    )
  } catch (error) {
    console.error('Error in UserDetails:', error)
    return <span className="error-text">Error loading user</span>
  }
}

async function Tasks({ projectId }: { projectId: string }) {
  try {
    const [tasks, project, users, projects] = await Promise.all([
      getProjectTasks(projectId),
      getProject(projectId),
      getUsers(),
      getProjects()
    ])
    
    if (tasks.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
          </div>
          <h3 className="empty-title">No tasks yet</h3>
          <p className="empty-description">Get started by creating your first task for this project.</p>
          <ProjectEmptyStateActions projectId={projectId} />
        </div>
      )
    }

    return (
      <div className="tasks-list">
        {tasks.map(task => (
          <TaskItem 
            key={task.id}
            id={task.id}
            initialCompleted={task.completed}
            title={task.title}
            projectId={task.projectId}
            projectTitle={project?.title || ""}
            userId={task.userId}
            userName={task.User?.name}
            createdAt={task.createdAt}
            displayProject={false}
            displayUser={true}
            displayCreatedAt={true}
            users={users}
            projects={projects}
          />
        ))}
      </div>
    )
  } catch (error) {
    console.error('Error in Tasks:', error)
    return (
      <div className="error-state">
        <p className="error-message">Error loading tasks</p>
      </div>
    )
  }
}

async function Comments({ projectId }: { projectId: string }) {
  try {
    const comments = await getProjectComments(projectId)
    const project = await getProject(projectId)

    if (project == null) return notFound()

    if (comments.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h3 className="empty-title">No comments yet</h3>
          <p className="empty-description">Be the first to share your thoughts about this project!</p>
        </div>
      )
    }

    return (
      <div className="comments-container">
        <div className="external-comments">
          <div className="comments-list">
            {comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error in Comments:', error)
    return (
      <div className="error-state">
        <p className="error-message">Error loading comments</p>
      </div>
    )
  }
}


