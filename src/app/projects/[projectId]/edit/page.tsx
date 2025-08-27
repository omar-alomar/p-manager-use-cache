import { ProjectForm } from "@/components/ProjectForm"
import { getProject } from "@/db/projects"
import { getUsers } from "@/db/users"
import { notFound } from "next/navigation"
import Link from "next/link"

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const [users, project] = await Promise.all([getUsers(), getProject(projectId)])

  if (project == null) return notFound()

  return (
    <div className="project-page">
      {/* Edit Project Hero Section */}
      <div className="project-hero edit-hero">
        <div className="hero-background">
          <div className="hero-pattern"></div>
        </div>
        <div className="hero-content">
          <div className="hero-main">
            <div className="hero-title-section">
              <h1 className="hero-title">Edit Project</h1>
              <div className="hero-meta">
                <div className="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span>Editing: {project.title}</span>
                </div>
                {project.client && (
                  <div className="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span>Client: {project.client}</span>
                  </div>
                )}
                {project.apfo && (
                  <div className="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span>APFO: {project.apfo}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="hero-actions">
              <Link className="btn btn-outline btn-hero" href={`/projects/${projectId}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to Project
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Content */}
      <div className="project-content">
        <div className="content-grid">
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Project Information
              </h2>
            </div>
            <div className="form-container">
              <ProjectForm users={users} project={project} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
