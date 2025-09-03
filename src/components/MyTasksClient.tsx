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

interface MyTasksClientProps {
  myTasks: Task[]
  users: { id: number; name: string }[]
  projects: { id: number; title: string }[]
}

export function MyTasksClient({ myTasks, users, projects }: MyTasksClientProps) {
  const { filter, sort, search } = useTaskFilter()

  // Filter tasks based on current filter
  const filteredTasks = myTasks.filter(task => {
    // Status filter
    if (filter === 'in_progress' && task.status !== 'IN_PROGRESS') return false
    if (filter === 'completed' && task.status !== 'COMPLETED') return false
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
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
    completed: myTasks.filter(t => t.status === 'COMPLETED').length,
    inProgress: myTasks.filter(t => t.status === 'IN_PROGRESS').length
  }

  // Calculate task counts for filter tabs
  const taskCounts = {
    all: myTasks.length,
    inProgress: myTasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed: myTasks.filter(t => t.status === 'COMPLETED').length
  }

  // Group filtered and sorted tasks by status for display
  const inProgressTasks = sortedTasks.filter(t => t.status === 'IN_PROGRESS')
  const completedTasks = sortedTasks.filter(t => t.status === 'COMPLETED')

  return (
    <div className="my-tasks-content">
      {/* Stats Section */}
      <TaskStats stats={stats} />

      {/* Filters and Actions */}
      <div className="tasks-controls">
        <TaskFilters taskCounts={taskCounts} />
        <NewTaskButton users={users} projects={projects} />
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
