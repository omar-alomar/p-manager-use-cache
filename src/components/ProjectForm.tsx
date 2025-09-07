"use client"

import React, { useState } from "react"
import { FormGroup } from "./FormGroup"
import { Suspense, useActionState } from "react"
import Link from "next/link"
import { SkeletonInput } from "./Skeleton"
import { createProjectAction, editProjectAction } from "@/actions/projects"
import { ClientModal } from "./ClientModal"

export function ProjectForm({
  users,
  clients,
  project,
}: {
  users: { id: number; name: string }[]
  clients: { id: number; name: string; email: string }[]
  project?: {
  id: number
  title: string
  client: string
  clientId: number | null
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
  const [showClientModal, setShowClientModal] = useState(false)
  const [clientsList, setClientsList] = useState(clients)
  
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

  // Handle new client creation
  const handleClientCreated = (newClient: { id: number; name: string; email: string }) => {
    setClientsList(prev => [...prev, newClient])
    setShowClientModal(false)
    // Optionally select the new client
    const select = document.getElementById('clientId') as HTMLSelectElement
    if (select) {
      select.value = newClient.id.toString()
    }
  }

  return (
    <>
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
        <FormGroup errorMessage={'clientId' in state ? state.clientId : undefined}>
          <label htmlFor="clientId">Client</label>
          <div className="client-select-container">
            <select
              required
              name="clientId"
              id="clientId"
              defaultValue={project?.clientId || ""}
            >
              <option value="">Select a client...</option>
              {clientsList.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="client-add-btn"
              onClick={() => setShowClientModal(true)}
              title="Add new client"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
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
    
    {showClientModal && (
      <ClientModal
        onClose={() => setShowClientModal(false)}
        onClientCreated={handleClientCreated}
      />
    )}
    </>
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
          <label htmlFor="clientId">Client</label>
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
