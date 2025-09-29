"use client"

import { useState, useRef, useEffect } from "react"
import { updateProjectCommentsAction } from "@/actions/projects"

interface ScrollableOverviewProps {
  projectId: number
  initialComments: string
  title: string
  clientId: number | null
  body: string
  milestone: Date | null
  mbaNumber: string
  coFileNumbers: string
  dldReviewer: string
  userId: number
}

export function ScrollableOverview({ 
  projectId, 
  initialComments, 
  title,
  clientId,
  milestone,
  mbaNumber,
  coFileNumbers,
  dldReviewer,
  userId 
}: ScrollableOverviewProps) {
  const [comments, setComments] = useState(initialComments)
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Parse comments into individual items (split by newlines)
  const commentItems = comments ? comments.split('\n').filter(item => item.trim() !== '') : []
  
  // Show last 3 items by default, or all if showAll is true
  const displayItems = showAll ? commentItems : commentItems.slice(-3)
  const hasMoreItems = commentItems.length > 3

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
      // Auto-resize textarea to fit content
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [isEditing])

  // Auto-scroll to bottom when showing all items
  useEffect(() => {
    if (showAll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [showAll])

  async function handleSave() {
    if (comments === initialComments) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    
    try {
      await updateProjectCommentsAction(projectId, {
        title,
        clientId,
        body: comments,
        milestone,
        mbaNumber,
        coFileNumbers,
        dldReviewer,
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
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
    // Allow regular Enter to create new lines - don't prevent default
    // Save will happen on blur (clicking off) or Shift+Enter
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setComments(e.target.value)
    // Auto-resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  function toggleShowAll() {
    setShowAll(!showAll)
  }

  if (isEditing) {
    return (
      <div className="overview-edit-wrapper">
        <textarea
          ref={textareaRef}
          value={comments}
          onChange={handleTextareaChange}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isUpdating}
          className="overview-edit-textarea"
          placeholder="Add overview items (one per line)..."
          style={{ opacity: isUpdating ? 0.5 : 1 }}
        />
        <div className="overview-edit-hint">
          {isUpdating ? "Saving..." : "Shift+Enter to save, Esc to cancel"}
        </div>
      </div>
    )
  }

  if (commentItems.length === 0) {
    return (
      <div 
        className="overview-text editable-overview"
        onClick={() => setIsEditing(true)}
        title="Click to edit"
      >
        <span className="overview-placeholder">Click to add overview</span>
      </div>
    )
  }

  return (
    <div className="scrollable-overview-container">
      <div 
        className="overview-text editable-overview"
        onClick={() => setIsEditing(true)}
        title="Click to edit"
      >
        {hasMoreItems && (
          <div className="overview-toggle">
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleShowAll()
              }}
              className="overview-toggle-btn"
              title={showAll ? "Show last 3 items" : `Show all ${commentItems.length} items`}
            >
              {showAll ? '↓ Show less' : `↑ Show all (${commentItems.length})`}
            </button>
          </div>
        )}
        
        <div 
          ref={scrollContainerRef}
          className={`overview-items ${showAll ? 'show-all' : 'show-last-4'}`}
        >
          {displayItems.map((item, index) => (
            <div key={index} className="overview-item">
              {item.trim()}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
