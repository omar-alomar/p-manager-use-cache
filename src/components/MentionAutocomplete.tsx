"use client"

import { useState, useEffect, useRef } from "react"
import { getUsersAction } from "@/actions/users"

interface User {
  id: number
  name: string
  email: string
}

interface MentionAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  rows?: number
  disabled?: boolean
}

export function MentionAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Add a comment...", 
  className = "",
  rows = 3,
  disabled = false
}: MentionAutocompleteProps) {
  const [users, setUsers] = useState<User[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [cursorPosition, setCursorPosition] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Load users on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userList = await getUsersAction()
        setUsers(userList)
      } catch (error) {
        console.error("Error loading users:", error)
      }
    }
    loadUsers()
  }, [])

  // Handle text change and detect @ mentions
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart || 0
    setCursorPosition(cursorPos)
    onChange(newValue)

    // Check if we're typing after an @ symbol
    const textBeforeCursor = newValue.substring(0, cursorPos)
    const atMatch = textBeforeCursor.match(/@(\w*\s*\w*)$/)
    
    if (atMatch) {
      const query = atMatch[1].toLowerCase().trim()
      const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(query) && 
        user.name.toLowerCase() !== query
      )
      setSuggestions(filteredUsers)
      setShowSuggestions(filteredUsers.length > 0)
      setSelectedIndex(0)
    } else {
      setShowSuggestions(false)
    }
  }

  // Handle key navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        if (suggestions[selectedIndex]) {
          insertMention(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  // Insert mention into text
  const insertMention = (user: User) => {
    if (!textareaRef.current) return

    const textBeforeCursor = value.substring(0, cursorPosition)
    const textAfterCursor = value.substring(cursorPosition)
    const atMatch = textBeforeCursor.match(/@(\w*\s*\w*)$/)
    
    if (atMatch) {
      const beforeAt = textBeforeCursor.substring(0, atMatch.index)
      const newText = beforeAt + `@${user.name} ` + textAfterCursor
      onChange(newText)
      
      // Set cursor position after the mention
      const newCursorPos = beforeAt.length + user.name.length + 2
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
          textareaRef.current.focus()
        }
      }, 0)
    }
    
    setShowSuggestions(false)
  }

  // Handle suggestion click
  const handleSuggestionClick = (user: User) => {
    insertMention(user)
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="mention-autocomplete-container" ref={suggestionsRef}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`form-textarea ${className}`}
        rows={rows}
        disabled={disabled}
        required
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="mention-suggestions">
          {suggestions.map((user, index) => (
            <div
              key={user.id}
              className={`mention-suggestion ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSuggestionClick(user)}
            >
              <div className="suggestion-avatar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className="suggestion-info">
                <div className="suggestion-name">{user.name}</div>
                <div className="suggestion-email">{user.email}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
