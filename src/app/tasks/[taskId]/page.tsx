import { getTask } from "@/db/tasks"
import { Skeleton } from "@/components/Skeleton"
import Link from "next/link"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { TaskDetailActions } from "@/components/TaskDetailClient"
import { TaskCommentForm } from "@/components/TaskCommentForm"
import { TaskComments } from "@/components/TaskComments"
import { getUrgencyDisplay } from "@/constants/urgency"
import { formatDate } from "@/utils/dateUtils"

export default async function TaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = await params

  return (
    <div className="project-profile-container">
      {/* Hero */}
      <Suspense
        fallback={
          <div className="task-detail-hero">
            <div className="hero-top-row">
              <div className="hero-identity">
                <div className="icon-circle"><Skeleton inline short /></div>
                <div className="hero-title-group">
                  <div className="skeleton-heading" style={{ width: '50%' }}></div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <div className="skeleton" style={{ width: 80, height: 20, borderRadius: 999 }}></div>
                    <div className="skeleton" style={{ width: 70, height: 20, borderRadius: 999 }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <TaskHero taskId={taskId} />
      </Suspense>

      {/* Body */}
      <div className="project-detail-body">
        {/* Comments */}
        <div className="comment-thread">
          <h3 className="comment-thread-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Comments
          </h3>
          <TaskCommentForm taskId={taskId} />
          <Suspense
            fallback={
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {[1, 2].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 12 }}>
                    <div className="skeleton" style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0 }}></div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                      <div className="skeleton" style={{ width: '30%', height: 13 }}></div>
                      <div className="skeleton" style={{ width: '60%', height: 13 }}></div>
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            <TaskComments taskId={taskId} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

async function TaskHero({ taskId }: { taskId: string }) {
  const task = await getTask(taskId)
  if (!task) notFound()

  const urgencyDisplay = getUrgencyDisplay(task.urgency)

  return (
    <div className="task-detail-hero">
      {/* Row 1: Identity + Actions */}
      <div className="hero-top-row">
        <div className="hero-identity">
          <div className={`icon-circle td-icon--${urgencyDisplay.className}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div className="hero-title-group">
            <div className="hero-title-row">
              <h1 className="hero-name">{task.title}</h1>
            </div>
            <div className="hero-tags">
              <span className={`hero-tag ${task.completed ? "task-status-done" : "task-status-active"}`}>
                {task.completed ? "Completed" : "In Progress"}
              </span>
              <span className={`hero-tag task-urgency-tag ${urgencyDisplay.className}`}>
                {urgencyDisplay.label}
              </span>
              {task.User && (
                <Link href={`/users/${task.userId}`} className="hero-tag clickable">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {task.User.name}
                </Link>
              )}
              {task.Project && (
                <Link href={`/projects/${task.projectId}`} className="hero-tag client clickable">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9,22 9,12 15,12 15,22" />
                  </svg>
                  {task.Project.title}
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="hero-actions">
          <TaskDetailActions
            task={{
              id: task.id,
              title: task.title,
              completed: task.completed,
              urgency: task.urgency,
              userId: task.userId,
              projectId: task.projectId,
            }}
          />
          <Link href="/tasks" className="btn btn-outline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Tasks
          </Link>
        </div>
      </div>

      {/* Row 2: Details */}
      <div className="hero-details-row">
        <div className="hero-detail">
          <span className="hero-detail-label">Assignee</span>
          {task.User ? (
            <Link href={`/users/${task.userId}`} className="hero-detail-link">{task.User.name}</Link>
          ) : (
            <span className="hero-detail-value">Unassigned</span>
          )}
        </div>
        {(task as any).AssignedBy && (
          <div className="hero-detail">
            <span className="hero-detail-label">Assigned By</span>
            <Link href={`/users/${(task as any).AssignedBy.id}`} className="hero-detail-link">
              {(task as any).AssignedBy.name}
            </Link>
          </div>
        )}
        {task.Project && (
          <div className="hero-detail">
            <span className="hero-detail-label">Project</span>
            <Link href={`/projects/${task.projectId}`} className="hero-detail-link">{task.Project.title}</Link>
          </div>
        )}
        <div className="hero-detail">
          <span className="hero-detail-label">Urgency</span>
          <span className="hero-detail-value">{urgencyDisplay.label}</span>
        </div>
        <div className="hero-detail">
          <span className="hero-detail-label">Created</span>
          <span className="hero-detail-value">{formatDate(task.createdAt)}</span>
        </div>
        {task.completed && (task as any).completedAt && (
          <div className="hero-detail">
            <span className="hero-detail-label">Completed</span>
            <span className="hero-detail-value">{formatDate((task as any).completedAt)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
