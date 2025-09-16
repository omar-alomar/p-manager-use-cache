"use client"

import Link from "next/link"
import { AdminDeleteButton } from "./AdminDeleteButton"
import { adminDeleteClientAction } from "@/actions/admin"

interface Client {
  id: number
  name: string
  companyName: string | null
  email: string
  phone: string | null
  address: string | null
  createdAt: Date
  projects: { 
    id: number
    title: string
    user: { id: number; name: string }
  }[]
}

interface AdminClientManagementProps {
  clients: Client[]
}

export function AdminClientManagement({ clients }: AdminClientManagementProps) {
  return (
    <div className="admin-section">
      <h2 className="section-title">Client Management</h2>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Company</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Projects</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  <div className="empty-content">
                    <p>No clients found</p>
                  </div>
                </td>
              </tr>
            ) : (
              clients.map(client => (
                <tr key={client.id}>
                  <td className="client-name-cell">
                    <Link href={`/clients/${client.id}`} className="client-link">
                      <div className="client-name">{client.name}</div>
                    </Link>
                  </td>
                  <td className="company-cell">
                    {client.companyName ? (
                      <span className="company-name">{client.companyName}</span>
                    ) : (
                      <span className="no-company">-</span>
                    )}
                  </td>
                  <td className="email-cell">
                    <a 
                      href={`mailto:${client.email}`} 
                      className="email-link"
                      title={`Send email to ${client.email}`}
                    >
                      {client.email}
                    </a>
                  </td>
                  <td className="phone-cell">
                    {client.phone ? (
                      <a 
                        href={`tel:${client.phone}`} 
                        className="phone-link"
                        title={`Call ${client.phone}`}
                      >
                        {client.phone}
                      </a>
                    ) : (
                      <span className="no-phone">-</span>
                    )}
                  </td>
                  <td className="address-cell">
                    {client.address ? (
                      <span 
                        className="address-text" 
                        title={client.address.replace(/\r\n/g, '\n').replace(/\r/g, '\n')}
                        style={{ whiteSpace: 'pre-line' }}
                      >
                        {(() => {
                          const normalizedAddress = client.address.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
                          return normalizedAddress.length > 30 
                            ? `${normalizedAddress.substring(0, 30)}...` 
                            : normalizedAddress
                        })()}
                      </span>
                    ) : (
                      <span className="no-address">-</span>
                    )}
                  </td>
                  <td className="projects-cell">
                    <span className="count-badge">{client.projects.length}</span>
                    {client.projects.length > 0 && (
                      <div className="project-list">
                        {client.projects.slice(0, 3).map(project => (
                          <div key={project.id} className="project-item">
                            <Link 
                              href={`/projects/${project.id}`}
                              className="project-link"
                              title={`${project.title} (${project.user.name})`}
                            >
                              {project.title.length > 20 
                                ? `${project.title.substring(0, 20)}...` 
                                : project.title
                              }
                            </Link>
                          </div>
                        ))}
                        {client.projects.length > 3 && (
                          <div className="more-projects">
                            +{client.projects.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="created-cell">
                    {new Date(client.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="actions-cell">
                    <AdminDeleteButton
                      itemId={client.id}
                      itemName={client.name}
                      itemType="client"
                      onDelete={async (id) => {
                        await adminDeleteClientAction(id)
                      }}
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


