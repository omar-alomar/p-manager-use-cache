"use client"

import { useTaskFilter } from "@/contexts/TaskFilterContext"
import { SearchableSelect } from "./SearchableSelect"

type FilterType = 'all' | 'in_progress' | 'completed'
type SortType = 'created' | 'title'

interface TaskFiltersProps {
  taskCounts?: {
    all: number
    inProgress: number
    completed: number
  }
  users?: { id: number; name: string }[]
  projects?: { id: number; title: string }[]
  context?: 'all-tasks' | 'my-tasks'
}

export function TaskFilters({ taskCounts, users, projects, context = 'all-tasks' }: TaskFiltersProps) {
  const { filter, setFilter, sort, setSort, search, setSearch, userFilter, setUserFilter, projectFilter, setProjectFilter } = useTaskFilter()

  const filterOptions = [
    { value: 'all', label: 'All Tasks', count: taskCounts?.all || 0 },
    { value: 'in_progress', label: 'In Progress', count: taskCounts?.inProgress || 0 },
    { value: 'completed', label: 'Completed', count: taskCounts?.completed || 0 }
  ]

  const sortOptions = [
    { value: 'created', label: 'Created' },
    { value: 'title', label: 'Title' }
  ]

  return (
    <div className={`task-filters task-filters--${context}`}>
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

      {context !== 'my-tasks' && (
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
      )}

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

      {projects && projects.length > 0 && (
        <div className="filter-group filter-group--row">
          <div className="filter-controls">
            <label htmlFor="project-filter">Filter by project:</label>
            <SearchableSelect
              options={[
                { value: '', label: 'All Projects' },
                ...projects.map(project => ({ value: project.id, label: project.title }))
              ]}
              value={projectFilter || ''}
              onChange={(value) => setProjectFilter(value ? Number(value) : null)}
              placeholder="All Projects"
              id="project-filter"
              noResultsText="No projects found"
            />
          </div>
        </div>
      )}
    </div>
  )
}
