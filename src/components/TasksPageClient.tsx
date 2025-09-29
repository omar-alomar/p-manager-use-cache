"use client"

import { useTaskFilter } from "@/contexts/TaskFilterContext"
import { TaskStats } from "./TaskStats"
import { TaskFilters } from "./TaskFilters"
import { TaskList } from "./TaskList"
import { UserTaskSection } from "./UserTaskSection"

interface Task {
  id: number
  title: string
  completed: boolean
  userId: number
  projectId: number | null
  createdAt: Date
  updatedAt: Date
  User: { id: number; name: string }
  Project: { id: number; title: string } | null
}

interface TasksPageClientProps {
  tasks: Task[]
  users: { id: number; name: string }[]
  projects: { id: number; title: string }[]
}

export function TasksPageClient({ tasks, users, projects }: TasksPageClientProps) {
  const { filter, sort, search, projectFilter } = useTaskFilter()

  // Filter tasks based on current filter (excluding user filter since we're grouping by user)
  const filteredTasks = tasks.filter(task => {
    // Status filter - derive from completed field
    if (filter === 'in_progress' && task.completed) return false
    if (filter === 'completed' && !task.completed) return false
    
    // Project filter
    if (projectFilter && task.projectId !== projectFilter) return false
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        task.title.toLowerCase().includes(searchLower) ||
        task.User.name.toLowerCase().includes(searchLower) ||
        (task.Project?.title.toLowerCase().includes(searchLower) ?? false)
      )
    }
    
    return true
  })

  // Group tasks by user
  const tasksByUser = filteredTasks.reduce((acc, task) => {
    const userId = task.userId
    if (!acc[userId]) {
      acc[userId] = []
    }
    acc[userId].push(task)
    return acc
  }, {} as Record<number, typeof tasks>)

  // Sort tasks within each user group
  Object.keys(tasksByUser).forEach(userId => {
    tasksByUser[Number(userId)].sort((a, b) => {
      if (sort === 'title') {
        return a.title.localeCompare(b.title)
      } else {
        // Default to created date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
  })

  // Sort users by name for consistent ordering
  const sortedUsers = users.sort((a, b) => a.name.localeCompare(b.name))

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
      </div>

      {/* User Task Sections */}
      <div className="user-sections-container">
        {sortedUsers.map(user => {
          const userTasks = tasksByUser[user.id] || []
          return (
            <UserTaskSection
              key={user.id}
              user={user}
              tasks={userTasks}
              users={users}
              projects={projects}
            />
          )
        })}
      </div>
    </div>
  )
}
