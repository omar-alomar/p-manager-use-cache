"use client"

import { useState, useMemo, useCallback } from "react"
import { TaskItem } from "./TaskItem"
import { SearchableSelect } from "./SearchableSelect"
import { QuickAddTaskModal, type CreatedTask } from "./QuickAddTaskModal"
import { URGENCY_FILTER_OPTIONS } from "@/constants/urgency"

// ── Serialized task shape from server ──
interface SerializedTask {
  id: number
  title: string
  completed: boolean
  urgency: string
  userId: number
  userName: string
  projectId: number | null
  projectTitle: string
  createdAt: string
  updatedAt: string
}

interface UpcomingMilestone {
  id: number
  item: string
  date: string
  projectId: number
  projectTitle: string
  daysUntil: number
  colorClass: string
}

interface RecentActivity {
  id: number
  title: string
  completed: boolean
  projectTitle: string | null
  assigneeName: string | null
  assignedByName: string | null
  updatedAt: string
}

export interface DashboardData {
  activeTasks: number
  criticalHighTasks: number
  completionRate: number
  tasks: SerializedTask[]
  users: { id: number; name: string }[]
  projects: { id: number; title: string }[]
  upcomingMilestones: UpcomingMilestone[]
  recentActivity: RecentActivity[]
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

function workloadColor(count: number): string {
  if (count <= 3) return "var(--success-500)"
  if (count <= 6) return "var(--warning-500)"
  return "var(--danger-500)"
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [memberFilter, setMemberFilter] = useState<string | number | undefined>("all")
  const [urgencyFilter, setUrgencyFilter] = useState<string | number | undefined>("all")
  const [showCompleted, setShowCompleted] = useState(false)
  const [localTasks, setLocalTasks] = useState(data.tasks)
  const [addTaskFor, setAddTaskFor] = useState<{ id: number; name: string } | null>(null)

  // Handle new task created from QuickAddTaskModal
  const handleTaskCreated = useCallback((task: CreatedTask) => {
    setLocalTasks((prev) => [task, ...prev])
  }, [])

  // Handle task updates from TaskItem
  const handleTaskUpdate = useCallback((taskId: number, updates: { completed?: boolean; title?: string; deleted?: boolean }) => {
    setLocalTasks((prev) =>
      updates.deleted
        ? prev.filter((t) => t.id !== taskId)
        : prev.map((t) =>
            t.id === taskId
              ? { ...t, ...(updates.completed !== undefined ? { completed: updates.completed } : {}), ...(updates.title ? { title: updates.title } : {}) }
              : t
          )
    )
  }, [])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return localTasks.filter((t) => {
      if (!showCompleted && t.completed) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!t.title.toLowerCase().includes(q) && !t.projectTitle.toLowerCase().includes(q) && !t.userName.toLowerCase().includes(q)) return false
      }
      if (memberFilter && memberFilter !== "all") {
        if (t.userId !== Number(memberFilter)) return false
      }
      if (urgencyFilter && urgencyFilter !== "all") {
        if (t.urgency.toLowerCase() !== String(urgencyFilter).toLowerCase()) return false
      }
      return true
    })
  }, [localTasks, searchQuery, memberFilter, urgencyFilter, showCompleted])

  // Group by user — sorted by busiest first
  const { columns, idleUsers } = useMemo(() => {
    const grouped = new Map<number, { user: { id: number; name: string }; tasks: SerializedTask[] }>()

    for (const t of filteredTasks) {
      if (!grouped.has(t.userId)) {
        grouped.set(t.userId, {
          user: { id: t.userId, name: t.userName },
          tasks: [],
        })
      }
      grouped.get(t.userId)!.tasks.push(t)
    }

    const cols = Array.from(grouped.values()).sort((a, b) => b.tasks.length - a.tasks.length)

    // Find users with 0 tasks in the filtered set
    const activeUserIds = new Set(cols.map((c) => c.user.id))
    const idle = data.users.filter((u) => !activeUserIds.has(u.id))

    return { columns: cols, idleUsers: idle }
  }, [filteredTasks, data.users])

  // Member filter options
  const memberOptions = useMemo(
    () => [{ value: "all" as string | number, label: "All Members" }, ...data.users.map((u) => ({ value: u.id as string | number, label: u.name }))],
    [data.users]
  )

  return (
    <div className="dashboard-page">
      {/* ── KPI Stats Bar ── */}
      <div className="dashboard-kpi-bar">
        <div className="dashboard-kpi-card">
          <span className="dashboard-kpi-label">Active Tasks</span>
          <span className="dashboard-kpi-value kpi-primary">{data.activeTasks}</span>
          <span className="dashboard-kpi-sub">across all projects</span>
        </div>
        <div className="dashboard-kpi-card">
          <span className="dashboard-kpi-label">Urgent</span>
          <span className={`dashboard-kpi-value ${data.criticalHighTasks > 0 ? "kpi-danger" : ""}`}>
            {data.criticalHighTasks}
          </span>
          <span className="dashboard-kpi-sub">critical + high</span>
        </div>
        <div className="dashboard-kpi-card">
          <span className="dashboard-kpi-label">Completion Rate</span>
          <span className={`dashboard-kpi-value ${data.completionRate >= 70 ? "kpi-success" : ""}`}>
            {data.completionRate}%
          </span>
          <span className="dashboard-kpi-sub">of all tasks</span>
        </div>
      </div>

      {/* ── Upcoming Milestones + Recent Activity ── */}
      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">Upcoming Milestones</h3>
          {data.upcomingMilestones.length === 0 ? (
            <div className="dashboard-empty">No upcoming milestones</div>
          ) : (
            <div className="milestone-list">
              {data.upcomingMilestones.map((ms) => (
                <a key={ms.id} href={`/projects/${ms.projectId}`} className={`milestone-item ${ms.colorClass}`}>
                  <div className="milestone-item-content">
                    <div className="milestone-item-label">{ms.item}</div>
                    <div className="milestone-item-project">{ms.projectTitle}</div>
                  </div>
                  <span className={`milestone-days-badge ${ms.colorClass}`}>
                    {ms.daysUntil <= 0 ? "Overdue" : `${ms.daysUntil}d`}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <h3 className="dashboard-section-title">Recent Activity</h3>
          {data.recentActivity.length === 0 ? (
            <div className="dashboard-empty">No recent activity</div>
          ) : (
            <div className="activity-list">
              {data.recentActivity.map((item) => (
                <div key={item.id} className="activity-item">
                  <div className={`activity-icon ${item.completed ? "icon-completed" : "icon-pending"}`}>
                    {item.completed ? "✓" : "○"}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">{item.title}</div>
                    <div className="activity-meta">
                      {item.projectTitle && <>{item.projectTitle}</>}
                      {item.assigneeName && <> · {item.assigneeName}</>}
                      {item.assignedByName && <> · assigned by {item.assignedByName}</>}
                    </div>
                  </div>
                  <span className="activity-time">{formatRelativeTime(item.updatedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="dashboard-filter-bar">
        <div className="dashboard-filter-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="dashboard-filter-input"
          />
        </div>
        <div className="dashboard-filter-select">
          <SearchableSelect
            options={memberOptions}
            value={memberFilter}
            onChange={setMemberFilter}
            placeholder="All Members"
          />
        </div>
        <div className="dashboard-filter-select">
          <SearchableSelect
            options={URGENCY_FILTER_OPTIONS as unknown as { value: string | number; label: string }[]}
            value={urgencyFilter}
            onChange={setUrgencyFilter}
            placeholder="All Urgency"
          />
        </div>
        <button
          type="button"
          className={`dashboard-completed-toggle ${showCompleted ? "active" : ""}`}
          onClick={() => setShowCompleted(!showCompleted)}
        >
          {showCompleted ? "Showing completed" : "Completed hidden"}
        </button>
        {(searchQuery || (memberFilter && memberFilter !== "all") || (urgencyFilter && urgencyFilter !== "all") || showCompleted) && (
          <button
            type="button"
            className="filter-reset-btn dashboard-filter-reset"
            title="Reset filters"
            onClick={() => {
              setSearchQuery("")
              setMemberFilter("all")
              setUrgencyFilter("all")
              setShowCompleted(false)
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 1 9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 22v-6h6"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Team Board ── */}
      <div className="dashboard-section dashboard-team-board-section">
        <h3 className="dashboard-section-title">Team Board</h3>
        {columns.length === 0 ? (
          <div className="dashboard-empty">No tasks match the current filters</div>
        ) : (
          <div className="dashboard-team-board">
            {columns.map((col) => {
              const activeCount = col.tasks.filter((t) => !t.completed).length
              return (
                <div key={col.user.id} className="team-board-column">
                  <div className="team-board-column-header">
                    <a href={`/users/${col.user.id}`} className="team-board-member-link">
                      <div className="team-board-avatar" style={{ backgroundColor: workloadColor(activeCount) }}>
                        {getInitials(col.user.name)}
                      </div>
                      <div className="team-board-member-info">
                        <span className="team-board-member-name">{col.user.name}</span>
                        <span className="team-board-task-count">{activeCount} active</span>
                      </div>
                    </a>
                    <div className="team-board-workload-bar">
                      <div
                        className="team-board-workload-fill"
                        style={{
                          width: `${Math.min(activeCount * 10, 100)}%`,
                          backgroundColor: workloadColor(activeCount),
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary team-board-add-btn"
                      title={`Add task for ${col.user.name}`}
                      onClick={() => setAddTaskFor(col.user)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </div>
                  <div className="team-board-tasks">
                    {col.tasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        id={task.id}
                        initialCompleted={task.completed}
                        title={task.title}
                        urgency={task.urgency}
                        projectId={task.projectId}
                        projectTitle={task.projectTitle}
                        userId={task.userId}
                        userName={task.userName}
                        createdAt={new Date(task.createdAt)}
                        displayProject={true}
                        displayUser={false}
                        displayCreatedAt={false}
                        users={data.users}
                        projects={data.projects}
                        onUpdate={handleTaskUpdate}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {idleUsers.length > 0 && (
          <div className="dashboard-idle-notice">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
            <span>
              Available: {idleUsers.map((u) => u.name).join(", ")}
            </span>
          </div>
        )}
      </div>

      <QuickAddTaskModal
        isOpen={addTaskFor !== null}
        onClose={() => setAddTaskFor(null)}
        onTaskCreated={handleTaskCreated}
        presetUserId={addTaskFor?.id}
        presetUserName={addTaskFor?.name}
        users={data.users}
        projects={data.projects}
      />
    </div>
  )
}
