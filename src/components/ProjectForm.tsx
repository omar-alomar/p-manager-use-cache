"use client"

import React, { useState } from "react"
import { FormGroup } from "./FormGroup"
import { Suspense, useActionState } from "react"
import Link from "next/link"
import { SkeletonInput } from "./Skeleton"
import { createProjectAction, editProjectAction } from "@/actions/projects"
import { ClientModal } from "./ClientModal"
import { SearchableSelect } from "./SearchableSelect"

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
  milestone: Date | null
  mbaNumber: string
  coFileNumbers: string
  dldReviewer: string
  userId: number
  milestones?: { id: number; date: Date; item: string; completed?: boolean }[]
  }
}) {
  const action =
    project == null ? createProjectAction : editProjectAction.bind(null, project.id)
  const [state, formAction, pending] = useActionState(action, {})
  const [showClientModal, setShowClientModal] = useState(false)
  const [clientsList, setClientsList] = useState(clients)
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(project?.clientId || undefined)
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(project?.userId)
  const [milestoneEntries, setMilestoneEntries] = useState<{ date: string; item: string }[]>(
    project?.milestones?.map(milestone => ({
      date: milestone.date.toISOString().split('T')[0],
      item: milestone.item
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
    setSelectedClientId(newClient.id)
    setShowClientModal(false)
  }

  // Handle milestone entry management
  const addMilestoneEntry = () => {
    setMilestoneEntries(prev => [...prev, { date: '', item: '' }])
  }

  const removeMilestoneEntry = (index: number) => {
    setMilestoneEntries(prev => prev.filter((_, i) => i !== index))
  }

  const updateMilestoneEntry = (index: number, field: 'date' | 'item', value: string) => {
    setMilestoneEntries(prev => prev.map((entry, i) => 
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
            <SearchableSelect
              options={clientsList.map(client => ({ value: client.id, label: client.name }))}
              value={selectedClientId}
              onChange={(value) => setSelectedClientId(typeof value === 'string' ? Number(value) : value)}
              placeholder="Select a client..."
              name="clientId"
              id="clientId"
              required
              noResultsText="No clients found"
            />
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
          <SearchableSelect
            options={users.map(user => ({ value: user.id, label: user.name }))}
            value={selectedUserId}
            onChange={(value) => setSelectedUserId(typeof value === 'string' ? Number(value) : value)}
            placeholder="Select a project manager..."
            name="userId"
            id="userId"
            required
            noResultsText="No project managers found"
          />
        </FormGroup>
        <div className="milestone-section">
          <label>Milestones (Optional)</label>
          <div className="milestone-entries">
            {milestoneEntries.length === 0 ? (
              <div className="milestone-empty-state">
                <p>No milestones added. Click &quot;Add Milestone&quot; to add one, or leave empty if not needed.</p>
              </div>
            ) : (
              milestoneEntries.map((entry, index) => (
              <div key={index} className="milestone-entry">
                <div className="milestone-entry-fields">
                  <FormGroup>
                    <label htmlFor={`milestoneDate_${index}`}>Date</label>
                    <input
                      type="date"
                      name={`milestoneDate_${index}`}
                      id={`milestoneDate_${index}`}
                      value={entry.date}
                      onChange={(e) => updateMilestoneEntry(index, 'date', e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <label htmlFor={`milestoneItem_${index}`}>Item</label>
                    <input
                      type="text"
                      name={`milestoneItem_${index}`}
                      id={`milestoneItem_${index}`}
                      placeholder="e.g., Preliminary Site Plan"
                      value={entry.item}
                      onChange={(e) => updateMilestoneEntry(index, 'item', e.target.value)}
                    />
                  </FormGroup>
                  <button
                    type="button"
                    className="btn-remove-milestone"
                    onClick={() => removeMilestoneEntry(index)}
                    title="Remove milestone entry"
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
              className="btn-add-milestone"
              onClick={addMilestoneEntry}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Milestone
            </button>
          </div>
          {'milestone' in state && state.milestone && (
            <div className="error-message">{state.milestone}</div>
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
          <label htmlFor="milestone">Milestone</label>
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
