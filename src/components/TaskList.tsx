// Task list panel with color-coded header and collapsible content.
// `variant` tints the header (warning=in-progress, success=completed, primary=assigned).
// Collapse/expand is driven purely by CSS container queries on the parent
// `.task-list-panel` — no React state needed for visual collapse.
import { TaskItem } from "./TaskItem"
import type { TaskWithRelations } from "@/types"

interface TaskListProps {
  title: string
  tasks: TaskWithRelations[]
  users: { id: number; name: string }[]
  projects: { id: number; title: string }[]
  showProject?: boolean
  showUser?: boolean
  variant?: "in-progress" | "completed" | "assigned"
  onToggleCollapse?: () => void
}

export function TaskList({
  title,
  tasks,
  users,
  projects,
  showProject = true,
  showUser = false,
  variant,
  onToggleCollapse,
}: TaskListProps) {
  const headerClassName = `task-list-header${variant ? ` task-list-header--${variant}` : ""}${onToggleCollapse ? " task-list-header--clickable" : ""}`

  return (
    <div className="task-list">
      <div className={headerClassName} onClick={onToggleCollapse}>
        <div className="task-list-header-left">
          {onToggleCollapse && (
            <svg className="collapse-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          )}
          <h3 className="task-list-title">{title}</h3>
        </div>
        <span className="task-count">
          <span className="task-count-full">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </span>
          <span className="task-count-short">{tasks.length}</span>
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="task-list-collapsible">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"/>
                <path d="M9 11V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                <path d="M9 7h6"/>
              </svg>
            </div>
            <h4 className="empty-state-title">No tasks found</h4>
            <p className="empty-state-description">
              {title === 'All Tasks'
                ? 'Create your first task to get started'
                : 'No tasks match the current filter'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="task-list-collapsible">
          <div className="task-list-content">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                id={task.id}
                initialCompleted={task.completed}
                title={task.title}
                urgency={task.urgency}
                projectId={task.projectId}
                projectTitle={task.Project?.title || "No Project"}
                userId={task.userId}
                userName={task.User.name}
                createdAt={task.createdAt}
                displayProject={showProject}
                displayUser={showUser}
                displayCreatedAt={true}
                users={users}
                projects={projects}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
