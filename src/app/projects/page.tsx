import { Suspense } from "react"
import Link from "next/link"
import { getProjects } from "@/db/projects"
import { getUser } from "@/db/users"
import { EditableComments } from "@/components/EditableComments"
import { EditableCoFiles } from "@/components/EditableCoFiles"
import { EditableMbaNumber } from "@/components/EditableMbaNumber"
import { Skeleton } from "@/components/Skeleton"

export default async function ProjectsPage() {
  return (
    <>
      <div className="page-title">
        <div className="title-content">
          <h1>Projects</h1>
          <p className="page-subtitle">Manage and track project progress</p>
        </div>
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
            <th>Co File #'s</th>
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
          <div className="project-name-link-content">
            <div className="project-name">{project.title}</div>
            <div className="project-client">{project.client}</div>
          </div>
        </Link>
      </td>
      <td className="mba-number">
        <EditableMbaNumber
          projectId={project.id}
          initialMbaNumber={project.mbaNumber || ""}
          title={project.title}
          client={project.client}
          body={project.body}
          apfo={project.apfo}
          coFileNumbers={project.coFileNumbers || ""}
          dldReviewer={project.dldReviewer || ""}
          userId={project.userId}
        />
      </td>
      <td className="co-files">
        <EditableCoFiles
          projectId={project.id}
          initialCoFiles={project.coFileNumbers || ""}
          title={project.title}
          client={project.client}
          body={project.body}
          apfo={project.apfo}
          dldReviewer={project.dldReviewer || ""}
          userId={project.userId}
        />
      </td>
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
        <EditableComments
          projectId={project.id}
          initialComments={project.body}
          title={project.title}
          client={project.client}
          apfo={project.apfo}
          coFileNumbers={project.coFileNumbers || ""}
          dldReviewer={project.dldReviewer || ""}
          userId={project.userId}
        />
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
            <th>Co File #'s</th>
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
