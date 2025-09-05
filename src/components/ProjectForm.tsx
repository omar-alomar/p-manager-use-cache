"use client"

import React from "react"
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
  client: string
  body: string
  apfo: Date | null
  mbaNumber: string
  coFileNumbers: string
  dldReviewer: string
  userId: number
  }
}) {
  const action =
    project == null ? createProjectAction : editProjectAction.bind(null, project.id)
  const [state, formAction, pending] = useActionState(action, {})
  
  // Handle success state for project creation/editing
  React.useEffect(() => {
    if ('success' in state && state.success) {
      if (!project) {
        // For new projects, redirect to projects page
        window.location.href = '/projects'
      } else {
        // For edited projects, redirect to project detail
        window.location.href = `/projects/${project.id}`
      }
    }
  }, [state, project])

  return (
    <form action={formAction} className="form">
      <div className="form-row">
        <FormGroup errorMessage={'title' in state ? state.title : undefined}>
          <label htmlFor="title">Title</label>
          <input
            required
            type="text"
            name="title"
            id="title"
            defaultValue={project?.title}
          />
        </FormGroup>
        <FormGroup errorMessage={'client' in state ? state.client : undefined}>
          <label htmlFor="client">Client</label>
          <input
            required
            type="text"
            name="client"
            id="client"
            defaultValue={project?.client}
          />
        </FormGroup>
      </div>
      <div className="form-row">
        <FormGroup errorMessage={'userId' in state ? state.userId : undefined}>
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
        <FormGroup errorMessage={'apfo' in state ? state.apfo : undefined}>
          <label htmlFor="apfo">APFO Date</label>
          <input
            required
            type="date"
            name="apfo"
            id="apfo"
            defaultValue={project?.apfo ? new Date(project.apfo).toISOString().split('T')[0] : ''}
          />
        </FormGroup>
      </div>

      <div className="form-row">
        <FormGroup errorMessage={'body' in state ? state.body : undefined}>
          <label htmlFor="body">Description</label>
          <textarea required name="body" id="body" defaultValue={project?.body} />
        </FormGroup>
      </div>
      
      <div className="form-row">
        <FormGroup errorMessage={'mbaNumber' in state ? state.mbaNumber : undefined}>
          <label htmlFor="mbaNumber">MBA Number</label>
          <input
            type="text"
            name="mbaNumber"
            id="mbaNumber"
            defaultValue={project?.mbaNumber}
          />
        </FormGroup>
        <FormGroup errorMessage={'coFileNumbers' in state ? state.coFileNumbers : undefined}>
          <label htmlFor="coFileNumbers">Co File #&apos;s</label>
          <input
            type="text"
            name="coFileNumbers"
            id="coFileNumbers"
            defaultValue={project?.coFileNumbers}
          />
        </FormGroup>
      </div>
      
      <div className="form-row">
        <FormGroup errorMessage={'dldReviewer' in state ? state.dldReviewer : undefined}>
          <label htmlFor="dldReviewer">DLD Reviewer</label>
          <input
            type="text"
            name="dldReviewer"
            id="dldReviewer"
            defaultValue={project?.dldReviewer}
          />
        </FormGroup>
      </div>
      
      <div className="form-actions">
        <Link
          className="btn btn-outline btn-cancel"
          href={project == null ? "/projects" : `/projects/${project.id}`}
        >
          Cancel
        </Link>
        <button 
          disabled={pending} 
          className="btn btn-primary btn-save"
          type="submit"
        >
          {pending ? (
            <>
              <span className="btn-spinner"></span>
              Saving...
            </>
          ) : (
            "Save Project"
          )}
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
          <label htmlFor="client">Client</label>
          <SkeletonInput />
        </FormGroup>
      </div>
      <div className="form-row">
        <FormGroup>
          <label htmlFor="userId">Project Manager</label>
          <SkeletonInput />
        </FormGroup>
        <FormGroup>
          <label htmlFor="apfo">APFO</label>
          <SkeletonInput />
        </FormGroup>
      </div>
      <div className="form-row">
        <FormGroup>
          <label htmlFor="body">Description</label>
          <SkeletonInput />
        </FormGroup>
      </div>
      <div className="form-row">
        <FormGroup>
          <label htmlFor="coFileNumbers">Co File #&apos;s</label>
          <SkeletonInput />
        </FormGroup>
        <FormGroup>
          <label htmlFor="dldReviewer">DLD Reviewer</label>
          <SkeletonInput />
        </FormGroup>
      </div>
      <div className="form-actions">
        <Link className="btn btn-outline btn-cancel" href="/projects">
          Cancel
        </Link>
        <button disabled className="btn btn-primary btn-save">
          Save Project
        </button>
      </div>
    </form>
  )
}
