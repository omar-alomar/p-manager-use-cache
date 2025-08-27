"use client"

import { useState, useRef, useEffect } from "react"
import { updateProjectDldReviewerAction } from "@/actions/projects"

interface EditableDldReviewerProps {
  projectId: number
  initialDldReviewer: string
  title: string
  client: string
  body: string
  apfo: string
  coFileNumbers: string
  userId: number
}

export function EditableDldReviewer({ 
  projectId, 
  initialDldReviewer, 
  title,
  client,
  body,
  apfo,
  coFileNumbers,
  userId 
}: EditableDldReviewerProps) {
  
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [dldReviewer, setDldReviewer] = useState(initialDldReviewer)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  async function handleSave() {
    if (dldReviewer === initialDldReviewer) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    
    try {
      await updateProjectDldReviewerAction(projectId, {
        title,
        client,
        body,
        apfo,
        coFileNumbers,
        dldReviewer,
        userId
      })
      
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update DLD reviewer:', error)
      setDldReviewer(initialDldReviewer)
      alert('Failed to update DLD reviewer. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setDldReviewer(initialDldReviewer)
      setIsEditing(false)
    } else if (e.key === 'Enter') {
      handleSave()
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDldReviewer(e.target.value)
  }

  if (isEditing) {
    return (
      <div className="dld-reviewer-edit-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={dldReviewer}
          onChange={handleInputChange}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isUpdating}
          className="dld-reviewer-edit-input"
          placeholder="Enter DLD reviewer..."
          style={{ opacity: isUpdating ? 0.5 : 1 }}
        />
        <div className="dld-reviewer-edit-hint">
          {isUpdating ? "Saving..." : "Press Enter to save, Esc to cancel"}
        </div>
      </div>
    )
  }

  return (
    <div 
      className="dld-reviewer-text editable-dld-reviewer"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {dldReviewer || <span className="dld-reviewer-placeholder">Click to add DLD reviewer</span>}
    </div>
  )
}
