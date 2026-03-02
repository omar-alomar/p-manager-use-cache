"use client"

import { useTaskFilter } from "@/contexts/TaskFilterContext"

export type TaskStatCardType = "in-progress" | "completed" | "assigned-by-me" | "total"

interface TaskStatCardProps {
  type: TaskStatCardType
  count: number
  completionRate?: number
  isClickable?: boolean
  isActive?: boolean
  onClick?: () => void
}

export function TaskStatCard({
  type,
  count,
  completionRate = 0,
  isClickable = false,
  isActive = false,
  onClick
}: TaskStatCardProps) {
  const className = `stat-card ${isClickable ? "stat-card-clickable" : ""} ${isActive ? "active" : ""}`

  if (type === "in-progress") {
    return (
      <div className={className} onClick={onClick}>
        <div className="stat-icon in-progress">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <div className="stat-content">
          <div className="stat-number">{count}</div>
          <div className="stat-label">In Progress</div>
        </div>
      </div>
    )
  }

  if (type === "completed") {
    return (
      <div className={className} onClick={onClick}>
        <div className="stat-icon completed">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <div className="stat-content">
          <div className="stat-number">{count}</div>
          <div className="stat-label">Completed</div>
          <div className="stat-percentage">{completionRate}%</div>
        </div>
      </div>
    )
  }

  if (type === "assigned-by-me") {
    return (
      <div className={className}>
        <div className="stat-icon assigned">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div className="stat-content">
          <div className="stat-number">{count}</div>
          <div className="stat-label">Assigned by me</div>
        </div>
      </div>
    )
  }

  // total
  return (
    <div className={className} onClick={onClick}>
      <div className="stat-icon total">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"/>
          <path d="M9 11V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
          <path d="M9 7h6"/>
        </svg>
      </div>
      <div className="stat-content">
        <div className="stat-number">{count}</div>
        <div className="stat-label">Total Tasks</div>
      </div>
    </div>
  )
}

interface TaskStatsProps {
  stats: {
    total: number
    completed: number
    inProgress: number
    assignedByMe?: number
  }
  context?: "all-tasks" | "my-tasks"
}

export function TaskStats({ stats, context = "all-tasks" }: TaskStatsProps) {
  const { filter, setFilter } = useTaskFilter()
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
  const isClickable = context === "all-tasks"

  return (
    <div className="task-stats">
      <TaskStatCard
        type="in-progress"
        count={stats.inProgress}
        isClickable={isClickable}
        isActive={filter === "in_progress"}
        onClick={isClickable ? () => setFilter("in_progress") : undefined}
      />
      <TaskStatCard
        type="completed"
        count={stats.completed}
        completionRate={completionRate}
        isClickable={isClickable}
        isActive={filter === "completed"}
        onClick={isClickable ? () => setFilter("completed") : undefined}
      />
      {context === "my-tasks" && stats.assignedByMe !== undefined ? (
        <TaskStatCard type="assigned-by-me" count={stats.assignedByMe} />
      ) : (
        <TaskStatCard
          type="total"
          count={stats.total}
          isClickable={isClickable}
          isActive={filter === "all"}
          onClick={isClickable ? () => setFilter("all") : undefined}
        />
      )}
    </div>
  )
}
