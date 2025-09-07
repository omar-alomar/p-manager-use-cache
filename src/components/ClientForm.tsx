"use client"

import { useState, useEffect } from "react"
import { createClientAction, editClientAction } from "@/actions/clients"
import { useActionState } from "react"
import { useRouter } from "next/navigation"

export function ClientForm({ 
  initialData,
  clientId,
  isEdit = false,
  redirectTo = "/clients"
}: { 
  initialData?: {
    name: string
    email: string
    phone?: string
    address?: string
  }
  clientId?: number
  isEdit?: boolean
  redirectTo?: string
}) {
  const router = useRouter()
  const [state, formAction] = useActionState(
    isEdit && clientId ? 
      editClientAction.bind(null, clientId, null, redirectTo) :
      createClientAction,
    null
  )

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle redirect after successful form submission
  useEffect(() => {
    if (state?.success && state?.redirectTo) {
      router.push(state.redirectTo)
    }
  }, [state, router])

  return (
    <div className="form-wrapper">
      <form action={formAction} className="client-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Client Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`form-input ${state?.name ? 'error' : ''}`}
              placeholder="Enter client name"
              required
            />
            {state?.name && (
              <span className="error-message">{state.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`form-input ${state?.email ? 'error' : ''}`}
              placeholder="Enter email address"
              required
            />
            {state?.email && (
              <span className="error-message">{state.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`form-input ${state?.phone ? 'error' : ''}`}
              placeholder="Enter phone number"
            />
            {state?.phone && (
              <span className="error-message">{state.phone}</span>
            )}
          </div>

          <div className="form-group full-width">
            <label htmlFor="address" className="form-label">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className={`form-textarea ${state?.address ? 'error' : ''}`}
              placeholder="Enter full address"
              rows={3}
            />
            {state?.address && (
              <span className="error-message">{state.address}</span>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {isEdit ? 'Update Client' : 'Create Client'}
          </button>
          <a href={redirectTo} className="btn btn-secondary">
            Cancel
          </a>
        </div>

        {state?.success && (
          <div className="success-message">
            {state.message}
          </div>
        )}
      </form>
    </div>
  )
}
