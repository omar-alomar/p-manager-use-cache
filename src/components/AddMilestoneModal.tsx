"use client"

import React, { useState, useActionState } from "react"
import { createPortal } from "react-dom"
import { addMilestoneAction } from "@/actions/projects"

interface AddMilestoneModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: number
}

export function AddMilestoneModal({ isOpen, onClose, projectId }: AddMilestoneModalProps) {
  const [state, formAction, pending] = useActionState(
    addMilestoneAction.bind(null, projectId),
    { errors: {} }
  )
  const [mounted, setMounted] = useState(false)

  // Handle successful form submission
  React.useEffect(() => {
    if (state && 'success' in state && state.success) {
      onClose()
    }
  }, [state, onClose])

  // Handle mounting for portal
  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Handle escape key to close modal
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="quick-add-modal" role="dialog" aria-labelledby="add-milestone-title">
        <div className="modal-header">
          <h3 id="add-milestone-title" className="modal-title">
            Add Milestone
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
          <div className="form-group">
            <label htmlFor="milestone-date">Date *</label>
            <input
              required
              type="date"
              name="date"
              id="milestone-date"
              className="form-input"
              autoFocus
            />
            {state && 'errors' in state && state.errors && 'date' in state.errors && state.errors.date && (
              <span className="error-message">{state.errors.date}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="milestone-item">Milestone Description *</label>
            <input
              required
              type="text"
              name="item"
              id="milestone-item"
              placeholder="Enter milestone description..."
              className="form-input"
            />
            {state && 'errors' in state && state.errors && 'item' in state.errors && state.errors.item && (
              <span className="error-message">{state.errors.item}</span>
            )}
          </div>

          {state && 'errors' in state && state.errors && 'general' in state.errors && state.errors.general && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              {state.errors.general}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={pending}
            >
              {pending ? "Adding..." : "Add Milestone"}
            </button>
          </div>
        </form>
      </div>
    </>
  )

  return createPortal(modalContent, document.body)
}
