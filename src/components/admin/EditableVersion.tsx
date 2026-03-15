"use client"

import { useState, useRef, useEffect } from "react"
import { updateUserLastSeenVersionAction } from "@/actions/users"

interface EditableVersionProps {
  userId: number
  initialVersion: string | null
  currentAppVersion: string
}

export function EditableVersion({ userId, initialVersion, currentAppVersion }: EditableVersionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [version, setVersion] = useState(initialVersion || "")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  async function handleSave() {
    const newVersion = version.trim() || null
    if (newVersion === initialVersion) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    try {
      await updateUserLastSeenVersionAction(userId, newVersion)
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update version:", error)
      setVersion(initialVersion || "")
    } finally {
      setIsUpdating(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setVersion(initialVersion || "")
      setIsEditing(false)
    } else if (e.key === "Enter") {
      handleSave()
    }
  }

  const isCurrent = initialVersion === currentAppVersion

  if (isEditing) {
    return (
      <div className="admin-inline-edit">
        <input
          ref={inputRef}
          type="text"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isUpdating}
          className="admin-inline-input"
          placeholder="e.g. 1.1"
          style={{ opacity: isUpdating ? 0.5 : 1, width: 60 }}
        />
      </div>
    )
  }

  return (
    <span
      className="admin-inline-text"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
      style={{ color: isCurrent ? "var(--success-600)" : "var(--warning-600)" }}
    >
      {initialVersion || "—"}
    </span>
  )
}
