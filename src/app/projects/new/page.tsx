import { redirect } from "next/navigation"
import { getCurrentUser } from "@/auth/currentUser"
import { ProjectForm } from "@/components/ProjectForm"
import { getUsers } from "@/db/users"

export default async function NewProjectPage() {
  // Check if user is authenticated
  const user = await getCurrentUser()
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login")
  }
  const users = await getUsers()

  return (
    <>
      <div className="page-title">
        <div className="title-content">
          <h1>New Project</h1>
          <p className="page-subtitle">Create a new project and assign it to a project manager</p>
        </div>
      </div>
      <ProjectForm users={users} />
    </>
  )
}
