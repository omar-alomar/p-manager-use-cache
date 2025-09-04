"use client"

import { useTaskFilter } from "@/contexts/TaskFilterContext"
import { TaskStats } from "./TaskStats"
import { TaskFilters } from "./TaskFilters"
import { TaskList } from "./TaskList"

interface Task {
  id: number
  title: string
  completed: boolean
  userId: number
  projectId: number
  createdAt: Date
  updatedAt: Date
  User: { id: number; name: string }
  Project: { id: number; title: string }
}

interface MyTasksClientProps {
  myTasks: Task[]
  users: { id: number; name: string }[]
  projects: { id: number; title: string }[]
}

export function MyTasksClient({ myTasks, users, projects }: MyTasksClientProps) {
  const { sort, search, projectFilter } = useTaskFilter()

  // Filter tasks based on search and project filter only (no status filtering)
  const filteredTasks = myTasks.filter(task => {
    // Project filter
    if (projectFilter && task.projectId !== projectFilter) return false
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        task.title.toLowerCase().includes(searchLower) ||
        task.Project.title.toLowerCase().includes(searchLower)
      )
    }
    
    return true
  })

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sort === 'title') {
      return a.title.localeCompare(b.title)
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
            projects={projects}
            showProject={true}
            showUser={false}
          />
          
          <TaskList 
            title="Completed" 
            tasks={completedTasks} 
            users={users} 
            projects={projects}
            showProject={true}
            showUser={false}
          />
        </div>
      </div>
    </div>
  )
}
