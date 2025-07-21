import { getProjects } from "@/db/projects"
import { getUser } from "@/db/users"
import { Skeleton } from "@/components/Skeleton"
import Link from "next/link"
import { Suspense } from "react"

export default async function ProjectsTablePage() {
  return (
    <>
      <div className="page-title">
        <h1>PROJECT STATUS</h1>
        <div className="title-btns">
          <Link className="btn" href="/projects/new">
            New Project
          </Link>
        </div>
      </div>

      <Suspense fallback={<ProjectsTableSkeleton />}>
        <ProjectsTable />
      </Suspense>
    </>
  )
}

async function ProjectsTable() {
  const projects = await getProjects()

  if (projects.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <p>No projects found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="projects-table-container">
      <table className="projects-table">
        <thead>
          <tr>
            <th>PROJECT NAME</th>
            <th>MBA #</th>
            <th>Co File #'s<br />DED & DLD<br />reviewer</th>
            <th>P<br />MGR</th>
            <th>APFO<br />DATE</th>
            <th>COMMENTS</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

async function ProjectRow({ project }: { project: any }) {
  return (
    <tr>
      <td className="project-name-cell">
        <Link href={`/projects/${project.id}`} className="project-name-link">
          {project.title}
        </Link>
        <div className="project-client">{project.client}</div>
      </td>
      <td className="mba-number">{project.mbaNumber || project.id}</td>
      <td className="co-files">{project.coFileNumbers || ""}</td>
      <td className="pmgr">
        <Suspense fallback={<Skeleton short inline />}>
          <ProjectManager userId={project.userId} />
        </Suspense>
      </td>
      <td className="apfo-date">
        {project.apfo && (
          <span className="apfo-highlight">{project.apfo}</span>
        )}
      </td>
      <td className="comments">
        <div className="comments-text">{project.body}</div>
      </td>
    </tr>
  )
}

async function ProjectManager({ userId }: { userId: number }) {
  const user = await getUser(userId)
  
  if (!user) return ""
  
  const initials = user.name.split(' ').map(n => n[0]).join('')
  
  return (
    <Link href={`/users/${user.id}`} className="pmgr-link">
      {initials}
    </Link>
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
            <th>Co File #'s<br />DED & DLD<br />reviewer</th>
            <th>P<br />MGR</th>
            <th>APFO<br />DATE</th>
            <th>COMMENTS</th>
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