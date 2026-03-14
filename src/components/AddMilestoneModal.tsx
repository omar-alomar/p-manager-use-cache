"use client"

import React, { useState, useActionState } from "react"
import { createPortal } from "react-dom"
import { addMilestoneAction } from "@/actions/projects"
import { getMilestoneColorClass } from "@/utils/milestoneUtils"

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
  const [dateValue, setDateValue] = useState('')

  React.useEffect(() => {
    if (state && 'success' in state && state.success) {
      onClose()
    }
  }, [state, onClose])

  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  React.useEffect(() => {
    if (!isOpen) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  const dateColorClass = dateValue ? getMilestoneColorClass(new Date(dateValue + 'T00:00:00')) : ''

  return createPortal(
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel">
        <div className="drawer-header">
          <h2 className="modal-title">Add Milestone</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="drawer-body">
          <form action={formAction} className={`form ${pending ? 'form-loading' : ''}`}>
            <div className="form-group">
              <label htmlFor="milestone-date">Date</label>
              <input
                required
                type="date"
                name="date"
                id="milestone-date"
                className={`milestone-date-input ${dateColorClass}`}
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                autoFocus
              />
              {state && 'errors' in state && state.errors && 'date' in state.errors && state.errors.date && (
                <span className="error-message">{state.errors.date}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="milestone-item">Description</label>
              <input
                required
                type="text"
                name="item"
                id="milestone-item"
                placeholder="Enter milestone description..."
              />
              {state && 'errors' in state && state.errors && 'item' in state.errors && state.errors.item && (
                <span className="error-message">{state.errors.item}</span>
              )}
            </div>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="apfo"
                className="apfo-checkbox"
              />
              <span className="apfo-label-text">APFO?</span>
            </label>

            {state && 'errors' in state && state.errors && 'general' in state.errors && state.errors.general && (
              <div className="error-message">{state.errors.general}</div>
            )}

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
                className="btn btn-primary"
                disabled={pending}
              >
                {pending ? "Adding..." : "Add Milestone"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  )
}
