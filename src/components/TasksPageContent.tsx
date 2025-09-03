import { getTasks } from "@/db/tasks"
import { getUsers } from "@/db/users"
import { getProjects } from "@/db/projects"
import { TaskStats } from "./TaskStats"
import { TaskFilters } from "./TaskFilters"
import { TaskList } from "./TaskList"
import { NewTaskButton } from "./NewTaskButton"

export async function TasksPageContent() {
  const [tasks, users, projects] = await Promise.all([
    getTasks(),
    getUsers(),
    getProjects()
  ])

  // Calculate stats
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length
  }

  return (
    <div className="tasks-content">
      {/* Stats Section */}
      <TaskStats stats={stats} />

      {/* Filters and Actions */}
      <div className="tasks-controls">
        <TaskFilters />
        <NewTaskButton users={users} projects={projects} />
      </div>

      {/* Task Lists */}
      <div className="task-lists-container">
        <TaskList 
          title="All Tasks" 
          tasks={tasks} 
          users={users} 
          projects={projects}
          showProject={true}
          showUser={true}
        />
      </div>
    </div>
  )
}
