import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/auth/currentUser"
import { getProjects } from "@/db/projects"
import { getUsers } from "@/db/users"
import { ProjectsPageClient } from "@/components/ProjectsPageClient"
import { NewTaskButton } from "@/components/NewTaskButton"
import { Skeleton } from "@/components/Skeleton"

export default async function ProjectsPage() {
  // Check if user is authenticated
  const user = await getCurrentUser({ withFullUser: true })
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login")
  }

  // Fetch data for the client component
  const [projectsData, users] = await Promise.all([
    getProjects(),
    getUsers()
  ])

  // Transform projects data to match ProjectsPageClient expectations
  const projects = projectsData.map(project => ({
    ...project,
    client: project.clientRef?.name || 'No Client',
    clientId: project.clientRef?.id || null
  }))

  return (
    <>
      <div className="page-title">
        <div className="title-content">
          <h1>Projects</h1>
          <p className="page-subtitle">Manage and track project progress</p>
        </div>
        <div className="title-btns">
          <Link className="btn btn-primary" href="/projects/new">
            New Project
          </Link>
          <NewTaskButton users={users} projects={projects} />
        </div>
      </div>

      <Suspense fallback={<ProjectsTableSkeleton />}>
        <ProjectsPageClient projects={projects} users={users} currentUser={user} />
      </Suspense>
    </>
  )
}


function ProjectsTableSkeleton() {
  return (
    <div className="projects-table-container">
      <table className="projects-table">
        <thead>
          <tr>
            <th>PROJECT NAME</th>
            <th>MBA #</th>
            <th>Co File #&apos;s</th>
            <th>P<br />MGR</th>
            <th>APFO<br />DATE</th>
            <th>OVERVIEW</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i}>
              <td><Skeleton /></td>
              <td><Skeleton short /></td>
              <td><Skeleton short /></td>
              <td><Skeleton short /></td>
              <td><Skeleton short /></td>
              <td><Skeleton /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
