"use client"

import { useState } from "react"
import { TaskItem } from "@/components/TaskItem"

const ARCHIVE_DAYS = 30

interface TaskData {
  id: number
  completed: boolean
  completedAt: Date | string | null
  title: string
  urgency: string | null
  projectId: number | null
  userId: number
  userName?: string
  createdAt: Date
}

function isTaskArchived(task: TaskData): boolean {
  if (!task.completed) return false
  if (!task.completedAt) return true // completed but no date = legacy, treat as archived
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - ARCHIVE_DAYS)
  return new Date(task.completedAt) < cutoff
}

export function ProjectTaskList({
  tasks,
  projectTitle,
  users,
  projects,
}: {
  tasks: TaskData[]
  projectTitle: string
  users: { id: number; name: string }[]
  projects: { id: number; title: string }[]
}) {
  const [showArchived, setShowArchived] = useState(false)

  const activeTasks = tasks.filter((t) => !isTaskArchived(t))
  const archivedTasks = tasks.filter((t) => isTaskArchived(t))

  const displayTasks = showArchived ? archivedTasks : activeTasks

  return (
    <>
      {displayTasks.length > 0 ? (
        <div className="tasks-list">
          {displayTasks.map((task) => (
            <TaskItem
              key={task.id}
              id={task.id}
              initialCompleted={task.completed}
              title={task.title}
              urgency={task.urgency}
              projectId={task.projectId}
              projectTitle={projectTitle}
              userId={task.userId}
              userName={task.userName}
              createdAt={task.createdAt}
              displayProject={false}
              displayUser={true}
              displayCreatedAt={true}
              users={users}
              projects={projects}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state empty-state--inline" style={{ padding: "16px 0" }}>
          <p className="empty-description" style={{ margin: 0 }}>
            {showArchived ? "No archived tasks." : "No active tasks."}
          </p>
        </div>
      )}

      {archivedTasks.length > 0 && (
        <button
          className="project-archive-toggle"
          onClick={() => setShowArchived(!showArchived)}
        >
          {showArchived
            ? "Show active tasks"
            : `Show archived (${archivedTasks.length})`}
        </button>
      )}
    </>
  )
}
