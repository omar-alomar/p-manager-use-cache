"use client"

import { useState } from "react"
import Link from "next/link"

type TaskData = {
  id: number
  title: string
  completed: boolean
  urgency: string | null
  projectId: number | null
  createdAt: Date
}

type TaskGroup = {
  project: { id: number; title: string } | null
  tasks: TaskData[]
}

function getUrgencyInfo(urgency: string | null) {
  switch (urgency) {
    case "CRITICAL":
      return { label: "Critical", className: "user-task-urgency--critical" }
    case "HIGH":
      return { label: "High", className: "user-task-urgency--high" }
    case "MEDIUM":
      return { label: "Medium", className: "user-task-urgency--medium" }
    case "LOW":
      return { label: "Low", className: "user-task-urgency--low" }
    default:
      return { label: "Medium", className: "user-task-urgency--medium" }
  }
}

export function UserTasksSection({ groups }: { groups: TaskGroup[] }) {
  const [filter, setFilter] = useState<"active" | "completed">("active")

  const filteredGroups = groups
    .map((g) => ({
      ...g,
      tasks: g.tasks.filter((t) =>
        filter === "active" ? !t.completed : t.completed
      ),
    }))
    .filter((g) => g.tasks.length > 0)

  const totalActive = groups.reduce(
    (n, g) => n + g.tasks.filter((t) => !t.completed).length,
    0
  )
  const totalCompleted = groups.reduce(
    (n, g) => n + g.tasks.filter((t) => t.completed).length,
    0
  )

  return (
    <div className="user-tasks-section">
      {/* Filter tabs */}
      <div className="user-tasks-tabs">
        <button
          className={`user-tasks-tab ${filter === "active" ? "active" : ""}`}
          onClick={() => setFilter("active")}
        >
          Active
          <span className="user-tasks-tab-count">{totalActive}</span>
        </button>
        <button
          className={`user-tasks-tab ${filter === "completed" ? "active" : ""}`}
          onClick={() => setFilter("completed")}
        >
          Completed
          <span className="user-tasks-tab-count">{totalCompleted}</span>
        </button>
      </div>

      {/* Task groups */}
      {filteredGroups.length === 0 ? (
        <div className="user-tasks-empty">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <p>
            No {filter} tasks
          </p>
        </div>
      ) : (
        <div className="user-tasks-groups">
          {filteredGroups.map((group, i) => (
            <div key={group.project?.id ?? "none"} className="user-tasks-group">
              <div className="user-tasks-group-header">
                {group.project ? (
                  <Link
                    href={`/projects/${group.project.id}`}
                    className="user-tasks-project-link"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    {group.project.title}
                  </Link>
                ) : (
                  <span className="user-tasks-no-project">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    No Project
                  </span>
                )}
                <span className="user-tasks-group-count">
                  {group.tasks.length}
                </span>
              </div>
              <div className="user-tasks-list">
                {group.tasks.map((task) => {
                  const urgency = getUrgencyInfo(task.urgency)
                  return (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className={`user-task-row ${task.completed ? "user-task-row--completed" : ""}`}
                    >
                      <span
                        className={`user-task-urgency-dot ${urgency.className}`}
                        title={urgency.label}
                      />
                      <span className="user-task-title">{task.title}</span>
                      {!task.completed && (
                        <span className={`user-task-urgency-badge ${urgency.className}`}>
                          {urgency.label}
                        </span>
                      )}
                      {task.completed && (
                        <svg
                          className="user-task-check"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
