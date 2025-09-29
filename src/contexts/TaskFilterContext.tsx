"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export type FilterType = 'all' | 'in_progress' | 'completed'
export type SortType = 'created' | 'title' | 'urgency'
export type UrgencyFilterType = 'all' | 'low' | 'medium' | 'high' | 'critical'

interface TaskFilterContextType {
  filter: FilterType
  setFilter: (filter: FilterType) => void
  sort: SortType
  setSort: (sort: SortType) => void
  search: string
  setSearch: (search: string) => void
  userFilter: number | null
  setUserFilter: (userId: number | null) => void
  projectFilter: number | null
  setProjectFilter: (projectId: number | null) => void
  urgencyFilter: UrgencyFilterType
  setUrgencyFilter: (urgency: UrgencyFilterType) => void
}

const TaskFilterContext = createContext<TaskFilterContextType | undefined>(undefined)

export function TaskFilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('created')
  const [search, setSearch] = useState('')
  const [userFilter, setUserFilter] = useState<number | null>(null)
  const [projectFilter, setProjectFilter] = useState<number | null>(null)
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilterType>('all')

  return (
    <TaskFilterContext.Provider value={{
      filter,
      setFilter,
      sort,
      setSort,
      search,
      setSearch,
      userFilter,
      setUserFilter,
      projectFilter,
      setProjectFilter,
      urgencyFilter,
      setUrgencyFilter
    }}>
      {children}
    </TaskFilterContext.Provider>
  )
}

export function useTaskFilter() {
  const context = useContext(TaskFilterContext)
  if (context === undefined) {
    throw new Error('useTaskFilter must be used within a TaskFilterProvider')
  }
  return context
}
