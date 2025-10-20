"use client"

import { useTaskFilter } from "@/contexts/TaskFilterContext"
import { TaskStats } from "./TaskStats"
import { TaskFilters } from "./TaskFilters"
import { TaskList } from "./TaskList"

interface Task {
  id: number
  title: string
  completed: boolean
  urgency?: string | null
  userId: number
  projectId: number | null
  createdAt: Date
  updatedAt: Date
  User: { id: number; name: string }
  Project: { id: number; title: string } | null
}

interface MyTasksClientProps {
  myTasks: Task[]
  users: { id: number; name: string }[]
  projects: { id: number; title: string }[]
  allProjects: { id: number; title: string }[]
}

export function MyTasksClient({ myTasks, users, projects, allProjects }: MyTasksClientProps) {
  const { sort, search, projectFilter, urgencyFilter } = useTaskFilter()

  // Filter tasks based on search, project filter, and urgency filter (no status filtering)
  const filteredTasks = myTasks.filter(task => {
    // Project filter
    if (projectFilter && task.projectId !== projectFilter) return false
    
    // Urgency filter
    if (urgencyFilter !== 'all') {
      const taskUrgency = task.urgency?.toLowerCase() || 'medium'
      if (taskUrgency !== urgencyFilter) return false
    }
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        task.title.toLowerCase().includes(searchLower) ||
        (task.Project?.title.toLowerCase().includes(searchLower) ?? false)
      )
    }
    
    return true
  })

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sort === 'title') {
      return a.title.localeCompare(b.title)
    } else if (sort === 'urgency') {
      // Sort by urgency: CRITICAL > HIGH > MEDIUM > LOW
      const urgencyOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
      const aUrgency = urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 2
      const bUrgency = urgencyOrder[b.urgency as keyof typeof urgencyOrder] || 2
      return bUrgency - aUrgency // Higher urgency first
    } else {
      // Default to created date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  // Calculate stats for current user's tasks (not filtered)
  const stats = {
    total: myTasks.length,
    completed: myTasks.filter(t => t.completed).length,
    inProgress: myTasks.filter(t => !t.completed).length
  }

  // Group tasks by status for display (always show both sections)
  const inProgressTasks = sortedTasks.filter(t => !t.completed)
  const completedTasks = sortedTasks.filter(t => t.completed)

  return (
    <div className="my-tasks-content">
      {/* Stats Section */}
      <TaskStats stats={stats} context="my-tasks" />

      {/* Filters and Actions */}
      <div className="tasks-controls">
        <TaskFilters projects={projects} context="my-tasks" />
      </div>

      {/* Task Lists by Status */}
      <div className="task-lists-container">
        <div className="task-lists-grid">
          <TaskList 
            title="In Progress" 
            tasks={inProgressTasks} 
            users={users} 
            projects={allProjects}
            showProject={true}
            showUser={false}
          />
          
          <TaskList 
            title="Completed" 
            tasks={completedTasks} 
            users={users} 
            projects={allProjects}
            showProject={true}
            showUser={false}
          />
        </div>
      </div>
    </div>
  )
}
