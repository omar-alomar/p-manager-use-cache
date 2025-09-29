import { getTask } from "@/db/tasks"
import { getUser } from "@/db/users"
import { getProject } from "@/db/projects"
import { getUsers } from "@/db/users"
import { getProjects } from "@/db/projects"
import { Skeleton } from "@/components/Skeleton"
import Link from "next/link"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { TaskItem } from "@/components/TaskItem"
import { TaskCommentForm } from "@/components/TaskCommentForm"
import { TaskComments } from "@/components/TaskComments"

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
              <div className="hero-actions">
                <Skeleton short inline />
              </div>
            </div>
          </div>
        }
      >
        <TaskHero taskId={taskId} />
      </Suspense>

      <div className="task-content" style={{ marginTop: '2rem' }}>
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

          {/* Comments Section */}
          <div className="content-section">
            <div className="section-header">
              <div className="section-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div className="section-title-group">
                <h2 className="section-title">Task Comments</h2>
                <p className="section-subtitle">Share feedback and discuss this task</p>
              </div>
            </div>
            
            <div className="section-content">
              <TaskCommentForm taskId={taskId} />
              
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
                <TaskComments taskId={taskId} />
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

  return (
    <div className="task-hero">
      <div className="hero-content">
        <div className="hero-title">
          <h1>{task.title}</h1>
        </div>
        <div className="hero-actions">
          <Link href="/my-tasks" className="btn btn-outline">
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

  const [user, project, users, projects] = await Promise.all([
    getUser(task.userId),
    task.projectId ? getProject(task.projectId) : null,
    getUsers(),
    getProjects()
  ])

  return (
    <div className="task-details">
      <TaskItem 
        id={task.id}
        initialCompleted={task.completed}
        title={task.title}
        urgency={task.urgency}
        projectId={task.projectId}
        projectTitle={project?.title || ""}
        userId={task.userId}
        userName={user?.name}
        createdAt={task.createdAt}
        displayProject={true}
        displayUser={true}
        displayCreatedAt={true}
        users={users}
        projects={projects}
      />
    </div>
  )
}


