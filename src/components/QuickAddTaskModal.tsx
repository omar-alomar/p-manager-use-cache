"use client"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import { createPortal } from "react-dom"
import { createTaskAction } from "@/actions/tasks"
import { getProjectsAction } from "@/actions/projects"
import { getUsersAction } from "@/actions/users"
import { FormGroup } from "./FormGroup"

interface QuickAddTaskModalProps {
  isOpen: boolean
  onClose: () => void
  presetUserId?: number
  presetUserName?: string
  presetProjectId?: number
  className?: string
  users?: { id: number; name: string }[]
  projects?: { id: number; title: string }[]
}

// Wrapper component to provide fresh useActionState for each modal instance
function QuickAddTaskModalContent({ 
  isOpen, 
  onClose, 
  presetUserId, 
  presetUserName, 
  presetProjectId,
  className = "",
  users: propUsers,
  projects: propProjects
}: QuickAddTaskModalProps) {
  const [projects, setProjects] = useState<{ id: number; title: string }[]>([])
  const [users, setUsers] = useState<{ id: number; name: string }[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [errors, formAction, pending] = useActionState(createTaskAction, {})

  // Set mounted state on client side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Use provided data or fetch when modal opens
  useEffect(() => {
    if (isOpen) {
      if (propUsers && propProjects) {
        // Use provided data
        setUsers(propUsers)
        setProjects(propProjects)
      } else {
        // Fetch data if not provided
        const fetchData = async () => {
          setIsLoadingProjects(true)
          setIsLoadingUsers(true)
          try {
            const [projectsData, usersData] = await Promise.all([
              getProjectsAction(),
              getUsersAction()
            ])
            setProjects(projectsData)
            setUsers(usersData)
          } catch (error) {
            console.error('Failed to fetch data:', error)
          } finally {
            setIsLoadingProjects(false)
            setIsLoadingUsers(false)
          }
        }
        fetchData()
      }
    }
  }, [isOpen, propUsers, propProjects])

  // Handle successful form submission
  useEffect(() => {
    if (errors && 'success' in errors && errors.success) {
      onClose()
    }
  }, [errors, onClose])

  if (!isOpen || !isMounted) return null

  const modalTitle = presetUserName 
    ? `New Task... for ${presetUserName}`
    : "New Task..."

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="quick-add-modal" role="dialog" aria-labelledby="quick-add-title">
        <div className="modal-header">
          <h3 id="quick-add-title" className="modal-title">
            {modalTitle}
          </h3>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form action={formAction} className={`quick-add-form ${pending ? 'form-loading' : ''}`}>
          {/* Hidden inputs for preset values */}
          {presetUserId && (
            <input type="hidden" name="userId" value={presetUserId} />
          )}
          {presetProjectId && (
            <input type="hidden" name="projectId" value={presetProjectId} />
          )}
          
          <div className="form-group">
            <FormGroup errorMessage={'title' in errors ? errors.title : undefined}>
              <label htmlFor="task-title">Task Title</label>
              <input
                required
                type="text"
                name="title"
                id="task-title"
                placeholder="Enter task title..."
                className="form-input"
                autoFocus
              />
            </FormGroup>
          </div>

          {!presetUserId && (
            <div className="form-group">
              <FormGroup errorMessage={'userId' in errors ? errors.userId : undefined}>
                <label htmlFor="task-user">Assigned To</label>
                <select
                  required
                  name="userId"
                  id="task-user"
                  className="form-select"
                  disabled={isLoadingUsers}
                >
                  <option value="">Select a team member</option>
                  {isLoadingUsers ? (
                    <option value="" disabled>Loading team members...</option>
                  ) : (
                    users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))
                  )}
                </select>
              </FormGroup>
            </div>
          )}

          {!presetProjectId && (
            <div className="form-group">
              <FormGroup errorMessage={'projectId' in errors ? errors.projectId : undefined}>
                <label htmlFor="task-project">Project</label>
                <select
                  required
                  name="projectId"
                  id="task-project"
                  className="form-select"
                  disabled={isLoadingProjects}
                >
                  <option value="">Select a project</option>
                  {isLoadingProjects ? (
                    <option value="" disabled>Loading projects...</option>
                  ) : (
                    projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))
                  )}
                </select>
              </FormGroup>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="btn"
            >
              {pending ? (
                <>
                  <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )

  return createPortal(modalContent, document.body)
}

// Main component that conditionally renders the modal content
export function QuickAddTaskModal(props: QuickAddTaskModalProps) {
  if (!props.isOpen) return null
  
  return <QuickAddTaskModalContent {...props} />
}
