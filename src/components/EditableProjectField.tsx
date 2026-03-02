"use client"

import { useState, useRef, useEffect } from "react"
import { updateProjectFieldAction } from "@/actions/projects"

interface EditableProjectFieldProps {
  projectId: number
  field: 'body' | 'mbaNumber' | 'coFileNumbers' | 'dldReviewer'
  initialValue: string
  placeholder?: string
  multiline?: boolean
  displayMode?: 'text' | 'comma-list' | 'scrollable-list'
}

export function EditableProjectField({
  projectId,
  field,
  initialValue,
  placeholder = "Click to edit",
  multiline = false,
  displayMode = 'text',
}: EditableProjectFieldProps) {
  const [value, setValue] = useState(initialValue)
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isEditing) {
      if (multiline && textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.select()
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
      } else if (!multiline && inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }
  }, [isEditing, multiline])

  // Auto-scroll to bottom when showing all items
  useEffect(() => {
    if (showAll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [showAll])

  async function handleSave() {
    if (value === initialValue) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)

    try {
      await updateProjectFieldAction(projectId, field, value)
      setIsEditing(false)
    } catch (error) {
      console.error(`Failed to update ${field}:`, error)
      setValue(initialValue)
      alert(`Failed to update. Please try again.`)
    } finally {
      setIsUpdating(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setValue(initialValue)
      setIsEditing(false)
    } else if (multiline) {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault()
        handleSave()
      }
    } else {
      if (e.key === 'Enter') {
        handleSave()
      }
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  // --- Editing mode ---
  if (isEditing) {
    if (multiline) {
      const wrapperClass = displayMode === 'scrollable-list' ? 'overview-edit-wrapper' : 'comments-edit-wrapper'
      const textareaClass = displayMode === 'scrollable-list' ? 'overview-edit-textarea' : 'comments-edit-textarea'
      const hintClass = displayMode === 'scrollable-list' ? 'overview-edit-hint' : 'comments-edit-hint'

      return (
        <div className={wrapperClass}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextareaChange}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isUpdating}
            className={textareaClass}
            placeholder={placeholder}
            style={{ opacity: isUpdating ? 0.5 : 1 }}
          />
          <div className={hintClass}>
            {isUpdating ? "Saving..." : "Shift+Enter to save, Esc to cancel"}
          </div>
        </div>
      )
    }

    // Single-line editing
    const editWrapperClass =
      field === 'mbaNumber' ? 'mba-number-edit-wrapper' :
      field === 'coFileNumbers' ? 'co-files-edit-wrapper' :
      field === 'dldReviewer' ? 'dld-reviewer-edit-wrapper' :
      'edit-wrapper'

    const editInputClass =
      field === 'mbaNumber' ? 'mba-number-edit-input' :
      field === 'coFileNumbers' ? 'co-files-edit-input' :
      field === 'dldReviewer' ? 'dld-reviewer-edit-input' :
      'edit-input'

    const editHintClass =
      field === 'mbaNumber' ? 'mba-number-edit-hint' :
      field === 'coFileNumbers' ? 'co-files-edit-hint' :
      field === 'dldReviewer' ? 'dld-reviewer-edit-hint' :
      'edit-hint'

    return (
      <div className={editWrapperClass}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isUpdating}
          className={editInputClass}
          placeholder={placeholder}
          style={{ opacity: isUpdating ? 0.5 : 1 }}
        />
        <div className={editHintClass}>
          {isUpdating ? "Saving..." : "Press Enter to save, Esc to cancel"}
        </div>
      </div>
    )
  }

  // --- Read-only display modes ---

  if (displayMode === 'comma-list') {
    const items = value ? value.split(',').map(num => num.trim()).filter(num => num) : []

    const containerClass =
      field === 'mbaNumber' ? 'mba-number-text editable-mba-number' :
      field === 'coFileNumbers' ? 'co-files-text editable-co-files' :
      'editable-field'

    const listClass =
      field === 'mbaNumber' ? 'mba-number-list' :
      field === 'coFileNumbers' ? 'co-files-list' :
      'field-list'

    const itemClass =
      field === 'mbaNumber' ? 'mba-number-item' :
      field === 'coFileNumbers' ? 'co-file-item' :
      'field-item'

    const placeholderClass =
      field === 'mbaNumber' ? 'mba-number-placeholder' :
      field === 'coFileNumbers' ? 'co-files-placeholder' :
      'field-placeholder'

    return (
      <div
        className={containerClass}
        onClick={() => setIsEditing(true)}
        title="Click to edit"
      >
        {value ? (
          <div className={listClass}>
            {items.map((item, index) => (
              <div key={index} className={itemClass}>
                {item}
              </div>
            ))}
          </div>
        ) : (
          <span className={placeholderClass}>{placeholder}</span>
        )}
      </div>
    )
  }

  if (displayMode === 'scrollable-list') {
    const commentItems = value ? value.split('\n').filter(item => item.trim() !== '') : []
    const displayItems = showAll ? commentItems : commentItems.slice(-3)
    const hasMoreItems = commentItems.length > 3

    if (commentItems.length === 0) {
      return (
        <div
          className="overview-text editable-overview"
          onClick={() => setIsEditing(true)}
          title="Click to edit"
        >
          <span className="overview-placeholder">{placeholder}</span>
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
                  setShowAll(!showAll)
                }}
                className="overview-toggle-btn"
                title={showAll ? "Show last 3 items" : `Show all ${commentItems.length} items`}
              >
                {showAll ? '\u2193 Show less' : `\u2191 Show all (${commentItems.length})`}
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

  // Default: 'text' display mode
  const textClass =
    field === 'dldReviewer' ? 'dld-reviewer-text editable-dld-reviewer' :
    'comments-text editable-comments'

  const textPlaceholderClass =
    field === 'dldReviewer' ? 'dld-reviewer-placeholder' :
    'comments-placeholder'

  return (
    <div
      className={textClass}
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {value || <span className={textPlaceholderClass}>{placeholder}</span>}
    </div>
  )
}
