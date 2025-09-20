"use client"

import Link from "next/link"
import { AdminDeleteButton } from "./AdminDeleteButton"
import { adminDeleteProjectAction } from "@/actions/admin"

interface Project {
  id: number
  title: string
  client: string
  body: string
  userId: number
  milestone: Date | null
  mbaNumber: string
  coFileNumbers: string
  dldReviewer: string
  createdAt: Date
}

interface AdminProjectManagementProps {
  projects: Project[]
}

export function AdminProjectManagement({ projects }: AdminProjectManagementProps) {
  const handleDeleteProject = async (projectId: number) => {
    await adminDeleteProjectAction(projectId)
  }

  return (
    <div className="admin-section">
      <h2 className="section-title">Project Management</h2>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Client</th>
              <th>Manager</th>
              <th>Tasks</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  <div className="empty-state-content">
                    <div className="empty-state-icon">📁</div>
                    <h3>No Projects Found</h3>
                    <p>No projects have been created yet.</p>
                  </div>
                </td>
              </tr>
            ) : (
              projects.map(project => (
                <tr key={project.id}>
                  <td className="project-cell">
                    <div className="project-info">
                      <Link href={`/projects/${project.id}`} className="project-link">
                        <div className="project-title">{project.title}</div>
                      </Link>
                      <div className="project-id">ID: {project.id}</div>
                    </div>
                  </td>
                  <td className="client-cell">
                    <span className="client-name">{project.client || 'N/A'}</span>
                  </td>
                  <td className="manager-cell">
                    <div className="manager-info">
                      <div className="manager-name">Unknown</div>
                      <div className="manager-id">ID: {project.userId}</div>
                    </div>
                  </td>
                  <td className="count-cell">
                    <span className="count-badge">0</span>
                  </td>
                  <td className="date-cell">
                    <span className="created-date">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <AdminDeleteButton
                      itemId={project.id}
                      itemName={project.title}
                      itemType="project"
                      onDelete={handleDeleteProject}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
