import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/auth/currentUser"
import { MyTasksContent } from "@/components/MyTasksContent"
import { NewTaskButton } from "@/components/NewTaskButton"
import { getUsers } from "@/db/users"
import { getProjects } from "@/db/projects"
import TasksLoading from "../tasks/loading"

export default async function MyTasksPage() {
  // Check if user is authenticated
  const user = await getCurrentUser({ withFullUser: true })
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login")
  }

  // Fetch data for the NewTaskButton
  const [users, projects] = await Promise.all([
    getUsers(),
    getProjects()
  ])

  return (
    <div className="my-tasks-page">
      <div className="page-title">
        <div className="title-content">
          <h1>My Tasks</h1>
          <p className="page-subtitle">
            Tasks assigned to you across all projects
          </p>
        </div>
        <div className="title-btns">
          <NewTaskButton users={users} projects={projects} />
        </div>
      </div>

      <Suspense fallback={<TasksLoading />}>
        <MyTasksContent currentUser={user} />
      </Suspense>
    </div>
  )
}
