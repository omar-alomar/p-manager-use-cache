import { getUserTasks } from "@/db/tasks"
import { getUsers } from "@/db/users"
import { getProjectsWithUserTasks, getProjects } from "@/db/projects"
import { TaskFilterProvider } from "@/contexts/TaskFilterContext"
import { MyTasksClient } from "./MyTasksClient"

interface MyTasksContentProps {
  currentUser: { id: number; name: string }
}

export async function MyTasksContent({ currentUser }: MyTasksContentProps) {
  const [myTasks, users, userProjects, allProjects] = await Promise.all([
    getUserTasks(currentUser.id),
    getUsers(),
    getProjectsWithUserTasks(currentUser.id),
    getProjects({})
  ])

  return (
    <TaskFilterProvider>
      <MyTasksClient 
        myTasks={myTasks} 
        users={users} 
        projects={userProjects}
        allProjects={allProjects}
      />
    </TaskFilterProvider>
  )
}
