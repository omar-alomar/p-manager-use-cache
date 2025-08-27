import { ProjectForm } from "@/components/ProjectForm"
import { getUsers } from "@/db/users"

export default async function NewProjectPage() {
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
