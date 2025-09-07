"use client"

import React, { useState, useActionState } from "react"
import { createClientAction } from "@/actions/clients"

interface ClientModalProps {
  onClose: () => void
  onClientCreated: (client: { id: number; name: string; email: string }) => void
}

export function ClientModal({ onClose, onClientCreated }: ClientModalProps) {
  const [state, formAction, pending] = useActionState(createClientAction, null)
  const [formData, setFormData] = useState({
    name: "",
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

  // Handle successful client creation
  React.useEffect(() => {
    if (state?.success && state?.client) {
      onClientCreated({
        id: state.client.id,
        name: state.client.name,
        email: state.client.email
      })
    }
  }, [state, onClientCreated])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Client</h2>
          <button 
            className="modal-close-btn" 
            onClick={onClose}
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <form action={formAction} className="modal-form">
          <div className="form-group">
            <label htmlFor="name">Client Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="Enter client name"
            />
            {state?.errors?.name && (
              <span className="error-message">{state.errors.name}</span>
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
              className="form-input"
              placeholder="Enter email address"
            />
            {state?.errors?.email && (
              <span className="error-message">{state.errors.email}</span>
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
              className="form-input"
              placeholder="Enter phone number"
            />
            {state?.errors?.phone && (
              <span className="error-message">{state.errors.phone}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder="Enter address"
              rows={3}
            />
            {state?.errors?.address && (
              <span className="error-message">{state.errors.address}</span>
            )}
          </div>

          <div className="modal-actions">
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
  )
}
