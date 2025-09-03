import { TaskItem } from "./TaskItem"

interface Task {
  id: number
  title: string
  description?: string | null
  status: 'IN_PROGRESS' | 'COMPLETED'
  completed: boolean
  userId: number
  projectId: number
  createdAt: Date
  updatedAt: Date
  User: { id: number; name: string }
  Project: { id: number; title: string }
}

interface TaskListProps {
  title: string
  tasks: Task[]
  users: { id: number; name: string }[]
  projects: { id: number; title: string }[]
  showProject?: boolean
  showUser?: boolean
}

export function TaskList({ 
  title, 
  tasks, 
  users, 
  projects, 
  showProject = true, 
  showUser = false 
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="task-list">
        <div className="task-list-header">
          <h3 className="task-list-title">{title}</h3>
          <span className="task-count">0 tasks</span>
        </div>
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
    )
  }

  return (
    <div className="task-list">
      <div className="task-list-header">
        <h3 className="task-list-title">{title}</h3>
        <span className="task-count">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
      </div>
      
      <div className="task-list-content">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            id={task.id}
            initialCompleted={task.completed}
            title={task.title}
            projectId={task.projectId}
            projectTitle={task.Project.title}
            userId={task.userId}
            userName={task.User.name}
            displayProject={showProject}
            displayUser={showUser}
            status={task.status}
            description={task.description}
          />
        ))}
      </div>
    </div>
  )
}
