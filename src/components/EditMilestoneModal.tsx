"use client"

import React, { useState, useActionState } from "react"
import { createPortal } from "react-dom"
import { updateMilestoneAction } from "@/actions/milestones"
import { getMilestoneColorClass } from "@/utils/milestoneUtils"

interface EditMilestoneModalProps {
  isOpen: boolean
  onClose: () => void
  milestoneId: number
  initialDate: string
  initialItem: string
}

export function EditMilestoneModal({ isOpen, onClose, milestoneId, initialDate, initialItem }: EditMilestoneModalProps) {
  const [state, formAction, pending] = useActionState(
    updateMilestoneAction.bind(null, milestoneId),
    { errors: {} }
  )
  const [mounted, setMounted] = useState(false)
  const [dateValue, setDateValue] = useState(initialDate)

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
          <h2 className="modal-title">Edit Milestone</h2>
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
                defaultValue={initialItem}
              />
              {state && 'errors' in state && state.errors && 'item' in state.errors && state.errors.item && (
                <span className="error-message">{state.errors.item}</span>
              )}
            </div>

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
                {pending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  )
}
