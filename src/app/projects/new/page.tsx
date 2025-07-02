import { ProjectForm } from "@/components/ProjectForm"
import { getUsers } from "@/db/users"

export default async function NewProjectPage() {
  const users = await getUsers()

  return (
    <>
      <h1 className="page-title">New Project</h1>
      <ProjectForm users={users} />
    </>
  )
}
