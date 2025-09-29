"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"

interface SearchableSelectOption {
  value: string | number
  label: string
  color?: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string | number | undefined
  onChange: (value: string | number | undefined) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  name?: string
  id?: string
  className?: string
  errorMessage?: string
  noResultsText?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  disabled = false,
  required = false,
  name,
  id,
  className = "",
  errorMessage,
  noResultsText = "No results found"
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isTyping, setIsTyping] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const [isMounted, setIsMounted] = useState(false)
  const [opensAbove, setOpensAbove] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Get the selected option
  const selectedOption = options.find(option => option.value === value)

  // Set mounted state on client side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Calculate dropdown position
  const calculatePosition = () => {
    if (!triggerRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    
    // Calculate if dropdown should open above or below
    const spaceBelow = viewportHeight - triggerRect.bottom
    const spaceAbove = triggerRect.top
    const openBelow = spaceBelow > 200 || spaceBelow > spaceAbove
    
    // Small gap for visual connection
    const gap = 2
    
    const top = openBelow 
      ? triggerRect.bottom + window.scrollY + gap
      : triggerRect.top + window.scrollY - 200 - gap // Max height is 200px
    
    const left = Math.max(0, Math.min(
      triggerRect.left + window.scrollX,
      viewportWidth - triggerRect.width + window.scrollX
    ))
    
    setOpensAbove(!openBelow)
    setDropdownPosition({
      top,
      left,
      width: triggerRect.width
    })
  }

  // Filter options based on search term (case-insensitive, partial match)
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options
    
    const searchLower = searchTerm.toLowerCase()
    return options.filter(option => 
      option.label.toLowerCase().includes(searchLower)
    )
  }, [options, searchTerm])

  // Reset highlighted index when filtered options change and set first option as default
  useEffect(() => {
    if (filteredOptions.length > 0) {
      setHighlightedIndex(0) // Highlight first option by default
    } else {
      setHighlightedIndex(-1)
    }
  }, [filteredOptions])

  // Handle opening/closing dropdown
  const toggleDropdown = () => {
    if (disabled) return
    if (isOpen) {
      // Close dropdown
      setIsOpen(false)
      setSearchTerm("")
      setIsTyping(false)
      setHighlightedIndex(-1)
    } else {
      // Open dropdown
      calculatePosition()
      setIsOpen(true)
    }
  }

  // Handle option selection
  const selectOption = (option: SearchableSelectOption) => {
    onChange(option.value)
    setIsOpen(false)
    setSearchTerm("")
    setIsTyping(false)
    setHighlightedIndex(-1)
  }

  // Handle typing for search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // If typing mode is active, handle search
    if (isTyping) {
      if (e.key === 'Backspace') {
        setSearchTerm(prev => prev.slice(0, -1))
        return
      }
      if (e.key === 'Escape') {
        setIsTyping(false)
        setSearchTerm("")
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          selectOption(filteredOptions[highlightedIndex])
        } else if (filteredOptions.length > 0) {
          // Select the first option if available
          selectOption(filteredOptions[0])
        }
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        return
      }
      // Handle regular character input
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setSearchTerm(prev => prev + e.key)
        return
      }
    }

    // If not in typing mode, handle normal navigation
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        calculatePosition()
        setIsOpen(true)
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        // Start typing mode
        e.preventDefault()
        setIsTyping(true)
        setSearchTerm(e.key)
        calculatePosition()
        setIsOpen(true)
      }
      return
    }

    // Handle navigation when dropdown is open but not typing
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          selectOption(filteredOptions[highlightedIndex])
        } else if (filteredOptions.length > 0) {
          // If no option is highlighted but there are options, select the first one
          selectOption(filteredOptions[0])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchTerm("")
        setIsTyping(false)
        setHighlightedIndex(-1)
        break
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          // Start typing mode
          e.preventDefault()
          setIsTyping(true)
          setSearchTerm(e.key)
        }
        break
    }
  }

  // Clear search term when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("")
      setIsTyping(false)
    }
  }, [isOpen])

  // Handle clicking outside to close and window resize
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isClickOnTrigger = triggerRef.current?.contains(target)
      const isClickOnDropdown = dropdownRef.current?.contains(target)
      
      if (!isClickOnTrigger && !isClickOnDropdown) {
        setIsOpen(false)
        setSearchTerm("")
        setIsTyping(false)
        setHighlightedIndex(-1)
      }
    }

    const handleResize = () => {
      if (isOpen) {
        calculatePosition()
      }
    }

    const handleScroll = () => {
      if (isOpen) {
        calculatePosition()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen])

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [highlightedIndex])

  return (
    <div className={`searchable-select ${className}`} ref={dropdownRef}>
      <div
        ref={triggerRef}
        className={`searchable-select__trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''} ${errorMessage ? 'error' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          toggleDropdown()
        }}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        aria-required={required}
      >
        <span className="searchable-select__value">
          {isTyping ? (
            <span className="searchable-select__search-display">
              {searchTerm}
              <span className="searchable-select__cursor">|</span>
            </span>
          ) : selectedOption ? (
            selectedOption.color && selectedOption.label.startsWith('⚠') ? (
              <>
                <span style={{ color: selectedOption.color }}>⚠</span>
                <span>{selectedOption.label.slice(1)}</span>
              </>
            ) : (
              selectedOption.label
            )
          ) : (
            placeholder
          )}
        </span>
        <svg 
          className={`searchable-select__arrow ${isOpen ? 'open' : ''}`}
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </div>

      {isOpen && isMounted && createPortal(
        <div 
          ref={dropdownRef}
          className={`searchable-select__dropdown ${opensAbove ? 'opens-above' : 'opens-below'}`}
          style={{
            position: 'absolute',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 10003
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ul 
            ref={listRef}
            className="searchable-select__options"
            role="listbox"
            id={`${id}-listbox`}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  className={`searchable-select__option ${index === highlightedIndex ? 'highlighted' : ''} ${option.value === value ? 'selected' : ''}`}
                  onClick={() => selectOption(option)}
                  role="option"
                  aria-selected={option.value === value}
                  style={option.color ? { '--option-color': option.color } as React.CSSProperties : undefined}
                >
                  {option.color && option.label.startsWith('⚠') ? (
                    <>
                      <span style={{ color: option.color }}>⚠</span>
                      <span className="searchable-select__option-text">{option.label.slice(1)}</span>
                    </>
                  ) : (
                    option.label
                  )}
                </li>
              ))
            ) : (
              <li className="searchable-select__option searchable-select__option--no-results">
                {noResultsText}
              </li>
            )}
          </ul>
        </div>,
        document.body
      )}

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={value || ''}
        required={required}
      />

      {errorMessage && (
        <div className="form-error">
          {errorMessage}
        </div>
      )}
    </div>
  )
}
