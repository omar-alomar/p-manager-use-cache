import { getUserTasks } from "@/db/tasks"
import { getUsers } from "@/db/users"
import { getProjects } from "@/db/projects"
import { TaskFilterProvider } from "@/contexts/TaskFilterContext"
import { MyTasksClient } from "./MyTasksClient"

export async function MyTasksContent() {
  // For now, we'll use a hardcoded user ID. In a real app, this would come from the session
  const currentUserId = 1 // This should come from auth context
  
  const [myTasks, users, projects] = await Promise.all([
    getUserTasks(currentUserId),
    getUsers(),
    getProjects()
  ])

  return (
    <TaskFilterProvider>
      <MyTasksClient 
        myTasks={myTasks} 
        users={users} 
        projects={projects} 
      />
    </TaskFilterProvider>
  )
}
