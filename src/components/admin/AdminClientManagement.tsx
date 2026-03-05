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
    <div className="admin-section-card">
      <div className="admin-section-card-header">
        <div className="admin-section-card-title-group">
          <div className="admin-section-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <h2 className="admin-section-card-title">Client Management</h2>
            <p className="admin-section-card-subtitle">{clients.length} client{clients.length !== 1 ? 's' : ''} registered</p>
          </div>
        </div>
      </div>
      <div className="admin-section-card-body">
        {clients.length === 0 ? (
          <div className="admin-empty">
            <p>No clients found</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Projects</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client.id}>
                  <td>
                    <Link href={`/clients/${client.id}`} className="admin-cell-link">
                      {client.name}
                    </Link>
                  </td>
                  <td>
                    {client.companyName || <span className="admin-cell-muted">-</span>}
                  </td>
                  <td>
                    <a href={`mailto:${client.email}`} className="admin-cell-email">
                      {client.email}
                    </a>
                  </td>
                  <td>
                    {client.phone ? (
                      <a href={`tel:${client.phone}`} className="admin-cell-email">
                        {client.phone}
                      </a>
                    ) : (
                      <span className="admin-cell-muted">-</span>
                    )}
                  </td>
                  <td>
                    <span className="admin-count">{client.projects.length}</span>
                  </td>
                  <td className="admin-cell-muted">
                    {new Date(client.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td>
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
