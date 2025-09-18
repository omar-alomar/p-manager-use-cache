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
  const handleDeleteTask = async (taskId: number) => {
    await adminDeleteTaskAction(taskId)
  }

  return (
    <div className="admin-section">
      <h2 className="section-title">Task Management</h2>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Project</th>
              <th>Assignee</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  <div className="empty-state-content">
                    <div className="empty-state-icon">✅</div>
                    <h3>No Tasks Found</h3>
                    <p>No tasks have been created yet.</p>
                  </div>
                </td>
              </tr>
            ) : (
              tasks.map(task => (
                <tr key={task.id}>
                  <td className="task-cell">
                    <div className="task-info">
                      <div className="task-title">{task.title}</div>
                      <div className="task-id">ID: {task.id}</div>
                    </div>
                  </td>
                  <td className="project-cell">
                    {task.projectId ? (
                      <Link href={`/projects/${task.projectId}`} className="project-link">
                        <span className="project-name">{task.Project?.title || 'Unknown Project'}</span>
                      </Link>
                    ) : (
                      <span className="project-name no-project">No Project</span>
                    )}
                  </td>
                  <td className="assignee-cell">
                    <div className="assignee-info">
                      <div className="assignee-name">{task.User?.name || 'Unknown User'}</div>
                      <div className="assignee-id">ID: {task.userId}</div>
                    </div>
                  </td>
                  <td className="status-cell">
                    <span className={`status-badge ${task.completed ? 'completed' : 'pending'}`}>
                      {task.completed ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                  <td className="date-cell">
                    <span className="created-date">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <AdminDeleteButton
                      itemId={task.id}
                      itemName={task.title}
                      itemType="task"
                      onDelete={handleDeleteTask}
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
