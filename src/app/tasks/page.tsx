import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/auth/currentUser"
import { TasksPageContent } from "@/components/TasksPageContent"
import { NewTaskButton } from "@/components/NewTaskButton"
import { getUsers } from "@/db/users"
import { getProjects } from "@/db/projects"
import TasksLoading from "./loading"

export default async function TasksPage() {
  // Check if user is authenticated
  const user = await getCurrentUser()
  
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
    <div className="tasks-page">
      <div className="page-title">
        <div className="title-content">
          <h1>Task Management</h1>
          <p className="page-subtitle">
            Manage and track all tasks across your projects
          </p>
        </div>
        <div className="title-btns">
          <NewTaskButton users={users} projects={projects} />
        </div>
      </div>

      <Suspense fallback={<TasksLoading />}>
        <TasksPageContent />
      </Suspense>
    </div>
  )
}
