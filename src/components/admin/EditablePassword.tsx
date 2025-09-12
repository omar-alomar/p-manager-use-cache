"use client"

import { useState, useRef, useEffect } from "react"
import { updateUserPasswordAction } from "@/actions/users"

interface EditablePasswordProps {
  userId: number
  userName: string
}

export function EditablePassword({ userId, userName }: EditablePasswordProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  async function handleSave() {
    if (!password) {
      setError("Password is required")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsUpdating(true)
    setError(null)
    
    try {
      await updateUserPasswordAction(userId, password)
      setIsEditing(false)
      setPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error('Failed to update password:', error)
      setError(error instanceof Error ? error.message : 'Failed to update password')
    } finally {
      setIsUpdating(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setPassword("")
      setConfirmPassword("")
      setIsEditing(false)
      setError(null)
    } else if (e.key === 'Enter') {
      handleSave()
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    if (name === 'password') {
      setPassword(value)
    } else {
      setConfirmPassword(value)
    }
    setError(null)
  }

  if (isEditing) {
    return (
      <div className="editable-password-wrapper">
        <input
          ref={inputRef}
          type="password"
          name="password"
          value={password}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isUpdating}
          className="editable-password-input"
          placeholder="Enter new password..."
          style={{ opacity: isUpdating ? 0.5 : 1 }}
        />
        <input
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isUpdating}
          className="editable-password-input"
          placeholder="Confirm new password..."
          style={{ opacity: isUpdating ? 0.5 : 1 }}
        />
        {error && (
          <div className="editable-password-error">
            {error}
          </div>
        )}
        <div className="editable-password-actions">
          <button
            type="button"
            onClick={handleSave}
            disabled={isUpdating || !password || !confirmPassword}
            className="btn btn-sm"
          >
            {isUpdating ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPassword("")
              setConfirmPassword("")
              setIsEditing(false)
              setError(null)
            }}
            disabled={isUpdating}
            className="btn btn-outline btn-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button 
      className="editable-password-button"
      onClick={() => setIsEditing(true)}
      title="Click to change password"
    >
      Change Password
    </button>
  )
}


