"use client"

import { useState, useRef, useEffect } from "react"
import { updateUserPasswordAction } from "@/actions/users"
import { hashPassword, generateSalt } from "@/auth/passwordHasher"

interface EditablePasswordProps {
  userId: number
  userName: string
}

export function EditablePassword({ userId }: EditablePasswordProps) {
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
      setError("Min 8 characters")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    setIsUpdating(true)
    setError(null)

    try {
      const salt = generateSalt()
      const hashedPassword = await hashPassword(password, salt)
      await updateUserPasswordAction(userId, hashedPassword, salt)
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

  if (isEditing) {
    return (
      <div className="admin-inline-edit">
        <input
          ref={inputRef}
          type="password"
          name="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(null) }}
          onKeyDown={handleKeyDown}
          disabled={isUpdating}
          className="admin-inline-input"
          placeholder="New password..."
          style={{ opacity: isUpdating ? 0.5 : 1 }}
        />
        <input
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); setError(null) }}
          onKeyDown={handleKeyDown}
          disabled={isUpdating}
          className="admin-inline-input"
          placeholder="Confirm..."
          style={{ opacity: isUpdating ? 0.5 : 1 }}
        />
        {error && <div className="admin-inline-error">{error}</div>}
        <div className="admin-inline-actions">
          <button
            type="button"
            onClick={handleSave}
            disabled={isUpdating || !password || !confirmPassword}
            className="btn btn-primary btn-sm"
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
      className="admin-pw-btn"
      onClick={() => setIsEditing(true)}
      title="Click to change password"
    >
      Change
    </button>
  )
}
