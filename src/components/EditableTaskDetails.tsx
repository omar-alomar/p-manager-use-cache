"use client"

import { useState, useEffect } from "react"
import { SearchableSelect } from "./SearchableSelect"
import { updateTaskCompletionAction } from "@/actions/tasks"
import { useRouter } from "next/navigation"

interface EditableTaskDetailsProps {
  task: {
    id: number
    title: string
    completed: boolean
    userId: number
    projectId: number | null
    createdAt: Date
  }
  users: { id: number; name: string }[]
  projects: { id: number; title: string }[]
  initialUser: { id: number; name: string } | null
  initialProject: { id: number; title: string } | null
}

export function EditableTaskDetails({ 
  task, 
  users, 
  projects, 
  initialUser, 
  initialProject 
}: EditableTaskDetailsProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(task.userId)
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(task.projectId || undefined)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  const handleUserChange = async (value: string | number | undefined) => {
    const newUserId = typeof value === 'string' ? parseInt(value) : value
    if (newUserId === selectedUserId || isUpdating) return
    
    setIsUpdating(true)
    try {
      await updateTaskCompletionAction(task.id, {
        title: task.title,
        completed: task.completed,
        userId: newUserId!,
        projectId: selectedProjectId
      })
      setSelectedUserId(newUserId)
      router.refresh()
    } catch (error) {
      console.error('Failed to update user assignment:', error)
      alert('Failed to update user assignment. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleProjectChange = async (value: string | number | undefined) => {
    const newProjectId = typeof value === 'string' ? parseInt(value) : value
    if (newProjectId === selectedProjectId || isUpdating) return
    
    setIsUpdating(true)
    try {
      await updateTaskCompletionAction(task.id, {
        title: task.title,
        completed: task.completed,
        userId: selectedUserId!,
        projectId: newProjectId
      })
      setSelectedProjectId(newProjectId)
      router.refresh()
    } catch (error) {
      console.error('Failed to update project assignment:', error)
      alert('Failed to update project assignment. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="task-details">
      <div className="detail-grid">
        <div className="detail-item">
          <div className="detail-label">Status</div>
          <div className="detail-value">
            <span className={`status-badge ${task.completed ? 'completed' : 'pending'}`}>
              {task.completed ? 'Completed' : 'Pending'}
            </span>
          </div>
        </div>
        
        <div className="detail-item">
          <div className="detail-label">Assigned To</div>
          <div className="detail-value">
            <SearchableSelect
              options={users.map(user => ({ value: user.id, label: user.name }))}
              value={selectedUserId}
              onChange={handleUserChange}
              placeholder="Select a user"
              disabled={isUpdating}
              className="inline-select"
            />
          </div>
        </div>
        
        <div className="detail-item">
          <div className="detail-label">Project</div>
          <div className="detail-value">
            <SearchableSelect
              options={[{ value: 0, label: "No Project" }, ...projects.map(project => ({ value: project.id, label: project.title }))]}
              value={selectedProjectId ?? 0}
              onChange={handleProjectChange}
              placeholder="Select a project"
              disabled={isUpdating}
              className="inline-select"
            />
          </div>
        </div>
        
        <div className="detail-item">
          <div className="detail-label">Created</div>
          <div className="detail-value">
            {task.createdAt.toLocaleDateString()} at {task.createdAt.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  )
}
