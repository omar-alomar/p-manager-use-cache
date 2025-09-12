"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { EditableComments } from "@/components/EditableComments"
import { EditableCoFiles } from "@/components/EditableCoFiles"
import { EditableMbaNumber } from "@/components/EditableMbaNumber"
import { formatDate } from "@/utils/dateUtils"

// Function to get the nearest APFO date from multiple APFO entries
function getNearestApfoDate(apfos: { date: Date }[] | undefined, fallbackApfo: Date | null): Date | null {
  if (!apfos || apfos.length === 0) return fallbackApfo
  
  const now = new Date()
  const futureApfos = apfos.filter(apfo => new Date(apfo.date) >= now)
  
  if (futureApfos.length === 0) {
    // If no future dates, return the most recent past date
    return apfos.reduce((nearest, current) => 
      new Date(current.date) > new Date(nearest.date) ? current : nearest
    ).date
  }
  
  // Return the nearest future date
  return futureApfos.reduce((nearest, current) => 
    new Date(current.date) < new Date(nearest.date) ? current : nearest
  ).date
}

// Function to determine APFO color class based on date proximity
function getApfoColorClass(apfoDate: Date | null): string {
  if (!apfoDate) return 'apfo-neutral'
  
  const now = new Date()
  const apfo = new Date(apfoDate)
  const diffTime = apfo.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 14) {
    return 'apfo-urgent' // Red - within 2 weeks
  } else if (diffDays <= 30) {
    return 'apfo-warning' // Yellow - within a month
  } else {
    return 'apfo-safe' // Green - more than a month
  }
}

interface Project {
  id: number
  title: string
  client: string
  clientId: number | null
  body: string
  apfo: Date | null
  apfos?: { id: number; date: Date; item: string }[]
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
    key: 'apfo' | null
    direction: 'asc' | 'desc' | 'none'
  }>({ key: null, direction: 'none' })

  // Create a map of users for quick lookup
  const userMap = useMemo(() => {
    const map = new Map<number, User>()
    users.forEach(user => map.set(user.id, user))
    return map
  }, [users])

  // Handle sorting
  const handleSort = (key: 'apfo') => {
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
    if (sortConfig.key === 'apfo' && sortConfig.direction !== 'none') {
      filtered.sort((a, b) => {
        const aNearestApfo = getNearestApfoDate(a.apfos, a.apfo)
        const bNearestApfo = getNearestApfoDate(b.apfos, b.apfo)
        
        // Handle null APFO dates - put them at the end
        if (!aNearestApfo && !bNearestApfo) return 0
        if (!aNearestApfo) return 1
        if (!bNearestApfo) return -1
        
        const aDate = new Date(aNearestApfo).getTime()
        const bDate = new Date(bNearestApfo).getTime()
        
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
              placeholder="Search projects, clients, managers, MBA #, Co Files..."
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
              <th>PROJECT NAME</th>
              <th>MBA #</th>
              <th>Co File #&apos;s</th>
              <th>P<br />MGR</th>
              <th 
                className="sortable-header" 
                onClick={() => handleSort('apfo')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                MILESTONES
                {sortConfig.key === 'apfo' && sortConfig.direction !== 'none' && (
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
          apfo={project.apfo}
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
          apfo={project.apfo}
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
      <td className="apfo-date">
        {(() => {
          const nearestApfo = getNearestApfoDate(project.apfos, project.apfo)
          
          // If we have multiple milestones, show all of them
          if (project.apfos && project.apfos.length > 0) {
            return (
              <div className="apfo-multiple">
                {project.apfos
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((apfo, index) => {
                    const isNearest = nearestApfo && new Date(apfo.date).getTime() === new Date(nearestApfo).getTime()
                    return (
                      <div key={apfo.id || index} className={`apfo-entry ${isNearest ? 'apfo-nearest' : ''}`}>
                        <span className={`apfo-highlight ${getApfoColorClass(apfo.date)}`}>
                          {formatDate(apfo.date)}
                        </span>
                        <span className="apfo-item">{apfo.item}</span>
                      </div>
                    )
                  })}
              </div>
            )
          }
          
          // Fallback to single APFO date
          return nearestApfo && (
            <span className={`apfo-highlight ${getApfoColorClass(nearestApfo)}`}>
              {formatDate(nearestApfo)}
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
          apfo={project.apfo}
          mbaNumber={project.mbaNumber || ""}
          coFileNumbers={project.coFileNumbers || ""}
          dldReviewer={project.dldReviewer || ""}
          userId={project.userId}
        />
      </td>
    </tr>
  )
}
