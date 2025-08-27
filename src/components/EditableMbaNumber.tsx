"use client"

import { useState, useRef, useEffect } from "react"
import { updateProjectMbaNumberAction } from "@/actions/projects"

interface EditableMbaNumberProps {
  projectId: number
  initialMbaNumber: string
  title: string
  client: string
  body: string
  apfo: string
  coFileNumbers: string
  dldReviewer: string
  userId: number
}

export function EditableMbaNumber({ 
  projectId, 
  initialMbaNumber, 
  title,
  client,
  body,
  apfo,
  coFileNumbers,
  dldReviewer,
  userId 
}: EditableMbaNumberProps) {
  
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [mbaNumber, setMbaNumber] = useState(initialMbaNumber)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  async function handleSave() {
    if (mbaNumber === initialMbaNumber) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    
    try {
      await updateProjectMbaNumberAction(projectId, {
        title,
        client,
        body,
        apfo,
        mbaNumber,
        coFileNumbers,
        dldReviewer,
        userId
      })
      
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update MBA Number:', error)
      setMbaNumber(initialMbaNumber)
      alert('Failed to update MBA Number. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setMbaNumber(initialMbaNumber)
      setIsEditing(false)
    } else if (e.key === 'Enter') {
      handleSave()
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setMbaNumber(e.target.value)
  }

  if (isEditing) {
    return (
      <div className="mba-number-edit-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={mbaNumber}
          onChange={handleInputChange}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isUpdating}
          className="mba-number-edit-input"
          placeholder="Enter MBA #..."
          style={{ opacity: isUpdating ? 0.5 : 1 }}
        />
        <div className="mba-number-edit-hint">
          {isUpdating ? "Saving..." : "Press Enter to save, Esc to cancel"}
        </div>
      </div>
    )
  }

  return (
    <div 
      className="mba-number-text editable-mba-number"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {mbaNumber || <span className="mba-number-placeholder">Click to add MBA #</span>}
    </div>
  )
}
