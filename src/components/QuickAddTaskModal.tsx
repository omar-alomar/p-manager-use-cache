"use client"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import { createPortal } from "react-dom"
import { createTaskAction } from "@/actions/tasks"
import { getProjectsAction } from "@/actions/projects"
import { getUsersAction } from "@/actions/users"
import { FormGroup } from "./FormGroup"
import { SearchableSelect } from "./SearchableSelect"
import { URGENCY_SELECT_OPTIONS } from "@/constants/urgency"

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

function QuickAddTaskDrawerContent({
  isOpen,
  onClose,
  presetUserId,
  presetUserName,
  presetProjectId,
  users: propUsers,
  projects: propProjects
}: QuickAddTaskModalProps) {
  const [projects, setProjects] = useState<{ id: number; title: string }[]>([])
  const [users, setUsers] = useState<{ id: number; name: string }[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(presetUserId)
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(presetProjectId)
  const [selectedUrgency, setSelectedUrgency] = useState<string>('MEDIUM')
  const [errors, formAction, pending] = useActionState(createTaskAction, {})

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      if (propUsers && propProjects) {
        setUsers(propUsers)
        setProjects(propProjects)
      } else {
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

  useEffect(() => {
    if (errors && 'success' in errors && errors.success) {
      onClose()
    }
  }, [errors, onClose])

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  if (!isOpen || !isMounted) return null

  const drawerTitle = presetUserName
    ? `New Task for ${presetUserName}`
    : "New Task"

  return createPortal(
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel">
        <div className="drawer-header">
          <h2 className="modal-title">{drawerTitle}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="drawer-body">
          <form action={formAction} className={`form ${pending ? 'form-loading' : ''}`}>
            {presetUserId && (
              <input type="hidden" name="userId" value={presetUserId} />
            )}
            {presetProjectId && (
              <input type="hidden" name="projectId" value={presetProjectId} />
            )}

            <FormGroup errorMessage={'title' in errors ? errors.title : undefined}>
              <label htmlFor="task-title">Task Title</label>
              <input
                required
                type="text"
                name="title"
                id="task-title"
                placeholder="Enter task title..."
                autoFocus
              />
            </FormGroup>

            {!presetUserId && (
              <FormGroup errorMessage={'userId' in errors ? errors.userId : undefined}>
                <label htmlFor="task-user">Assigned To</label>
                <SearchableSelect
                  options={users.map(user => ({ value: user.id, label: user.name }))}
                  value={selectedUserId}
                  onChange={(value) => setSelectedUserId(typeof value === 'number' ? value : undefined)}
                  placeholder="Select a team member"
                  disabled={isLoadingUsers}
                  name="userId"
                  id="task-user"
                  required
                  noResultsText="No team members found"
                />
              </FormGroup>
            )}

            {!presetProjectId && (
              <FormGroup errorMessage={'projectId' in errors ? errors.projectId : undefined}>
                <label htmlFor="task-project">Project</label>
                <SearchableSelect
                  options={[{ value: 0, label: "No Project" }, ...projects.map(project => ({ value: project.id, label: project.title }))]}
                  value={selectedProjectId ?? 0}
                  onChange={(value) => setSelectedProjectId(typeof value === 'number' ? value : 0)}
                  placeholder="Select a project (optional)"
                  disabled={isLoadingProjects}
                  name="projectId"
                  id="task-project"
                  noResultsText="No projects found"
                />
              </FormGroup>
            )}

            <FormGroup errorMessage={'urgency' in errors ? errors.urgency : undefined}>
              <label htmlFor="task-urgency">Urgency</label>
              <SearchableSelect
                options={URGENCY_SELECT_OPTIONS}
                value={selectedUrgency}
                onChange={(value) => setSelectedUrgency(typeof value === 'string' ? value : value?.toString() || 'MEDIUM')}
                placeholder="Select urgency level"
                name="urgency"
                id="task-urgency"
                noResultsText="No urgency levels found"
              />
            </FormGroup>

            <div className="form-actions">
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
                className="btn btn-primary"
              >
                {pending ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  )
}

export function QuickAddTaskModal(props: QuickAddTaskModalProps) {
  if (!props.isOpen) return null
  return <QuickAddTaskDrawerContent {...props} />
}
