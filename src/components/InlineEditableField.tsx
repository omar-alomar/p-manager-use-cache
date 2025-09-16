"use client"

import { useState, useRef, useEffect } from "react"
import { updateClientFieldAction } from "@/actions/clients"

interface InlineEditableFieldProps {
  clientId: number
  field: 'companyName' | 'address'
  value: string | null
  placeholder?: string
  className?: string
  multiline?: boolean
}

export function InlineEditableField({ 
  clientId, 
  field, 
  value, 
  placeholder = "Click to edit",
  className = "",
  multiline = false
}: InlineEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || "")
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (multiline) {
        inputRef.current.select()
      }
    }
  }, [isEditing, multiline])

  const handleClick = () => {
    if (!isLoading) {
      setIsEditing(true)
      setEditValue(value || "")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel()
    } else if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Enter' && e.shiftKey && multiline) {
      e.preventDefault()
      handleSave()
    }
  }

  const handleSave = async () => {
    if (editValue === (value || "")) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      const result = await updateClientFieldAction(clientId, field, editValue)
      if (result.success) {
        setIsEditing(false)
      } else {
        // Reset to original value on error
        setEditValue(value || "")
        alert(result.message)
      }
    } catch {
      setEditValue(value || "")
      alert("Failed to update field")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value || "")
    setIsEditing(false)
  }

  const handleBlur = () => {
    if (!isLoading) {
      handleSave()
    }
  }

  if (isEditing) {
    if (multiline) {
      return (
        <div className="inline-edit-container">
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={isLoading}
            placeholder={placeholder}
            className={`inline-edit-input ${className} ${isLoading ? 'loading' : ''}`}
            rows={2}
            style={{ 
              width: '100%',
              minHeight: '40px',
              resize: 'vertical'
            }}
          />
          <div className="inline-edit-hints">
            <span className="hint-text">
              Shift+Enter to save, Esc to cancel
            </span>
          </div>
        </div>
      )
    } else {
      return (
        <div className="inline-edit-container">
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={isLoading}
            placeholder={placeholder}
            className={`inline-edit-input ${className} ${isLoading ? 'loading' : ''}`}
            style={{ 
              width: '100%'
            }}
          />
          <div className="inline-edit-hints">
            <span className="hint-text">
              Enter to save, Esc to cancel
            </span>
          </div>
        </div>
      )
    }
  }

  // Process the value to ensure proper line breaks for display
  const displayValue = multiline && value ? 
    value.replace(/\r\n/g, '\n').replace(/\r/g, '\n') : value

  return (
    <span 
      className={`inline-edit-display ${className} ${!value ? 'empty' : ''}`}
      onClick={handleClick}
      title={multiline && value ? value : "Click to edit"}
      style={{ 
        cursor: 'pointer', 
        minHeight: '20px', 
        display: 'block',
        whiteSpace: multiline ? 'pre-line' : 'normal',
        wordWrap: 'break-word',
        overflowWrap: 'break-word'
      }}
    >
      {displayValue || (
        <span style={{ color: '#999', fontStyle: 'italic' }}>
          {placeholder}
        </span>
      )}
    </span>
  )
}
