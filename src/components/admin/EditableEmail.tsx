"use client"

import { useState, useRef, useEffect } from "react"
import { updateUserEmailAction } from "@/actions/users"

interface EditableEmailProps {
  userId: number
  initialEmail: string
  userName: string
}

export function EditableEmail({ userId, initialEmail, userName }: EditableEmailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  async function handleSave() {
    if (email === initialEmail) {
      setIsEditing(false)
      setError(null)
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Invalid email format")
      return
    }

    setIsUpdating(true)
    setError(null)
    
    try {
      await updateUserEmailAction(userId, email)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update email:', error)
      setError(error instanceof Error ? error.message : 'Failed to update email')
      setEmail(initialEmail)
    } finally {
      setIsUpdating(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setEmail(initialEmail)
      setIsEditing(false)
      setError(null)
    } else if (e.key === 'Enter') {
      handleSave()
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value)
    setError(null)
  }

  if (isEditing) {
    return (
      <div className="editable-email-wrapper">
        <input
          ref={inputRef}
          type="email"
          value={email}
          onChange={handleInputChange}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isUpdating}
          className="editable-email-input"
          placeholder="Enter email..."
          style={{ opacity: isUpdating ? 0.5 : 1 }}
        />
        {error && (
          <div className="editable-email-error">
            {error}
          </div>
        )}
        <div className="editable-email-hint">
          {isUpdating ? "Saving..." : "Press Enter to save, Esc to cancel"}
        </div>
      </div>
    )
  }

  return (
    <div 
      className="editable-email-text"
      onClick={() => setIsEditing(true)}
      title="Click to edit email"
    >
      {email || <span className="editable-email-placeholder">Click to add email</span>}
    </div>
  )
}







