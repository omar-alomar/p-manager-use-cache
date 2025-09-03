import { getUserTasks } from "@/db/tasks"
import { getUsers } from "@/db/users"
import { getProjects } from "@/db/projects"
import { TaskStats } from "./TaskStats"
import { TaskFilters } from "./TaskFilters"
import { TaskList } from "./TaskList"
import { NewTaskButton } from "./NewTaskButton"

export async function MyTasksContent() {
  // For now, we'll use a hardcoded user ID. In a real app, this would come from the session
  const currentUserId = 1 // This should come from auth context
  
  const [myTasks, users, projects] = await Promise.all([
    getUserTasks(currentUserId),
    getUsers(),
    getProjects()
  ])

  // Calculate stats for current user
  const stats = {
    total: myTasks.length,
    completed: myTasks.filter(t => t.status === 'COMPLETED').length,
    inProgress: myTasks.filter(t => t.status === 'IN_PROGRESS').length
  }

  // Group tasks by status
  const inProgressTasks = myTasks.filter(t => t.status === 'IN_PROGRESS')
  const completedTasks = myTasks.filter(t => t.status === 'COMPLETED')

  return (
    <div className="my-tasks-content">
      {/* Stats Section */}
      <TaskStats stats={stats} />

      {/* Filters and Actions */}
      <div className="tasks-controls">
        <TaskFilters />
        <NewTaskButton users={users} projects={projects} />
      </div>

      {/* Task Lists by Status */}
      <div className="task-lists-container">
        <div className="task-lists-grid">
          <TaskList 
            title="In Progress" 
            tasks={inProgressTasks} 
            users={users} 
            projects={projects}
            showProject={true}
            showUser={false}
          />
          
          <TaskList 
            title="Completed" 
            tasks={completedTasks} 
            users={users} 
            projects={projects}
            showProject={true}
            showUser={false}
          />
        </div>
      </div>
    </div>
  )
}
