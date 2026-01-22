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
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="section-title">User Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      <div className="admin-table-container">
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  <div className="empty-content">
                    <p>No users found</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <td className="user-cell">
                    <Link href={`/users/${user.id}`} className="user-link">
                      <div className="user-name">{user.name}</div>
                    </Link>
                  </td>
                  <td className="email-cell">
                    <EditableEmail 
                      userId={user.id} 
                      initialEmail={user.email} 
                      userName={user.name} 
                    />
                  </td>
                  <td className="password-cell">
                    <EditablePassword 
                      userId={user.id} 
                      userName={user.name} 
                    />
                  </td>
                  <td className="role-cell">
                    <UserRoleButton userId={user.id} currentRole={user.role} userName={user.name} />
                  </td>
                  <td className="projects-cell">
                    <span className="count-badge">{user.projects.length}</span>
                  </td>
                  <td className="tasks-cell">
                    <span className="count-badge">{user.tasks.length}</span>
                  </td>
                  <td className="created-cell">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="actions-cell">
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
