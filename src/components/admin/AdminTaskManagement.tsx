"use client"

import Link from "next/link"
import { AdminDeleteButton } from "./AdminDeleteButton"
import { adminDeleteTaskAction } from "@/actions/admin"

interface Task {
  id: number
  title: string
  completed: boolean
  userId: number
  projectId: number | null
  createdAt: Date
  updatedAt: Date
  User: {
    id: number
    name: string
  }
  Project: {
    id: number
    title: string
  } | null
}

interface AdminTaskManagementProps {
  tasks: Task[]
}

export function AdminTaskManagement({ tasks }: AdminTaskManagementProps) {
  return (
    <div className="admin-section-card">
      <div className="admin-section-card-header">
        <div className="admin-section-card-title-group">
          <div className="admin-section-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <div>
            <h2 className="admin-section-card-title">Task Management</h2>
            <p className="admin-section-card-subtitle">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} &middot; {tasks.filter(t => t.completed).length} completed
            </p>
          </div>
        </div>
      </div>
      <div className="admin-section-card-body">
        {tasks.length === 0 ? (
          <div className="admin-empty">
            <p>No tasks found</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Assignee</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td>
                    <span className="admin-cell-primary">{task.title}</span>
                  </td>
                  <td>
                    {task.projectId ? (
                      <Link href={`/projects/${task.projectId}`} className="admin-cell-link">
                        {task.Project?.title || 'Unknown'}
                      </Link>
                    ) : (
                      <span className="admin-cell-muted">No Project</span>
                    )}
                  </td>
                  <td>
                    <Link href={`/users/${task.userId}`} className="admin-cell-link">
                      {task.User?.name || 'Unknown'}
                    </Link>
                  </td>
                  <td>
                    <span className={`admin-status-dot ${task.completed ? 'completed' : 'pending'}`}>
                      {task.completed ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                  <td className="admin-cell-muted">
                    {new Date(task.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td>
                    <AdminDeleteButton
                      itemId={task.id}
                      itemName={task.title}
                      itemType="task"
                      onDelete={async (id) => {
                        await adminDeleteTaskAction(id)
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
