import { getUserTasks } from "@/db/tasks"
import { getUsers } from "@/db/users"
import { getProjects } from "@/db/projects"
import { TaskFilterProvider } from "@/contexts/TaskFilterContext"
import { MyTasksClient } from "./MyTasksClient"

interface MyTasksContentProps {
  currentUser: { id: number; name: string }
}

export async function MyTasksContent({ currentUser }: MyTasksContentProps) {
  const [myTasks, users, allProjects] = await Promise.all([
    getUserTasks(currentUser.id),
    getUsers(),
    getProjects()
  ])

  // Filter projects to only include those assigned to the current user
  const userProjects = allProjects.filter(project => project.userId === currentUser.id)

  return (
    <TaskFilterProvider>
      <MyTasksClient 
        myTasks={myTasks} 
        users={users} 
        projects={userProjects} 
      />
    </TaskFilterProvider>
  )
}
