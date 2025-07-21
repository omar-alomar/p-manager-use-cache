"use client"

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
    completed: boolean
    userId: number
    projectId: number
  }
}) {
  const action =
    task == null ? createTaskAction : editTaskAction.bind(null, task.id)
  const [errors, formAction, pending] = useActionState(action, {})

  return (
    <form action={formAction} className="form">
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
        <FormGroup errorMessage={errors.completed}>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="completed"
              id="completed"
              defaultChecked={task?.completed}
            />
            <span>Completed</span>
          </label>
        </FormGroup>
      </div>

      <div className="form-row form-btn-row">
        <Link
          className="btn btn-outline"
          href={task == null ? "/tasks" : `/tasks/${task.id}`}
        >
          Cancel
        </Link>
        <button disabled={pending} className="btn">
          {pending ? "Saving" : "Save"}
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
      <div className="form-row">
        <FormGroup>
          <label className="checkbox-label">
            <input type="checkbox" disabled />
            <span>Completed</span>
          </label>
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