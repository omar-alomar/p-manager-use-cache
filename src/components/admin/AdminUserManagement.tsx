"use client"

import Link from "next/link"
import { UserRoleButton } from "./UserRoleButton"
import { AdminDeleteButton } from "./AdminDeleteButton"
import { EditableEmail } from "./EditableEmail"
import { EditablePassword } from "./EditablePassword"
import { deleteUserAction } from "@/actions/users"

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
  return (
    <div className="admin-section">
      <h2 className="section-title">User Management</h2>
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
