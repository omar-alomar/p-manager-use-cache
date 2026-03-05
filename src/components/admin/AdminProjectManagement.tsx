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
  managerName: string
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
  return (
    <div className="admin-section-card">
      <div className="admin-section-card-header">
        <div className="admin-section-card-title-group">
          <div className="admin-section-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <h2 className="admin-section-card-title">Project Management</h2>
            <p className="admin-section-card-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
          </div>
        </div>
      </div>
      <div className="admin-section-card-body">
        {projects.length === 0 ? (
          <div className="admin-empty">
            <p>No projects found</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Manager</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => (
                <tr key={project.id}>
                  <td>
                    <Link href={`/projects/${project.id}`} className="admin-cell-link">
                      {project.title}
                    </Link>
                  </td>
                  <td>{project.client || <span className="admin-cell-muted">-</span>}</td>
                  <td>{project.managerName}</td>
                  <td className="admin-cell-muted">
                    {new Date(project.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td>
                    <AdminDeleteButton
                      itemId={project.id}
                      itemName={project.title}
                      itemType="project"
                      onDelete={async (id) => {
                        await adminDeleteProjectAction(id)
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
