"use client"

import React from "react"
import { FormGroup } from "./FormGroup"
import { Suspense, useActionState } from "react"
import Link from "next/link"
import { SkeletonInput } from "./Skeleton"
import { createTaskAction, editTaskAction } from "@/actions/tasks"

export function TaskForm({
  users,
  projects,
  task,
}: {
  users: { id: number; name: string }[]
  projects: { id: number; title: string }[]
  task?: {
    id: number
    title: string
    description?: string
    status?: 'IN_PROGRESS' | 'COMPLETED'
    completed: boolean
    userId: number
    projectId: number
  }
}) {
  const action =
    task == null ? createTaskAction : editTaskAction.bind(null, task.id)
  const [state, formAction, pending] = useActionState(action, {})
  
  // Handle success state for task creation/editing
  React.useEffect(() => {
    if ('success' in state && state.success) {
      if (!task) {
        // For new tasks, show success message briefly, then redirect
        const timer = setTimeout(() => {
          window.location.href = '/tasks'
        }, 1500)
        return () => clearTimeout(timer)
      } else {
        // For edited tasks, show success message briefly, then redirect to task detail
        const timer = setTimeout(() => {
          window.location.href = `/tasks/${task.id}`
        }, 1500)
        return () => clearTimeout(timer)
      }
    }
  }, [state, task])

  const formTitle = task ? 'Edit Task' : 'Create New Task'
  
  // Extract errors from state
  const errors = 'title' in state ? state : {}

  return (
    <form action={formAction} className={`form ${pending ? 'form-loading' : ''}`}>
      <div className="form-header">
        <h2 className="form-title">
          {pending ? (
            <>
              <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              {formTitle}...
            </>
          ) : (
            formTitle
          )}
        </h2>
        {'success' in state && state.success && (
          <div className="form-success-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            {state.message}
          </div>
        )}
      </div>
      <div className="form-row">
        <FormGroup errorMessage={errors.title}>
          <label htmlFor="title">Title</label>
          <input
            required
            type="text"
            name="title"
            id="title"
            defaultValue={task?.title}
          />
        </FormGroup>
      </div>
      
      <div className="form-row">
        <FormGroup errorMessage={'description' in errors ? (errors.description as string) : undefined}>
          <label htmlFor="description">Description</label>
          <textarea
            name="description"
            id="description"
            rows={3}
            defaultValue={task?.description}
            placeholder="Optional task description..."
          />
        </FormGroup>
      </div>
      
      <div className="form-row">
        <FormGroup errorMessage={errors.projectId}>
          <label htmlFor="projectId">Project</label>
          <select
            required
            name="projectId"
            id="projectId"
            defaultValue={task?.projectId}
          >
            <option value="">Select a project</option>
            <Suspense fallback={<option value="">Loading...</option>}>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </Suspense>
          </select>
        </FormGroup>
        
        <FormGroup errorMessage={errors.userId}>
          <label htmlFor="userId">Assigned To</label>
          <select
            required
            name="userId"
            id="userId"
            defaultValue={task?.userId}
          >
            <option value="">Select a user</option>
            <Suspense fallback={<option value="">Loading...</option>}>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Suspense>
          </select>
        </FormGroup>
      </div>
      
      <div className="form-row">
        <FormGroup errorMessage={errors.status}>
          <label htmlFor="status">Status</label>
          <select
            name="status"
            id="status"
            defaultValue={task?.status || 'IN_PROGRESS'}
          >
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </FormGroup>
      </div>

      {/* Only show completion status when editing an existing task */}
      {task && (
        <div className="form-row">
          <FormGroup errorMessage={errors.completed}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="completed"
                id="completed"
                defaultChecked={task.completed}
              />
              <span>Completed</span>
            </label>
          </FormGroup>
        </div>
      )}

      <div className="form-row form-btn-row">
        <Link
          className="btn btn-outline"
          href={task == null ? "/tasks" : `/tasks/${task.id}`}
        >
          Cancel
        </Link>
        <button disabled={pending} className={`btn ${pending ? 'btn-loading' : ''}`}>
          {pending ? (
            <>
              <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Saving...
            </>
          ) : (
            "Save"
          )}
        </button>
      </div>
    </form>
  )
}

export function SkeletonTaskForm() {
  return (
    <form className="form">
      <div className="form-row">
        <FormGroup>
          <label htmlFor="title">Title</label>
          <SkeletonInput />
        </FormGroup>
      </div>
      <div className="form-row">
        <FormGroup>
          <label htmlFor="projectId">Project</label>
          <SkeletonInput />
        </FormGroup>
        <FormGroup>
          <label htmlFor="userId">Assigned To</label>
          <SkeletonInput />
        </FormGroup>
      </div>
      <div className="form-row form-btn-row">
        <Link className="btn btn-outline" href="/tasks">
          Cancel
        </Link>
        <button disabled className="btn">
          Save
        </button>
      </div>
    </form>
  )
}