"use client"

import { useState, useCallback, useRef } from "react"
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

interface MyTasksClientProps {
  myTasks: TaskWithRelations[]
  assignedByMeTasks: TaskWithRelations[]
  users: { id: number; name: string }[]
  projects: { id: number; title: string }[]
  allProjects: { id: number; title: string }[]
}

export function MyTasksClient({ myTasks, assignedByMeTasks, users, projects, allProjects }: MyTasksClientProps) {
  const { sort, search, projectFilter, urgencyFilter } = useTaskFilter()
  const [layoutDirty, setLayoutDirty] = useState(false)

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

  const filteredMyTasks = myTasks.filter(filterTask)
  const filteredAssignedByMe = assignedByMeTasks.filter(filterTask)
  const sortedMyTasks = [...filteredMyTasks].sort(sortTasks)
  const sortedAssignedByMe = [...filteredAssignedByMe].sort(sortTasks)

  const inProgressTasks = sortedMyTasks.filter(t => !t.completed)
  const completedTasks = sortedMyTasks.filter(t => t.completed)
  const assignedByMeInProgress = sortedAssignedByMe.filter(t => !t.completed)

  return (
    <div className="my-tasks-content">
      <TaskFilters projects={projects} context="my-tasks" onReset={handleReset} layoutDirty={layoutDirty} />

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
    </div>
  )
}
