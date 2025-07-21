import { TaskForm } from "@/components/TaskForm"
import { getUsers } from "@/db/users"
import { getProjects } from "@/db/projects"

export default async function NewTaskPage() {
  const users = await getUsers()
  const projects = await getProjects()

  return (
    <>
      <h1 className="page-title">New Task</h1>
      <TaskForm users={users} projects={projects} />
    </>
  )
}