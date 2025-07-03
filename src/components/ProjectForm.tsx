"use client"

import { FormGroup } from "./FormGroup"
import { Suspense, useActionState } from "react"
import Link from "next/link"
import { SkeletonInput } from "./Skeleton"
import { createProjectAction, editProjectAction } from "@/actions/projects"

export function ProjectForm({
  users,
  project,
}: {
  users: { id: number; name: string }[]
  project?: {
    id: number
    title: string
    userId: number
    body: string
  }
}) {
  const action =
    project == null ? createProjectAction : editProjectAction.bind(null, project.id)
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
            defaultValue={project?.title}
          />
        </FormGroup>
        <FormGroup errorMessage={errors.userId}>
          <label htmlFor="userId">Project Manager</label>
          <select
            required
            name="userId"
            id="userId"
            defaultValue={project?.userId}
          >
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
        <FormGroup errorMessage={errors.body}>
          <label htmlFor="body">Body</label>
          <textarea required name="body" id="body" defaultValue={project?.body} />
        </FormGroup>
      </div>
      <div className="form-row form-btn-row">
        <Link
          className="btn btn-outline"
          href={project == null ? "/projects" : `/projects/${project.id}`}
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

export function SkeletonProjectForm() {
  return (
    <form className="form">
      <div className="form-row">
        <FormGroup>
          <label htmlFor="title">Title</label>
          <SkeletonInput />
        </FormGroup>
        <FormGroup>
          <label htmlFor="userId">Project Manager</label>
          <SkeletonInput />
        </FormGroup>
      </div>
      <div className="form-row">
        <FormGroup>
          <label htmlFor="body">Body</label>
          <SkeletonInput />
        </FormGroup>
      </div>
      <div className="form-row form-btn-row">
        <Link className="btn btn-outline" href="/projects">
          Cancel
        </Link>
        <button disabled className="btn">
          Save
        </button>
      </div>
    </form>
  )
}
