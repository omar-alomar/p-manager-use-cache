"use client"

import React, { useState, useActionState } from "react"
import { createUserAction } from "@/actions/users"
import { Role } from "@prisma/client"

interface UserModalProps {
  onClose: () => void
  onUserCreated: () => void
}

export function UserModal({ onClose, onUserCreated }: UserModalProps) {
  const [state, formAction, pending] = useActionState(createUserAction, null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as Role,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle successful user creation
  React.useEffect(() => {
    if (state?.success) {
      onUserCreated()
    }
  }, [state, onUserCreated])

  // Handle escape key to close modal
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add New User</h2>
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
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="Enter user name"
            />
            {state && 'name' in state && typeof state.name === 'string' && (
              <span className="error-message">{state.name}</span>
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
            {state && 'email' in state && typeof state.email === 'string' && (
              <span className="error-message">{state.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={8}
              className="form-input"
              placeholder="Enter password (min 8 characters)"
            />
            {state && 'password' in state && typeof state.password === 'string' && (
              <span className="error-message">{state.password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
              className="form-input"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {state && 'role' in state && typeof state.role === 'string' && (
              <span className="error-message">{state.role}</span>
            )}
          </div>

          {state && 'error' in state && typeof state.error === 'string' && (
            <div className="error-message" style={{ marginTop: '1rem' }}>
              {state.error}
            </div>
          )}

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
                "Create User"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
