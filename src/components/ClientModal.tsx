"use client"

import React, { useState, useActionState } from "react"
import { createPortal } from "react-dom"
import { createClientAction } from "@/actions/clients"

interface ClientModalProps {
  onClose: () => void
  onClientCreated: (client: { id: number; name: string; email: string }) => void
}

export function ClientModal({ onClose, onClientCreated }: ClientModalProps) {
  const [state, formAction, pending] = useActionState(createClientAction, null)
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    address: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  React.useEffect(() => {
    if (state?.success && state?.client && typeof state.client === 'object') {
      onClientCreated({
        id: state.client.id,
        name: state.client.name,
        email: state.client.email
      })
    }
  }, [state, onClientCreated])

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return createPortal(
    <>
      <div className="drawer-backdrop drawer-nested" onClick={onClose} />
      <div className="drawer-panel drawer-nested">
        <div className="drawer-header">
          <h2 className="modal-title">Add New Client</h2>
          <button className="modal-close-btn" onClick={onClose} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="drawer-body">
          <form action={formAction} className="form">
            <div className="form-group">
              <label htmlFor="name">Client Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter client name"
                autoFocus
              />
              {state && 'name' in state && (
                <span className="error-message">{state.name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="companyName">Company Name</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Enter company name"
              />
              {state && 'companyName' in state && (
                <span className="error-message">{state.companyName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter email address"
              />
              {state && 'email' in state && (
                <span className="error-message">{state.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
              {state && 'phone' in state && (
                <span className="error-message">{state.phone}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter address"
                rows={3}
              />
              {state && 'address' in state && (
                <span className="error-message">{state.address}</span>
              )}
            </div>

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
                {pending ? (
                  <>
                    <span className="btn-spinner"></span>
                    Creating...
                  </>
                ) : (
                  "Create Client"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  )
}
