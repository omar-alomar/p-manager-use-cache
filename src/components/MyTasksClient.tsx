"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import { Group, Panel, Separator } from "react-resizable-panels"
import type { GroupImperativeHandle } from "react-resizable-panels"
import { useTaskFilter } from "@/contexts/TaskFilterContext"
import { TaskFilters } from "./TaskFilters"
import { TaskList } from "./TaskList"
import { URGENCY_ORDER } from "@/constants/urgency"
import type { TaskWithRelations } from "@/types"

// Three-column resizable layout. Click headers to collapse/expand panels.
// All programmatic resizing uses groupRef.setLayout() for atomic updates.
// Visual collapse (hiding content, rotating chevron) is handled entirely by
// CSS container queries — no React state changes from panel sizing, which
// eliminates re-render conflicts with the library's drag state.
const DEFAULT_LAYOUT = { "in-progress": 33, "completed": 34, "assigned-by-me": 33 }
const PANEL_IDS = ["in-progress", "completed", "assigned-by-me"] as const
const COLLAPSE_THRESHOLD = 12 // % — used by toggleCollapse to detect collapsed panels
const COLLAPSED_SIZE = 5      // % — width of a collapsed panel
const MIN_PANEL_SIZE = 5      // % — absolute minimum the library enforces
const ARCHIVE_DAYS = 30       // Tasks completed more than this many days ago are archived

interface MyTasksClientProps {
  myTasks: TaskWithRelations[]
  assignedByMeTasks: TaskWithRelations[]
  users: { id: number; name: string }[]
  projects: { id: number; title: string }[]
  allProjects: { id: number; title: string }[]
}

function isTaskArchived(task: TaskWithRelations): boolean {
  if (!task.completed) return false
  // If completedAt is null and task is completed, treat as archived (pre-feature data)
  if (!task.completedAt) return true
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - ARCHIVE_DAYS)
  return new Date(task.completedAt) < cutoff
}

export function MyTasksClient({ myTasks, assignedByMeTasks, users, projects, allProjects }: MyTasksClientProps) {
  const { sort, search, projectFilter, urgencyFilter } = useTaskFilter()
  const [layoutDirty, setLayoutDirty] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const groupRef = useRef<GroupImperativeHandle | null>(null)
  const savedLayout = useRef<Record<string, number> | null>(null)
  const isProgrammatic = useRef(false)

  // Fires once after any layout change completes (drag end or setLayout).
  // Only tracks layoutDirty — visual collapse is CSS-only.
  const handleLayoutChanged = useCallback((layout: Record<string, number>) => {
    const dirty = Object.entries(DEFAULT_LAYOUT).some(([id, defaultPct]) =>
      Math.abs((layout[id] ?? defaultPct) - defaultPct) > 1
    )
    setLayoutDirty(prev => prev === dirty ? prev : dirty)

    if (!isProgrammatic.current) {
      savedLayout.current = null
    }
    isProgrammatic.current = false
  }, [])

  // Header click: collapse or expand by setting the entire layout at once
  const toggleCollapse = useCallback((id: string) => {
    const group = groupRef.current
    if (!group) return
    const layout = group.getLayout()
    isProgrammatic.current = true

    if ((layout[id] ?? 100) <= COLLAPSE_THRESHOLD) {
      const target = savedLayout.current ?? { ...DEFAULT_LAYOUT }
      savedLayout.current = null
      group.setLayout(target)
    } else {
      savedLayout.current = { ...layout }
      const freed = layout[id] - COLLAPSED_SIZE
      const others = PANEL_IDS.filter(p => p !== id)
      const othersTotal = others.reduce((sum, p) => sum + (layout[p] ?? 0), 0)

      const newLayout: Record<string, number> = { [id]: COLLAPSED_SIZE }
      for (const p of others) {
        newLayout[p] = (layout[p] ?? 0) + freed * ((layout[p] ?? 0) / othersTotal)
      }
      group.setLayout(newLayout)
    }
  }, [])

  const handleReset = useCallback(() => {
    isProgrammatic.current = true
    groupRef.current?.setLayout(DEFAULT_LAYOUT)
    savedLayout.current = null
  }, [])

  const filterTask = (task: TaskWithRelations) => {
    if (projectFilter && task.projectId !== projectFilter) return false
    if (urgencyFilter !== 'all') {
      const taskUrgency = task.urgency?.toLowerCase() || 'medium'
      if (taskUrgency !== urgencyFilter) return false
    }
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        task.title.toLowerCase().includes(searchLower) ||
        (task.Project?.title.toLowerCase().includes(searchLower) ?? false)
      )
    }
    return true
  }

  const sortTasks = (a: TaskWithRelations, b: TaskWithRelations) => {
    if (sort === 'title') {
      return a.title.localeCompare(b.title)
    } else if (sort === 'urgency') {
      const aUrgency = URGENCY_ORDER[a.urgency as string] || 2
      const bUrgency = URGENCY_ORDER[b.urgency as string] || 2
      return bUrgency - aUrgency
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  }

  // Separate archived tasks from active tasks
  const { activeMy, archivedMy } = useMemo(() => {
    const active: TaskWithRelations[] = []
    const archived: TaskWithRelations[] = []
    for (const task of myTasks) {
      if (isTaskArchived(task)) {
        archived.push(task)
      } else {
        active.push(task)
      }
    }
    return { activeMy: active, archivedMy: archived }
  }, [myTasks])

  const { activeAssigned, archivedAssigned } = useMemo(() => {
    const active: TaskWithRelations[] = []
    const archived: TaskWithRelations[] = []
    for (const task of assignedByMeTasks) {
      if (isTaskArchived(task)) {
        archived.push(task)
      } else {
        active.push(task)
      }
    }
    return { activeAssigned: active, archivedAssigned: archived }
  }, [assignedByMeTasks])

  const archivedCount = archivedMy.length + archivedAssigned.length

  // Apply filters and sorting
  const filteredMyTasks = (showArchived ? archivedMy : activeMy).filter(filterTask)
  const filteredAssignedByMe = (showArchived ? archivedAssigned : activeAssigned).filter(filterTask)
  const sortedMyTasks = [...filteredMyTasks].sort(sortTasks)
  const sortedAssignedByMe = [...filteredAssignedByMe].sort(sortTasks)

  // Active view: split into panels
  const inProgressTasks = sortedMyTasks.filter(t => !t.completed)
  const completedTasks = sortedMyTasks.filter(t => t.completed)
  const assignedByMeInProgress = sortedAssignedByMe.filter(t => !t.completed)

  // Archive view: all tasks are completed, combine into one list
  const allArchivedTasks = showArchived
    ? [...sortedMyTasks, ...sortedAssignedByMe].sort(sortTasks)
    : []

  return (
    <div className="my-tasks-content">
      <TaskFilters
        projects={projects}
        context="my-tasks"
        onReset={handleReset}
        layoutDirty={layoutDirty}
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived(!showArchived)}
        archivedCount={archivedCount}
      />

      {showArchived ? (
        <>
          <div className="archive-view-banner">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="21 8 21 21 3 21 3 8"/>
              <rect x="1" y="3" width="22" height="5"/>
              <line x1="10" y1="12" x2="14" y2="12"/>
            </svg>
            <span>Archived tasks</span>
          </div>
          <div className="task-archive-list">
            <TaskList
              title="Archived Tasks"
              tasks={allArchivedTasks}
              users={users}
              projects={allProjects}
              showProject={true}
              showUser={true}
              variant="completed"
            />
          </div>
        </>
      ) : (
        <div className="task-lists-container">
          <Group
            id="my-tasks-panels"
            orientation="horizontal"
            className="task-lists-resizable"
            defaultLayout={DEFAULT_LAYOUT}
            groupRef={groupRef}
            onLayoutChanged={handleLayoutChanged}
          >
            <Panel
              id="in-progress"
              defaultSize="33"
              minSize={MIN_PANEL_SIZE}
              className="task-list-panel"
            >
              <TaskList
                title="In Progress"
                tasks={inProgressTasks}
                users={users}
                projects={allProjects}
                showProject={true}
                showUser={false}
                variant="in-progress"
                onToggleCollapse={() => toggleCollapse("in-progress")}
              />
            </Panel>
            <Separator id="sep-1" className="task-list-separator" />
            <Panel
              id="completed"
              defaultSize="34"
              minSize={MIN_PANEL_SIZE}
              className="task-list-panel"
            >
              <TaskList
                title="Completed"
                tasks={completedTasks}
                users={users}
                projects={allProjects}
                showProject={true}
                showUser={false}
                variant="completed"
                onToggleCollapse={() => toggleCollapse("completed")}
              />
            </Panel>
            <Separator id="sep-2" className="task-list-separator" />
            <Panel
              id="assigned-by-me"
              defaultSize="33"
              minSize={MIN_PANEL_SIZE}
              className="task-list-panel"
            >
              <TaskList
                title="Assigned to others"
                tasks={assignedByMeInProgress}
                users={users}
                projects={allProjects}
                showProject={true}
                showUser={true}
                variant="assigned"
                onToggleCollapse={() => toggleCollapse("assigned-by-me")}
              />
            </Panel>
          </Group>
        </div>
      )}
    </div>
  )
}
