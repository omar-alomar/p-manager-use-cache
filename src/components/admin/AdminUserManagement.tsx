"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserRoleButton } from "./UserRoleButton"
import { AdminDeleteButton } from "./AdminDeleteButton"
import { EditableEmail } from "./EditableEmail"
import { EditablePassword } from "./EditablePassword"
import { deleteUserAction } from "@/actions/users"
import { UserModal } from "./UserModal"

interface User {
  id: number
  name: string
  email: string
  role: string
  createdAt: Date
  projects: { id: number; title: string }[]
  tasks: { id: number; title: string }[]
}

interface AdminUserManagementProps {
  users: User[]
}

export function AdminUserManagement({ users }: AdminUserManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const handleUserCreated = () => {
    setIsModalOpen(false)
    router.refresh()
  }

  return (
    <div className="admin-section-card">
      <div className="admin-section-card-header">
        <div className="admin-section-card-title-group">
          <div className="admin-section-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <h2 className="admin-section-card-title">User Management</h2>
            <p className="admin-section-card-subtitle">{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
          </div>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setIsModalOpen(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New User
        </button>
      </div>
      {isModalOpen && (
        <UserModal
          onClose={() => setIsModalOpen(false)}
          onUserCreated={handleUserCreated}
        />
      )}
      <div className="admin-section-card-body">
        {users.length === 0 ? (
          <div className="admin-empty">
            <p>No users found</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Password</th>
                <th>Role</th>
                <th>Projects</th>
                <th>Tasks</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <Link href={`/users/${user.id}`} className="admin-cell-link">
                      {user.name}
                    </Link>
                  </td>
                  <td>
                    <EditableEmail
                      userId={user.id}
                      initialEmail={user.email}
                      userName={user.name}
                    />
                  </td>
                  <td>
                    <EditablePassword
                      userId={user.id}
                      userName={user.name}
                    />
                  </td>
                  <td>
                    <UserRoleButton userId={user.id} currentRole={user.role} userName={user.name} />
                  </td>
                  <td>
                    <span className="admin-count">{user.projects.length}</span>
                  </td>
                  <td>
                    <span className="admin-count">{user.tasks.length}</span>
                  </td>
                  <td className="admin-cell-muted">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td>
                    <AdminDeleteButton
                      itemId={user.id}
                      itemName={user.name}
                      itemType="user"
                      onDelete={async (id) => {
                        await deleteUserAction(id)
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
