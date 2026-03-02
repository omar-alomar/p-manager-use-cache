"use client"

import { useRef, useCallback } from "react"
import { Group, Panel, Separator } from "react-resizable-panels"
import type { GroupImperativeHandle } from "react-resizable-panels"
import { useTaskFilter } from "@/contexts/TaskFilterContext"
import { TaskStatCard } from "./TaskStats"
import { TaskFilters } from "./TaskFilters"
import { TaskList } from "./TaskList"
import { URGENCY_ORDER } from "@/constants/urgency"
import type { TaskWithRelations } from "@/types"

const MY_TASKS_DEFAULT_LAYOUT = { "in-progress": 33, "completed": 34, "assigned-by-me": 33 }

interface MyTasksClientProps {
  myTasks: TaskWithRelations[]
  assignedByMeTasks: TaskWithRelations[]
  users: { id: number; name: string }[]
  projects: { id: number; title: string }[]
  allProjects: { id: number; title: string }[]
}

export function MyTasksClient({ myTasks, assignedByMeTasks, users, projects, allProjects }: MyTasksClientProps) {
  const { sort, search, projectFilter, urgencyFilter } = useTaskFilter()

  // Filter tasks based on search, project filter, and urgency filter (no status filtering)
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

  const completionRate = myTasks.length > 0 ? Math.round((myTasks.filter(t => t.completed).length / myTasks.length) * 100) : 0
  const inProgressTasks = sortedMyTasks.filter(t => !t.completed)
  const completedTasks = sortedMyTasks.filter(t => t.completed)
  const assignedByMeInProgress = sortedAssignedByMe.filter(t => !t.completed)

  const statsGroupRef = useRef<GroupImperativeHandle | null>(null)
  const listsGroupRef = useRef<GroupImperativeHandle | null>(null)
  const syncSourceRef = useRef<"stats" | "lists" | null>(null)

  const handleStatsLayoutChange = useCallback((layout: { [id: string]: number }) => {
    if (syncSourceRef.current === "lists") {
      syncSourceRef.current = null
      return
    }
    syncSourceRef.current = "stats"
    listsGroupRef.current?.setLayout(layout)
    syncSourceRef.current = null
  }, [])

  const handleListsLayoutChange = useCallback((layout: { [id: string]: number }) => {
    if (syncSourceRef.current === "stats") {
      syncSourceRef.current = null
      return
    }
    syncSourceRef.current = "lists"
    statsGroupRef.current?.setLayout(layout)
    syncSourceRef.current = null
  }, [])

  return (
    <div className="my-tasks-content">
      {/* Filters and Actions */}
      <div className="tasks-controls">
        <TaskFilters projects={projects} context="my-tasks" />
      </div>

      {/* Stats row: same column widths as lists, synced when either is resized */}
      <div className="my-tasks-stats-wrapper">
        <Group
          id="my-tasks-stats"
          orientation="horizontal"
          className="my-tasks-stats-group"
          defaultLayout={MY_TASKS_DEFAULT_LAYOUT}
          groupRef={statsGroupRef}
          onLayoutChange={handleStatsLayoutChange}
        >
          <Panel id="in-progress" defaultSize="33" minSize="15" className="my-tasks-stat-panel">
            <TaskStatCard type="in-progress" count={myTasks.filter(t => !t.completed).length} />
          </Panel>
          <Separator id="stats-sep-1" className="my-tasks-stats-separator" />
          <Panel id="completed" defaultSize="34" minSize="15" className="my-tasks-stat-panel">
            <TaskStatCard type="completed" count={myTasks.filter(t => t.completed).length} completionRate={completionRate} />
          </Panel>
          <Separator id="stats-sep-2" className="my-tasks-stats-separator" />
          <Panel id="assigned-by-me" defaultSize="33" minSize="15" className="my-tasks-stat-panel">
            <TaskStatCard type="assigned-by-me" count={assignedByMeTasks.filter(t => !t.completed).length} />
          </Panel>
        </Group>
      </div>

      {/* Task lists row: resizable; drives shared layout with stats row */}
      <div className="task-lists-container">
        <Group
          id="my-tasks-panels"
          orientation="horizontal"
          className="task-lists-resizable"
          defaultLayout={MY_TASKS_DEFAULT_LAYOUT}
          groupRef={listsGroupRef}
          onLayoutChange={handleListsLayoutChange}
        >
          <Panel id="in-progress" defaultSize="33" minSize="15" className="task-list-panel">
            <TaskList 
              title="In Progress" 
              tasks={inProgressTasks} 
              users={users} 
              projects={allProjects}
              showProject={true}
              showUser={false}
            />
          </Panel>
          <Separator id="sep-1" className="task-list-separator" />
          <Panel id="completed" defaultSize="34" minSize="15" className="task-list-panel">
            <TaskList 
              title="Completed" 
              tasks={completedTasks} 
              users={users} 
              projects={allProjects}
              showProject={true}
              showUser={false}
            />
          </Panel>
          <Separator id="sep-2" className="task-list-separator" />
          <Panel id="assigned-by-me" defaultSize="33" minSize="15" className="task-list-panel">
            <TaskList 
              title="Assigned by me" 
              tasks={assignedByMeInProgress} 
              users={users} 
              projects={allProjects}
              showProject={true}
              showUser={true}
            />
          </Panel>
        </Group>
      </div>
    </div>
  )
}
