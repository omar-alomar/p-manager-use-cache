import { getTasks } from "@/db/tasks"
import { getUsers } from "@/db/users"
import { getProjects } from "@/db/projects"
import { TaskFilterProvider } from "@/contexts/TaskFilterContext"
import { TasksPageClient } from "./TasksPageClient"

export async function TasksPageContent() {
  const [tasks, users, projects] = await Promise.all([
    getTasks(),
    getUsers(),
    getProjects()
  ])

  return (
    <TaskFilterProvider>
      <TasksPageClient 
        tasks={tasks} 
        users={users} 
        projects={projects} 
      />
    </TaskFilterProvider>
  )
}
