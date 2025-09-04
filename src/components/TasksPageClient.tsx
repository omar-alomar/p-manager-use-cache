"use client"

import { useTaskFilter } from "@/contexts/TaskFilterContext"
import { TaskStats } from "./TaskStats"
import { TaskFilters } from "./TaskFilters"
import { TaskList } from "./TaskList"
import { NewTaskButton } from "./NewTaskButton"

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

interface TasksPageClientProps {
  tasks: Task[]
  users: { id: number; name: string }[]
  projects: { id: number; title: string }[]
}

export function TasksPageClient({ tasks, users, projects }: TasksPageClientProps) {
  const { filter, sort, search, userFilter, projectFilter } = useTaskFilter()

  // Filter tasks based on current filter
  const filteredTasks = tasks.filter(task => {
    // Status filter - derive from completed field
    if (filter === 'in_progress' && task.completed) return false
    if (filter === 'completed' && !task.completed) return false
    
    // User filter
    if (userFilter && task.userId !== userFilter) return false
    
    // Project filter
    if (projectFilter && task.projectId !== projectFilter) return false
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        task.title.toLowerCase().includes(searchLower) ||
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
    completed: tasks.filter(t => t.completed).length,
    inProgress: tasks.filter(t => !t.completed).length
  }

  // Calculate task counts for filter tabs
  const taskCounts = {
    all: tasks.length,
    inProgress: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length
  }

  return (
    <div className="tasks-content">
      {/* Stats Section */}
      <TaskStats stats={stats} context="all-tasks" />

      {/* Filters and Actions */}
      <div className="tasks-controls">
        <TaskFilters taskCounts={taskCounts} users={users} projects={projects} context="all-tasks" />
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
