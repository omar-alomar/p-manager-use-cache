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
  apfos?: { id: number; date: Date; item: string }[]
  }
}) {
  const action =
    project == null ? createProjectAction : editProjectAction.bind(null, project.id)
  const [state, formAction, pending] = useActionState(action, {})
  const [showClientModal, setShowClientModal] = useState(false)
  const [clientsList, setClientsList] = useState(clients)
  const [apfoEntries, setApfoEntries] = useState<{ date: string; item: string }[]>(
    project?.apfos?.map(apfo => ({
      date: apfo.date.toISOString().split('T')[0],
      item: apfo.item
    })) || []
  )
  
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

  // Handle APFO entry management
  const addApfoEntry = () => {
    setApfoEntries(prev => [...prev, { date: '', item: '' }])
  }

  const removeApfoEntry = (index: number) => {
    setApfoEntries(prev => prev.filter((_, i) => i !== index))
  }

  const updateApfoEntry = (index: number, field: 'date' | 'item', value: string) => {
    setApfoEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ))
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
        <div className="apfo-section">
          <label>APFO Entries (Optional)</label>
          <div className="apfo-entries">
            {apfoEntries.length === 0 ? (
              <div className="apfo-empty-state">
                <p>No APFO entries added. Click &quot;Add APFO Entry&quot; to add one, or leave empty if not needed.</p>
              </div>
            ) : (
              apfoEntries.map((entry, index) => (
              <div key={index} className="apfo-entry">
                <div className="apfo-entry-fields">
                  <FormGroup>
                    <label htmlFor={`apfoDate_${index}`}>Date</label>
                    <input
                      type="date"
                      name={`apfoDate_${index}`}
                      id={`apfoDate_${index}`}
                      value={entry.date}
                      onChange={(e) => updateApfoEntry(index, 'date', e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <label htmlFor={`apfoItem_${index}`}>Item</label>
                    <input
                      type="text"
                      name={`apfoItem_${index}`}
                      id={`apfoItem_${index}`}
                      placeholder="e.g., Preliminary Site Plan"
                      value={entry.item}
                      onChange={(e) => updateApfoEntry(index, 'item', e.target.value)}
                    />
                  </FormGroup>
                  <button
                    type="button"
                    className="btn-remove-apfo"
                    onClick={() => removeApfoEntry(index)}
                    title="Remove APFO entry"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
              ))
            )}
            <button
              type="button"
              className="btn-add-apfo"
              onClick={addApfoEntry}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add APFO Entry
            </button>
          </div>
          {'apfo' in state && state.apfo && (
            <div className="error-message">{state.apfo}</div>
          )}
        </div>
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
