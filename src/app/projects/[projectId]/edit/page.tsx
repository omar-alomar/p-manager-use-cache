import { ProjectForm } from "@/components/ProjectForm"
import { getProject } from "@/db/projects"
import { getUsers } from "@/db/users"
import { notFound } from "next/navigation"

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const [users, project] = await Promise.all([getUsers(), getProject(projectId)])

  if (project == null) return notFound()

  return (
    <>
      <h1 className="page-title">Edit Project</h1>
      <ProjectForm users={users} project={project} />
    </>
  )
}
