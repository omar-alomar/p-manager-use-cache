"use client"

import { useState, useRef, useEffect } from "react"
import { updateUserEmailAction } from "@/actions/users"

interface EditableEmailProps {
  userId: number
  initialEmail: string
  userName: string
}

export function EditableEmail({ userId, initialEmail }: EditableEmailProps) {
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

  if (isEditing) {
    return (
      <div className="admin-inline-edit">
        <input
          ref={inputRef}
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null) }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isUpdating}
          className="admin-inline-input"
          placeholder="Enter email..."
          style={{ opacity: isUpdating ? 0.5 : 1 }}
        />
        {error && <div className="admin-inline-error">{error}</div>}
      </div>
    )
  }

  return (
    <span
      className="admin-inline-text"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {email}
    </span>
  )
}
