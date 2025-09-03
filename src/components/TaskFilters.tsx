"use client"

import { useState } from "react"

type FilterType = 'all' | 'in_progress' | 'completed'
type SortType = 'created' | 'title'

export function TaskFilters() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('created')
  const [search, setSearch] = useState('')

  const filterOptions = [
    { value: 'all', label: 'All Tasks', count: 0 },
    { value: 'in_progress', label: 'In Progress', count: 0 },
    { value: 'completed', label: 'Completed', count: 0 }
  ]

  const sortOptions = [
    { value: 'created', label: 'Created' },
    { value: 'title', label: 'Title' }
  ]

  return (
    <div className="task-filters">
      <div className="filter-group">
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-tabs">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value as FilterType)}
              className={`filter-tab ${filter === option.value ? 'active' : ''}`}
            >
              {option.label}
              {option.count > 0 && (
                <span className="filter-count">{option.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <div className="sort-controls">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="sort-select"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
