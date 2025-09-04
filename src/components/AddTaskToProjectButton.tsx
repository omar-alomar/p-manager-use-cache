"use client"

import { useState, useEffect } from "react"
import { QuickAddTaskModal } from "./QuickAddTaskModal"
import { getUsersAction } from "@/actions/users"
import { getProjectsAction } from "@/actions/projects"

interface AddTaskToProjectButtonProps {
  projectId: string
}

export function AddTaskToProjectButton({ projectId }: AddTaskToProjectButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [users, setUsers] = useState<{ id: number; name: string }[]>([])
  const [projects, setProjects] = useState<{ id: number; title: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [usersData, projectsData] = await Promise.all([
          getUsersAction(),
          getProjectsAction()
        ])
        setUsers(usersData)
        setProjects(projectsData)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <>
      <button 
        className="btn btn-primary btn-sm" 
        data-project-id={projectId}
        onClick={() => setIsModalOpen(true)}
        disabled={isLoading}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {isLoading ? 'Loading...' : 'Add Task'}
      </button>

      <QuickAddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        presetProjectId={Number(projectId)}
        users={users}
        projects={projects}
      />
    </>
  )
}
