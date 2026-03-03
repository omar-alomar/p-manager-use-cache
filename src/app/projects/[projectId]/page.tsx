import { getProjectComments } from "@/db/comments"
import { getProject } from "@/db/projects"
import { getUser, getUsers } from "@/db/users"
import { getProjects } from "@/db/projects"
import { getClients } from "@/db/clients"
import Link from "next/link"
import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/auth/currentUser"
import { DeleteButton } from "./_DeleteButton"
import { getProjectTasks } from "@/db/tasks"
import { TaskItem } from "@/components/TaskItem"
import { EditableProjectField } from "@/components/EditableProjectField"
import { AddTaskToProjectButton } from "@/components/AddTaskToProjectButton"
import { ProjectEmptyStateActions } from "@/components/ProjectEmptyStateActions"
import { CommentForm } from "@/components/CommentForm"
import { CommentItem } from "@/components/CommentItem"
import { ProjectHeroActions } from "@/components/ProjectHeroActions"
import { MilestoneItem } from "@/components/MilestoneItem"
import { AddMilestoneButton } from "@/components/AddMilestoneButton"

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
            <div className="hero-top-row">
              <div className="hero-identity">
                <div className="hero-avatar">
                  <div className="avatar-circle skeleton-avatar"></div>
                </div>
                <div className="hero-title-group">
                  <div className="skeleton-heading" style={{ width: '60%' }}></div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <div className="skeleton" style={{ width: 80, height: 20, borderRadius: 999 }}></div>
                    <div className="skeleton" style={{ width: 90, height: 20, borderRadius: 999 }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="hero-body">
              <div className="skeleton-text" style={{ width: '90%' }}></div>
              <div className="skeleton-text" style={{ width: '65%', marginTop: 6 }}></div>
            </div>
            <div className="hero-stats-bar">
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
                  <div className="skeleton" style={{ width: 24, height: 22 }}></div>
                  <div className="skeleton-text" style={{ width: 50 }}></div>
                </div>
              ))}
            </div>
          </div>
        }
      >
        <ProjectHero projectId={projectId} />
      </Suspense>

      <div className="project-content-grid">
        {/* Project Details Section */}
        <Suspense
          fallback={
            <div className="content-section">
              <div className="section-header">
                <div className="section-icon skeleton-icon"></div>
                <div className="section-title-group">
                  <div className="skeleton-heading" style={{ width: '45%' }}></div>
                  <div className="skeleton-text short" style={{ marginTop: 4 }}></div>
                </div>
              </div>
              <div className="section-content">
                <div className="skeleton-detail-grid">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton-detail-item">
                      <div className="skeleton-text short"></div>
                      <div className="skeleton" style={{ width: '70%', marginTop: 6 }}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        >
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
              <ProjectDetails projectId={projectId} />
            </div>
          </div>
        </Suspense>

        {/* Tasks Section */}
        <Suspense
          fallback={
            <div className="content-section">
              <div className="section-header">
                <div className="section-icon skeleton-icon"></div>
                <div className="section-title-group">
                  <div className="skeleton-heading" style={{ width: '30%' }}></div>
                  <div className="skeleton-text short" style={{ marginTop: 4 }}></div>
                </div>
              </div>
              <div className="section-content">
                <div className="skeleton-tasks-list">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton-task-row">
                      <div className="skeleton-checkbox"></div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                        <div className="skeleton" style={{ width: `${70 - i * 12}%` }}></div>
                        <div className="skeleton-text" style={{ width: '30%' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        >
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
              <Tasks projectId={projectId} />
            </div>
          </div>
        </Suspense>

        {/* Comments Section */}
        <Suspense
          fallback={
            <div className="content-section">
              <div className="section-header">
                <div className="section-icon skeleton-icon"></div>
                <div className="section-title-group">
                  <div className="skeleton-heading" style={{ width: '50%' }}></div>
                  <div className="skeleton-text short" style={{ marginTop: 4 }}></div>
                </div>
              </div>
              <div className="section-content">
                <div className="skeleton-comments-list">
                  {[1, 2].map((i) => (
                    <div key={i} className="skeleton-comment-row">
                      <div className="skeleton-avatar"></div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                        <div className="skeleton-text" style={{ width: '25%' }}></div>
                        <div className="skeleton" style={{ width: `${85 - i * 20}%` }}></div>
                        <div className="skeleton-text" style={{ width: `${60 - i * 15}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        >
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
                  <div className="skeleton-comments-list">
                    {[1, 2].map((i) => (
                      <div key={i} className="skeleton-comment-row">
                        <div className="skeleton-avatar"></div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                          <div className="skeleton-text" style={{ width: '25%' }}></div>
                          <div className="skeleton" style={{ width: `${85 - i * 20}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              >
                <Comments projectId={projectId} />
              </Suspense>
            </div>
          </div>
        </Suspense>
      </div>
    </div>
  )
}

async function ProjectHero({ projectId }: { projectId: string }) {
  try {
    const [project, tasks, allUsers, allClients] = await Promise.all([
      getProject(projectId),
      getProjectTasks(projectId),
      getUsers(),
      getClients(),
    ])
    if (project == null) return notFound()

    const completedTasks = tasks.filter(task => task.completed).length
    const activeTasks = tasks.filter(task => !task.completed).length

    const completionPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

    // Minimal shapes for the form props
    const usersForForm = allUsers.map(u => ({ id: u.id, name: u.name }))
    const clientsForForm = allClients.map(c => ({ id: c.id, name: c.name, email: c.email }))
    const projectForForm = {
      ...project,
      client: project.clientRef?.name || "No Client",
      clientId: project.clientRef?.id || null,
    }

    return (
      <div className="project-hero">
        {/* Row 1: Identity + Actions */}
        <div className="hero-top-row">
          <div className="hero-identity">
            <div className="hero-avatar">
              <Suspense fallback={<div className="avatar-circle skeleton-avatar"></div>}>
                <ProjectManagerAvatar projectId={projectId} />
              </Suspense>
            </div>
            <div className="hero-title-group">
              <div className="hero-title-row">
                <h1 className="hero-name">{project.title}</h1>
                {project.archived && (
                  <span className="hero-badge archived">Archived</span>
                )}
              </div>
              <div className="hero-tags">
                {project.clientRef && (
                  <Link
                    href={`/clients/${project.clientRef.id}`}
                    className="hero-tag client clickable"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    {project.clientRef.name}
                  </Link>
                )}
                <Suspense fallback={null}>
                  <ProjectManagerTag projectId={projectId} />
                </Suspense>
              </div>
            </div>
          </div>
          <div className="hero-actions">
            <ProjectHeroActions
              projectId={projectId}
              archived={project.archived ?? false}
              users={usersForForm}
              clients={clientsForForm}
              project={projectForForm}
            />
            <DeleteButton projectId={projectId} />
          </div>
        </div>

        {/* Row 2: Description */}
        <div className="hero-body">
          <EditableProjectField
            projectId={project.id}
            field="body"
            initialValue={project.body}
            placeholder="Add a project description..."
            multiline
          />
        </div>

        {/* Row 3: Stats bar */}
        <div className="hero-stats-bar">
          <div className="hero-stat">
            <span className="hero-stat-number">{tasks.length}</span>
            <span className="hero-stat-label">Total</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-number hero-stat-success">{completedTasks}</span>
            <span className="hero-stat-label">Completed</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-number hero-stat-warning">{activeTasks}</span>
            <span className="hero-stat-label">Active</span>
          </div>
          {tasks.length > 0 && (
            <>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <div className="hero-progress-ring">
                  <svg viewBox="0 0 36 36" width="32" height="32">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="var(--neutral-200)"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="var(--primary-500)"
                      strokeWidth="3"
                      strokeDasharray={`${completionPct}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="hero-progress-text">{completionPct}%</span>
                </div>
              </div>
            </>
          )}
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

        <div className="detail-item full-width">
          <div className="detail-label-row">
            <label className="detail-label">Milestones</label>
            <AddMilestoneButton projectId={project.id} />
          </div>
          {project.milestones && project.milestones.length > 0 ? (
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
          ) : (
            <div className="detail-value">
              <span className="milestone-neutral">No milestones</span>
            </div>
          )}
        </div>

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

async function ProjectManagerTag({ projectId }: { projectId: string }) {
  try {
    const project = await getProject(projectId)
    if (project == null) return null
    const user = await getUser(project.userId)
    if (user == null) return null

    return (
      <Link href={`/users/${user.id}`} className="hero-tag manager clickable">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        {user.name}
      </Link>
    )
  } catch {
    return null
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
      getProjects({ includeArchived: true }) // include archived so current project stays in dropdown when archived
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
            urgency={task.urgency}
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


