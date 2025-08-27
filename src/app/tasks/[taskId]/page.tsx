import { getTask } from "@/db/tasks"
import { getUser } from "@/db/users"
import { getProject } from "@/db/projects"
import { Skeleton } from "@/components/Skeleton"
import Link from "next/link"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { TaskItem } from "@/components/TaskItem"
import { TaskActions } from "./_TaskActions"

export default async function TaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = await params

  return (
    <div className="task-page">
      <Suspense
        fallback={
          <div className="task-hero skeleton-hero">
            <div className="hero-content">
              <div className="hero-title">
                <Skeleton inline short />
              </div>
              <div className="hero-subtitle">
                <Skeleton short inline />
                <Skeleton short inline />
              </div>
              <div className="hero-actions">
                <Skeleton short inline />
                <Skeleton short inline />
              </div>
            </div>
          </div>
        }
      >
        <TaskHero taskId={taskId} />
      </Suspense>

      <div className="task-content">
        <div className="content-grid">
          {/* Task Details Section */}
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Task Details
              </h2>
            </div>
            <div className="task-details-container">
              <Suspense
                fallback={
                  <div className="task-details-skeleton">
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                  </div>
                }
              >
                <TaskDetails taskId={taskId} />
              </Suspense>
            </div>
          </div>

          {/* Task Actions Section */}
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Actions
              </h2>
            </div>
            <div className="task-actions-container">
              <Suspense
                fallback={
                  <div className="task-actions-skeleton">
                    <Skeleton />
                    <Skeleton />
                  </div>
                }
              >
                <TaskActions taskId={taskId} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

async function TaskHero({ taskId }: { taskId: string }) {
  const task = await getTask(taskId)
  
  if (!task) {
    notFound()
  }

  const user = await getUser(task.userId)
  const project = await getProject(task.projectId)

  return (
    <div className="task-hero">
      <div className="hero-content">
        <div className="hero-title">
          <h1>{task.title}</h1>
        </div>
        <div className="hero-subtitle">
          <div className="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
            <span>Created {task.createdAt.toLocaleDateString()}</span>
          </div>
          <div className="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Assigned to {user?.name}</span>
          </div>
          {project && (
            <div className="meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h18v18H3zM21 9V3M21 15V9M9 21H3M15 21H9"/>
              </svg>
              <span>Project: {project.title}</span>
            </div>
          )}
        </div>
        <div className="hero-actions">
          <Link href={`/tasks/${taskId}/edit`} className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Edit Task
          </Link>
          <Link href="/tasks" className="btn btn-outline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Tasks
          </Link>
        </div>
      </div>
    </div>
  )
}

async function TaskDetails({ taskId }: { taskId: string }) {
  const task = await getTask(taskId)
  
  if (!task) {
    notFound()
  }

  const user = await getUser(task.userId)
  const project = await getProject(task.projectId)

  return (
    <div className="task-details">
      <div className="detail-grid">
        <div className="detail-item">
          <div className="detail-label">Status</div>
          <div className="detail-value">
            <span className={`status-badge ${task.completed ? 'completed' : 'pending'}`}>
              {task.completed ? 'Completed' : 'Pending'}
            </span>
          </div>
        </div>
        
        <div className="detail-item">
          <div className="detail-label">Assigned To</div>
          <div className="detail-value">
            <Link href={`/users/${task.userId}`} className="user-link">
              {user?.name}
            </Link>
          </div>
        </div>
        
        <div className="detail-item">
          <div className="detail-label">Project</div>
          <div className="detail-value">
            {project ? (
              <Link href={`/projects/${task.projectId}`} className="project-link">
                {project.title}
              </Link>
            ) : (
              <span className="no-project">No project assigned</span>
            )}
          </div>
        </div>
        
        <div className="detail-item">
          <div className="detail-label">Created</div>
          <div className="detail-value">
            {task.createdAt.toLocaleDateString()} at {task.createdAt.toLocaleTimeString()}
          </div>
        </div>
      </div>
      
      {/* Interactive Task Item */}
      <div className="task-interactive">
        <h3 className="task-interactive-title">Task Actions</h3>
        <TaskItem 
          id={task.id}
          initialCompleted={task.completed}
          title={task.title}
          projectId={task.projectId}
          projectTitle={project?.title || ""}
          userId={task.userId}
          userName={user?.name}
          displayProject={false}
          displayUser={false}
        />
      </div>
    </div>
  )
}


