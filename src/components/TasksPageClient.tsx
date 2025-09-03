"use client"

import { useTaskFilter } from "@/contexts/TaskFilterContext"
import { TaskStats } from "./TaskStats"
import { TaskFilters } from "./TaskFilters"
import { TaskList } from "./TaskList"
import { NewTaskButton } from "./NewTaskButton"

interface Task {
  id: number
  title: string
  description?: string | null
  status: 'IN_PROGRESS' | 'COMPLETED'
  completed: boolean
  userId: number
  projectId: number
  createdAt: Date
  updatedAt: Date
  User: { id: number; name: string }
  Project: { id: number; title: string }
}

interface TasksPageClientProps {
  tasks: Task[]
  users: { id: number; name: string }[]
  projects: { id: number; title: string }[]
}

export function TasksPageClient({ tasks, users, projects }: TasksPageClientProps) {
  const { filter, sort, search } = useTaskFilter()

  // Filter tasks based on current filter
  const filteredTasks = tasks.filter(task => {
    // Status filter
    if (filter === 'in_progress' && task.status !== 'IN_PROGRESS') return false
    if (filter === 'completed' && task.status !== 'COMPLETED') return false
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.User.name.toLowerCase().includes(searchLower) ||
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

  // Calculate stats for all tasks (not filtered)
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length
  }

  // Calculate task counts for filter tabs
  const taskCounts = {
    all: tasks.length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length
  }

  return (
    <div className="tasks-content">
      {/* Stats Section */}
      <TaskStats stats={stats} />

      {/* Filters and Actions */}
      <div className="tasks-controls">
        <TaskFilters taskCounts={taskCounts} />
        <NewTaskButton users={users} projects={projects} />
      </div>

      {/* Task Lists */}
      <div className="task-lists-container">
        <TaskList 
          title="All Tasks" 
          tasks={sortedTasks} 
          users={users} 
          projects={projects}
          showProject={true}
          showUser={true}
        />
      </div>
    </div>
  )
}
