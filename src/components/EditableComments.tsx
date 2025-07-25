"use client"

import { useState, useRef, useEffect } from "react"
import { updateProjectCommentsAction } from "@/actions/projects"

interface EditableCommentsProps {
  projectId: number
  initialComments: string
  title: string
  client: string
  apfo: string
  userId: number
}

export function EditableComments({ 
  projectId, 
  initialComments, 
  title,
  client,
  apfo,
  userId 
}: EditableCommentsProps) {
  const [comments, setComments] = useState(initialComments)
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
      // Auto-resize textarea to fit content
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [isEditing])

  async function handleSave() {
    if (comments === initialComments) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    
    try {
      await updateProjectCommentsAction(projectId, {
        title,
        client,
        body: comments,
        apfo,
        userId
      })
      
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update comments:', error)
      setComments(initialComments)
      alert('Failed to update comments. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setComments(initialComments)
      setIsEditing(false)
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave()
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setComments(e.target.value)
    // Auto-resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  if (isEditing) {
    return (
      <div className="comments-edit-wrapper">
        <textarea
          ref={textareaRef}
          value={comments}
          onChange={handleTextareaChange}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isUpdating}
          className="comments-edit-textarea"
          placeholder="Add comments..."
          style={{ opacity: isUpdating ? 0.5 : 1 }}
        />
        <div className="comments-edit-hint">
          Press Ctrl+Enter to save, Esc to cancel
        </div>
      </div>
    )
  }

  return (
    <div 
      className="comments-text editable-comments"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {comments || <span className="comments-placeholder">Click to add comments</span>}
    </div>
  )
}