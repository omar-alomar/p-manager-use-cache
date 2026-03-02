import { getUserTasks, getTasksAssignedByUser } from "@/db/tasks"
import { getUsers } from "@/db/users"
import { getProjectsWithUserTasks, getProjects } from "@/db/projects"
import { TaskFilterProvider } from "@/contexts/TaskFilterContext"
import { MyTasksClient } from "./MyTasksClient"

interface MyTasksContentProps {
  currentUser: { id: number; name: string }
}

export async function MyTasksContent({ currentUser }: MyTasksContentProps) {
  const [myTasks, assignedByMeTasks, users, userProjects, allProjects] = await Promise.all([
    getUserTasks(currentUser.id),
    getTasksAssignedByUser(currentUser.id),
    getUsers(),
    getProjectsWithUserTasks(currentUser.id),
    getProjects({})
  ])

  return (
    <TaskFilterProvider>
      <MyTasksClient 
        myTasks={myTasks}
        assignedByMeTasks={assignedByMeTasks}
        users={users} 
        projects={userProjects}
        allProjects={allProjects}
      />
    </TaskFilterProvider>
  )
}
