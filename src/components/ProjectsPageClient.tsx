"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { EditableComments } from "@/components/EditableComments"
import { EditableCoFiles } from "@/components/EditableCoFiles"
import { EditableMbaNumber } from "@/components/EditableMbaNumber"
import { formatDate } from "@/utils/dateUtils"

// Helper function to check if a date is more than 7 days past
function isMoreThan7DaysPast(date: Date): boolean {
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 7
}

// Helper function to filter out milestones that are more than 7 days past or completed
function filterRecentMilestones<T extends { date: Date; completed?: boolean }>(milestones: T[] | undefined): T[] {
  if (!milestones || milestones.length === 0) return []
  
  return milestones.filter(milestone => !isMoreThan7DaysPast(milestone.date) && !milestone.completed)
}

// Function to get the nearest milestone date from multiple milestone entries
function getNearestMilestoneDate(milestones: { date: Date; completed?: boolean }[] | undefined, fallbackMilestone: Date | null): Date | null {
  // First filter out milestones more than 7 days past or completed
  const recentMilestones = filterRecentMilestones(milestones)
  
  if (recentMilestones.length === 0) {
    // If no recent milestones, check if fallback is also too old
    if (fallbackMilestone && isMoreThan7DaysPast(fallbackMilestone)) {
      return null
    }
    return fallbackMilestone
  }
  
  const now = new Date()
  // Normalize to UTC midnight for date-only comparison (milestone dates are stored in UTC)
  const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const futureMilestones = recentMilestones.filter(milestone => {
    const milestoneDate = new Date(milestone.date)
    const milestoneDateUTC = new Date(Date.UTC(milestoneDate.getUTCFullYear(), milestoneDate.getUTCMonth(), milestoneDate.getUTCDate()))
    return milestoneDateUTC >= todayUTC
  })
  
  if (futureMilestones.length === 0) {
    // If no future dates, return the most recent past date (within 7 days)
    return recentMilestones.reduce((nearest, current) => 
      new Date(current.date) > new Date(nearest.date) ? current : nearest
    ).date
  }
  
  // Return the nearest future date
  return futureMilestones.reduce((nearest, current) => 
    new Date(current.date) < new Date(nearest.date) ? current : nearest
  ).date
}

// Function to determine milestone color class based on date proximity
function getMilestoneColorClass(milestoneDate: Date | null): string {
  if (!milestoneDate) return 'milestone-neutral'
  
  const now = new Date()
  const milestone = new Date(milestoneDate)
  const diffTime = milestone.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 14) {
    return 'milestone-urgent' // Red - within 2 weeks
  } else if (diffDays <= 30) {
    return 'milestone-warning' // Yellow - within a month
  } else {
    return 'milestone-safe' // Green - more than a month
  }
}

interface Project {
  id: number
  title: string
  client: string
  clientId: number | null
  clientCompany: string | null
  body: string
  milestone: Date | null
  milestones?: { id: number; date: Date; item: string; completed?: boolean }[]
  mbaNumber: string | null
  coFileNumbers: string
  dldReviewer: string
  userId: number
}

interface User {
  id: number
  name: string
}

interface ProjectsPageClientProps {
  projects: Project[]
  users: User[]
  currentUser: { id: number; name: string }
}

export function ProjectsPageClient({ projects, users, currentUser }: ProjectsPageClientProps) {
  const [search, setSearch] = useState("")
  const [projectManagerFilter, setProjectManagerFilter] = useState<number | null>(null)
  const [sortConfig, setSortConfig] = useState<{
    key: 'title' | 'mbaNumber' | 'userId' | 'milestone' | null
    direction: 'asc' | 'desc' | 'none'
  }>({ key: null, direction: 'none' })

  // Create a map of users for quick lookup
  const userMap = useMemo(() => {
    const map = new Map<number, User>()
    users.forEach(user => map.set(user.id, user))
    return map
  }, [users])

  // Handle sorting
  const handleSort = (key: 'title' | 'mbaNumber' | 'userId' | 'milestone') => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        // If clicking the same column, cycle through: asc -> desc -> none -> asc
        if (prevConfig.direction === 'asc') {
          return { key, direction: 'desc' }
        } else if (prevConfig.direction === 'desc') {
          return { key, direction: 'none' }
        } else {
          return { key, direction: 'asc' }
        }
      } else {
        // If clicking a different column, set to ascending
        return { key, direction: 'asc' }
      }
    })
  }

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const projectManager = userMap.get(project.userId)
        const projectManagerName = projectManager?.name || ""
        
        return (
          project.title.toLowerCase().includes(searchLower) ||
          (project.client || '').toLowerCase().includes(searchLower) ||
          (project.clientCompany || '').toLowerCase().includes(searchLower) ||
          project.body.toLowerCase().includes(searchLower) ||
          projectManagerName.toLowerCase().includes(searchLower) ||
          (project.mbaNumber && project.mbaNumber.toLowerCase().includes(searchLower)) ||
          (project.coFileNumbers && project.coFileNumbers.toLowerCase().includes(searchLower))
        )
      }
      
      return true
    })

    // Project manager filter
    if (projectManagerFilter !== null) {
      filtered = filtered.filter(project => project.userId === projectManagerFilter)
    }

    // Apply sorting
    if (sortConfig.key === 'title' && sortConfig.direction !== 'none') {
      filtered.sort((a, b) => {
        const aTitle = a.title.toLowerCase()
        const bTitle = b.title.toLowerCase()
        
        if (sortConfig.direction === 'asc') {
          return aTitle.localeCompare(bTitle)
        } else {
          return bTitle.localeCompare(aTitle)
        }
      })
    } else if (sortConfig.key === 'mbaNumber' && sortConfig.direction !== 'none') {
      filtered.sort((a, b) => {
        const aMba = a.mbaNumber || ''
        const bMba = b.mbaNumber || ''
        
        // Handle empty/null MBA numbers - put them at the end
        if (!aMba && !bMba) return 0
        if (!aMba) return 1
        if (!bMba) return -1
        
        if (sortConfig.direction === 'asc') {
          return aMba.localeCompare(bMba)
        } else {
          return bMba.localeCompare(aMba)
        }
      })
    } else if (sortConfig.key === 'userId' && sortConfig.direction !== 'none') {
      filtered.sort((a, b) => {
        const aManager = userMap.get(a.userId)
        const bManager = userMap.get(b.userId)
        
        const aName = aManager?.name || 'Unknown'
        const bName = bManager?.name || 'Unknown'
        
        if (sortConfig.direction === 'asc') {
          return aName.localeCompare(bName)
        } else {
          return bName.localeCompare(aName)
        }
      })
    } else if (sortConfig.key === 'milestone' && sortConfig.direction !== 'none') {
      filtered.sort((a, b) => {
        const aNearestMilestone = getNearestMilestoneDate(a.milestones, a.milestone)
        const bNearestMilestone = getNearestMilestoneDate(b.milestones, b.milestone)
        
        // Handle null milestone dates - put them at the end
        if (!aNearestMilestone && !bNearestMilestone) return 0
        if (!aNearestMilestone) return 1
        if (!bNearestMilestone) return -1
        
        const aDate = new Date(aNearestMilestone).getTime()
        const bDate = new Date(bNearestMilestone).getTime()
        
        if (sortConfig.direction === 'asc') {
          return aDate - bDate
        } else {
          return bDate - aDate
        }
      })
    } else {
      // Default sort: current user's projects appear first
      filtered.sort((a, b) => {
        if (a.userId === currentUser.id && b.userId !== currentUser.id) {
          return -1 // a comes first
        }
        if (a.userId !== currentUser.id && b.userId === currentUser.id) {
          return 1 // b comes first
        }
        return 0 // maintain original order for projects with same user status
      })
    }

    return filtered
  }, [projects, search, projectManagerFilter, currentUser.id, userMap, sortConfig])

  if (projects.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <p>No projects found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="projects-content">
      {/* Search and Filter Controls */}
      <div className="projects-filters">
        <div className="filter-group">
          <div className="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search projects, clients, companies, managers, MBA #, Co Files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-group">
          <select
            value={projectManagerFilter || ""}
            onChange={(e) => setProjectManagerFilter(e.target.value ? Number(e.target.value) : null)}
            className="filter-select"
          >
            <option value="">All Project Managers</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <div className="filter-stats">
            Showing {filteredAndSortedProjects.length} of {projects.length} projects
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="projects-table-container">
        <table className="projects-table">
          <thead>
            <tr>
              <th 
                className="sortable-header" 
                onClick={() => handleSort('title')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                PROJECT NAME
                {sortConfig.key === 'title' && sortConfig.direction !== 'none' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                className="sortable-header" 
                onClick={() => handleSort('mbaNumber')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                MBA #
                {sortConfig.key === 'mbaNumber' && sortConfig.direction !== 'none' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th>Co File #&apos;s</th>
              <th 
                className="sortable-header" 
                onClick={() => handleSort('userId')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                P<br />MGR
                {sortConfig.key === 'userId' && sortConfig.direction !== 'none' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                className="sortable-header" 
                onClick={() => handleSort('milestone')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                MILESTONES
                {sortConfig.key === 'milestone' && sortConfig.direction !== 'none' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th>OVERVIEW</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedProjects.map((project) => (
              <ProjectRow key={project.id} project={project} userMap={userMap} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProjectRow({ project, userMap }: { project: Project; userMap: Map<number, User> }) {
  const projectManager = userMap.get(project.userId)
  
  return (
    <tr>
      <td className="project-name-cell">
        <Link href={`/projects/${project.id}`} className="project-name-link">
          <div className="project-name-link-content">
            <div className="project-name">{project.title}</div>
            <div className="project-client">{project.client || 'No client'}</div>
          </div>
        </Link>
      </td>
      <td className="mba-number">
        <EditableMbaNumber
          projectId={project.id}
          initialMbaNumber={project.mbaNumber || ""}
          title={project.title}
          clientId={project.clientId}
          body={project.body}
          milestone={project.milestone}
          coFileNumbers={project.coFileNumbers || ""}
          dldReviewer={project.dldReviewer || ""}
          userId={project.userId}
        />
      </td>
      <td className="co-files">
        <EditableCoFiles
          projectId={project.id}
          initialCoFiles={project.coFileNumbers || ""}
          title={project.title}
          clientId={project.clientId}
          body={project.body}
          milestone={project.milestone}
          mbaNumber={project.mbaNumber || ""}
          dldReviewer={project.dldReviewer || ""}
          userId={project.userId}
        />
      </td>
      <td className="pmgr">
        {projectManager ? (
          <Link href={`/users/${projectManager.id}`} className="pmgr-link">
            {projectManager.name.split(' ').map(n => n[0]).join('')}
          </Link>
        ) : (
          <span className="pmgr-placeholder">-</span>
        )}
      </td>
      <td className="milestone-date">
        {(() => {
          const nearestMilestone = getNearestMilestoneDate(project.milestones, project.milestone)
          
          // If we have multiple milestones, show only recent ones (within 7 days)
          if (project.milestones && project.milestones.length > 0) {
            const recentMilestones = filterRecentMilestones(project.milestones)
            
            if (recentMilestones.length === 0) {
              return <span className="milestone-neutral">No recent milestones</span>
            }
            
            return (
              <div className="milestone-multiple">
                {recentMilestones
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((milestone, index) => {
                    const isNearest = nearestMilestone && new Date(milestone.date).getTime() === new Date(nearestMilestone).getTime()
                    return (
                      <div key={milestone.id || index} className={`milestone-entry ${isNearest ? 'milestone-nearest' : ''}`}>
                        <span className={`milestone-highlight ${getMilestoneColorClass(milestone.date)}`}>
                          {formatDate(milestone.date)}
                        </span>
                        <span className="milestone-item">{milestone.item}</span>
                      </div>
                    )
                  })}
              </div>
            )
          }
          
          // Fallback to single milestone date
          return nearestMilestone && (
            <span className={`milestone-highlight ${getMilestoneColorClass(nearestMilestone)}`}>
              {formatDate(nearestMilestone)}
            </span>
          )
        })()}
      </td>
      <td className="comments">
        <EditableComments
          projectId={project.id}
          initialComments={project.body}
          title={project.title}
          clientId={project.clientId}
          body={project.body}
          milestone={project.milestone}
          mbaNumber={project.mbaNumber || ""}
          coFileNumbers={project.coFileNumbers || ""}
          dldReviewer={project.dldReviewer || ""}
          userId={project.userId}
        />
      </td>
    </tr>
  )
}
