"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { setProjectArchivedAction } from "@/actions/projects"
import { EditableProjectField } from "@/components/EditableProjectField"
import { formatDate } from "@/utils/dateUtils"
import { getMilestoneColorClass, filterRecentMilestones, getNearestMilestoneDate } from "@/utils/milestoneUtils"
import { useSessionSort } from "@/hooks/useSessionSort"

interface Project {
  id: number
  title: string
  client: string
  clientId: number | null
  clientCompany: string | null
  body: string
  archived?: boolean
  milestone: Date | null
  milestones?: { id: number; date: Date | null; item: string; completed?: boolean }[]
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
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [projectManagerFilter, setProjectManagerFilter] = useState<number | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const { sortConfig, handleSort } = useSessionSort<'title' | 'mbaNumber' | 'userId' | 'milestone'>('projectsSortConfig')

  // Create a map of users for quick lookup
  const userMap = useMemo(() => {
    const map = new Map<number, User>()
    users.forEach(user => map.set(user.id, user))
    return map
  }, [users])

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      // Archived view toggle
      if (showArchived ? !project.archived : project.archived) return false

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
  }, [projects, search, projectManagerFilter, showArchived, currentUser.id, userMap, sortConfig])

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

        <div className="filter-group filter-group-right">
          <button
            type="button"
            className="btn-view-archived"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? "View projects" : "View archive"}
          </button>
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
            {filteredAndSortedProjects.map((project, index) => (
              <ProjectRow
                key={project.id}
                project={project}
                userMap={userMap}
                rowIndex={index}
                onArchiveChange={() => router.refresh()}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const SWIPE_THRESHOLD = 100
const MAX_DRAG_PX = 210

function ProjectRow({
  project,
  userMap,
  rowIndex,
  onArchiveChange,
}: {
  project: Project
  userMap: Map<number, User>
  rowIndex: number
  onArchiveChange: () => void
}) {
  const projectManager = userMap.get(project.userId)
  const rowRef = useRef<HTMLTableRowElement>(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const currentTranslateRef = useRef(0)
  const exitHandledRef = useRef(false)

  const [translateX, setTranslateX] = useState(0)
  const [isExiting, setIsExiting] = useState(false)
  const [exitTranslate, setExitTranslate] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isDraggingState, setIsDraggingState] = useState(false)

  const runArchive = useCallback(() => {
    const row = rowRef.current
    const w = row ? row.getBoundingClientRect().width : 0
    setExitTranslate(-(w + 20))
    setIsExiting(true)
    setIsTransitioning(true)
    setIsDraggingState(false)
    // Optimistic: animate immediately, revert on error
    setProjectArchivedAction(project.id, !project.archived).catch(() => {
      setIsExiting(false)
      setIsTransitioning(true)
      setTranslateX(0)
      currentTranslateRef.current = 0
      setTimeout(() => setIsTransitioning(false), 350)
    })
  }, [project.id, project.archived])

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.propertyName !== "transform" || !isExiting || exitHandledRef.current) return
      exitHandledRef.current = true
      onArchiveChange()
    },
    [isExiting, onArchiveChange]
  )

  const handlePointerStart = useCallback(
    (clientX: number) => {
      if (isExiting) return
      startXRef.current = clientX
      currentTranslateRef.current = translateX
      isDraggingRef.current = false
    },
    [translateX, isExiting]
  )

  const handlePointerMove = useCallback(
    (clientX: number) => {
      if (isExiting) return
      const delta = clientX - startXRef.current
      if (!isDraggingRef.current && Math.abs(delta) > 6) {
        isDraggingRef.current = true
        setIsDraggingState(true)
      }
      if (!isDraggingRef.current) return
      // Only allow left swipe; rubber-band resistance past threshold
      const rawDelta = Math.min(0, delta)
      let next: number
      if (rawDelta >= -SWIPE_THRESHOLD) {
        next = rawDelta
      } else {
        const over = Math.abs(rawDelta) - SWIPE_THRESHOLD
        next = -(SWIPE_THRESHOLD + over * 0.35)
      }
      next = Math.max(-MAX_DRAG_PX, next)
      currentTranslateRef.current = next
      setTranslateX(next)
    },
    [isExiting]
  )

  const handlePointerEnd = useCallback(
    () => {
      if (isExiting) return
      if (!isDraggingRef.current) return
      const finalTranslate = currentTranslateRef.current
      setIsDraggingState(false)
      if (finalTranslate <= -SWIPE_THRESHOLD) {
        runArchive()
      } else {
        setIsTransitioning(true)
        setTranslateX(0)
        currentTranslateRef.current = 0
        setTimeout(() => {
          setIsTransitioning(false)
        }, 280)
      }
    },
    [isExiting, runArchive]
  )

  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    let touchActive = false
    const onTouchStart = (e: TouchEvent) => {
      if (!row.contains(e.target as Node)) return
      touchActive = true
      handlePointerStart(e.touches[0].clientX)
      const onTouchMoveDoc = (ev: TouchEvent) => {
        if (!touchActive || !ev.touches.length) return
        handlePointerMove(ev.touches[0].clientX)
        if (isDraggingRef.current) ev.preventDefault()
      }
      const cleanup = () => {
        touchActive = false
        document.removeEventListener("touchmove", onTouchMoveDoc)
        document.removeEventListener("touchend", onTouchEndDoc)
        document.removeEventListener("touchcancel", onTouchEndDoc)
      }
      const onTouchEndDoc = (ev: TouchEvent) => {
        if (!touchActive) return
        cleanup()
        if (ev.type === "touchend" && ev.changedTouches.length) handlePointerEnd()
      }
      document.addEventListener("touchmove", onTouchMoveDoc, { passive: false })
      document.addEventListener("touchend", onTouchEndDoc, { passive: true })
      document.addEventListener("touchcancel", onTouchEndDoc, { passive: true })
    }
    row.addEventListener("touchstart", onTouchStart, { passive: true })
    return () => row.removeEventListener("touchstart", onTouchStart)
  }, [handlePointerStart, handlePointerMove, handlePointerEnd])

  const [mouseDown, setMouseDown] = useState(false)
  useEffect(() => {
    if (!mouseDown) return
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX)
    const onMouseUp = () => {
      setMouseDown(false)
      handlePointerEnd()
    }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [mouseDown, handlePointerMove, handlePointerEnd])

  const slideStyle = useMemo(() => {
    const x = isExiting ? exitTranslate : translateX
    return {
      transform: `translate3d(${x}px, 0, 0)`,
      transition: isTransitioning
        ? "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.22s ease"
        : "none",
      opacity: isExiting ? 0 : 1,
    }
  }, [translateX, isExiting, exitTranslate, isTransitioning])

  const archiveProgress = isDraggingState ? Math.min(1, Math.abs(translateX) / SWIPE_THRESHOLD) : 0
  const isArchiveReady = isDraggingState && translateX <= -SWIPE_THRESHOLD

  return (
    <tr
      ref={rowRef}
      className={`project-row ${rowIndex % 2 === 1 ? "project-row-even" : ""} ${project.archived ? "project-row-archived" : ""} ${isExiting ? "project-row-exiting" : ""} ${isArchiveReady ? "project-row-archive-ready" : isDraggingState ? "project-row-dragging" : ""}`}
      onMouseDown={(e) => {
        if (isExiting) return
        if (e.button === 0) {
          handlePointerStart(e.clientX)
          setMouseDown(true)
        }
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      <td className="project-name-cell row-slideable" style={slideStyle}>
        <Link
          href={`/projects/${project.id}`}
          className="project-name-link"
          onClick={(e) => {
            if (isDraggingRef.current) e.preventDefault()
          }}
        >
          <div className="project-name-link-content">
            <div className="project-name">{project.title}</div>
            <div className="project-client">{project.client || "No client"}</div>
          </div>
        </Link>
      </td>
      <td className="mba-number row-slideable" style={slideStyle}>
        <EditableProjectField
          projectId={project.id}
          field="mbaNumber"
          initialValue={project.mbaNumber || ""}
          placeholder="Click to add MBA #"
          displayMode="comma-list"
        />
      </td>
      <td className="co-files row-slideable" style={slideStyle}>
        <EditableProjectField
          projectId={project.id}
          field="coFileNumbers"
          initialValue={project.coFileNumbers || ""}
          placeholder="Click to add Co File #'s"
          displayMode="comma-list"
        />
      </td>
      <td className="pmgr row-slideable" style={slideStyle}>
        {projectManager ? (
          <Link
            href={`/users/${projectManager.id}`}
            className="pmgr-link"
            onClick={(e) => isDraggingRef.current && e.preventDefault()}
          >
            {projectManager.name.split(" ").map((n) => n[0]).join("")}
          </Link>
        ) : (
          <span className="pmgr-placeholder">-</span>
        )}
      </td>
      <td className="milestone-date row-slideable" style={slideStyle}>
        {(() => {
          const nearestMilestone = getNearestMilestoneDate(project.milestones, project.milestone)
          if (project.milestones && project.milestones.length > 0) {
            const recentMilestones = filterRecentMilestones(project.milestones)
            if (recentMilestones.length === 0) {
              return <span className="milestone-neutral">No recent milestones</span>
            }
            return (
              <div className="milestone-multiple">
                {recentMilestones
                  .sort((a, b) => {
                    if (!a.date || !b.date) return 0
                    return new Date(a.date).getTime() - new Date(b.date).getTime()
                  })
                  .map((milestone, index) => {
                    if (!milestone.date) return null
                    const isNearest =
                      nearestMilestone &&
                      new Date(milestone.date).getTime() === new Date(nearestMilestone).getTime()
                    return (
                      <div
                        key={milestone.id || index}
                        className={`milestone-entry ${isNearest ? "milestone-nearest" : ""}`}
                      >
                        <span
                          className={`milestone-highlight ${getMilestoneColorClass(milestone.date)}`}
                        >
                          {formatDate(milestone.date)}
                        </span>
                        <span className="milestone-item">{milestone.item}</span>
                      </div>
                    )
                  })
                  .filter(Boolean)}
              </div>
            )
          }
          return (
            nearestMilestone && (
              <span
                className={`milestone-highlight ${getMilestoneColorClass(nearestMilestone)}`}
              >
                {formatDate(nearestMilestone)}
              </span>
            )
          )
        })()}
      </td>
      <td className="comments row-slideable" style={slideStyle}>
        <div
          className={`archive-reveal-indicator${isArchiveReady ? " archive-reveal-ready" : ""}`}
          style={{ opacity: archiveProgress }}
          aria-hidden
        >
          <span>{project.archived ? "Unarchive" : "Archive"}</span>
        </div>
        <EditableProjectField
          projectId={project.id}
          field="body"
          initialValue={project.body}
          placeholder="Click to add overview"
          multiline
          displayMode="scrollable-list"
        />
      </td>
    </tr>
  )
}
