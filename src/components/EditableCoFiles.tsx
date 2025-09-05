"use client"

import { useState, useRef, useEffect } from "react"
import { updateProjectCoFilesAction } from "@/actions/projects"

interface EditableCoFilesProps {
  projectId: number
  initialCoFiles: string
  title: string
  client: string
  body: string
  apfo: Date | null
  mbaNumber: string
  dldReviewer: string
  userId: number
}

export function EditableCoFiles({ 
  projectId, 
  initialCoFiles, 
  title,
  client,
  body,
  apfo,
  mbaNumber,
  dldReviewer,
  userId 
}: EditableCoFilesProps) {
  
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [coFiles, setCoFiles] = useState(initialCoFiles)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  async function handleSave() {
    if (coFiles === initialCoFiles) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    
    try {
      await updateProjectCoFilesAction(projectId, {
        title,
        client,
        body,
        apfo,
        mbaNumber,
        coFileNumbers: coFiles,
        dldReviewer,
        userId
      })
      
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update Co File #&apos;s:', error)
      setCoFiles(initialCoFiles)
      alert('Failed to update Co File #&apos;s. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setCoFiles(initialCoFiles)
      setIsEditing(false)
    } else if (e.key === 'Enter') {
      handleSave()
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCoFiles(e.target.value)
  }

  if (isEditing) {
    return (
      <div className="co-files-edit-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={coFiles}
          onChange={handleInputChange}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isUpdating}
          className="co-files-edit-input"
          placeholder="Enter Co File #&apos;s..."
          style={{ opacity: isUpdating ? 0.5 : 1 }}
        />
        <div className="co-files-edit-hint">
          {isUpdating ? "Saving..." : "Press Enter to save, Esc to cancel"}
        </div>
      </div>
    )
  }

  return (
    <div 
      className="co-files-text editable-co-files"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {coFiles || <span className="co-files-placeholder">Click to add Co File #&apos;s</span>}
    </div>
  )
}
