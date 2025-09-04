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
    <div className="project-profile-container">
      {/* Hero Section */}
      <div className="project-hero">
        {/* Left Section - Project Info */}
        <div className="hero-left-section">
          <div className="hero-avatar">
            <div className="avatar-circle edit-avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
          </div>
          
          <div className="hero-basic-info">
            <h1 className="hero-name">Edit Project</h1>
            <div className="hero-tags">
              <span className="hero-tag client">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                {project.title}
              </span>
              {project.client && (
                <span className="hero-tag apfo">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  {project.client}
                </span>
              )}
              {project.apfo && (
                <span className="hero-tag apfo">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                  {new Date(project.apfo).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="hero-right-section">
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

      <div className="project-content-grid">
        {/* Project Form Section */}
        <div className="content-section">
          <div className="section-header">
            <div className="section-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <div className="section-title-group">
              <h2 className="section-title">Edit Project Information</h2>
              <p className="section-subtitle">Update project details and metadata</p>
            </div>
          </div>
          
          <div className="section-content">
            <ProjectForm users={users} project={project} />
          </div>
        </div>
      </div>
    </div>
  )
}
