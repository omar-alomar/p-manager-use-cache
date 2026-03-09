"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { Client } from "@prisma/client"
import { User } from "@prisma/client"
import { InlineEditableField } from "@/components/InlineEditableField"
import { useSessionSort } from "@/hooks/useSessionSort"

type ClientWithProjects = Client & {
  projects: Array<{
    id: number
    title: string
    user: User
  }>
}

interface ClientsPageClientProps {
  clients: ClientWithProjects[]
}

type ClientSortKey = keyof Client | 'projectCount'

export function ClientsPageClient({ clients }: ClientsPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { sortConfig, handleSort, resetSort } = useSessionSort<ClientSortKey>('clientsSortConfig', { key: 'name', direction: 'asc' })

  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = clients.filter(client => 
        client.name.toLowerCase().includes(query) ||
        (client.companyName && client.companyName.toLowerCase().includes(query)) ||
        client.email.toLowerCase().includes(query) ||
        (client.phone && client.phone.toLowerCase().includes(query)) ||
        (client.address && client.address.toLowerCase().includes(query))
      )
    }

    // Sort
    if (sortConfig.key && sortConfig.direction !== 'none') {
      const key = sortConfig.key
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number
        let bValue: string | number

        if (key === 'projectCount') {
          aValue = a.projects.length
          bValue = b.projects.length
        } else {
          const aRaw = a[key]
          const bRaw = b[key]
          
          // Handle Date objects - check for null/undefined before calling getTime()
          const aIsDate = aRaw instanceof Date
          const bIsDate = bRaw instanceof Date
          
          if (aIsDate && bIsDate) {
            aValue = aRaw.getTime()
            bValue = bRaw.getTime()
          } else if (aIsDate) {
            // aRaw is Date, bRaw might be null/undefined
            aValue = aRaw.getTime()
            bValue = bIsDate ? bRaw.getTime() : (bRaw ?? '')
          } else if (bIsDate) {
            // bRaw is Date, aRaw might be null/undefined
            aValue = aIsDate ? aRaw.getTime() : (aRaw ?? '')
            bValue = bRaw.getTime()
          } else {
            // Neither is a Date
            aValue = aRaw ?? ''
            bValue = bRaw ?? ''
          }
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    return filtered
  }, [clients, searchQuery, sortConfig])

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
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-group">
          <div className="filter-stats">
            Showing {filteredAndSortedClients.length} of {clients.length} clients
          </div>
        </div>

        {(searchQuery || sortConfig.key !== 'name' || sortConfig.direction !== 'asc') && (
          <div className="filter-group filter-group-right">
            <button
              type="button"
              className="filter-reset-btn"
              title="Reset filters"
              onClick={() => {
                setSearchQuery("")
                resetSort()
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 1 9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 22v-6h6"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Clients Table */}
      <div className="projects-table-container">
        <table className="projects-table">
          <thead>
            <tr>
              <th 
                className="sortable-header" 
                onClick={() => handleSort('name')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                CLIENT NAME
                {sortConfig.key === 'name' && sortConfig.direction !== 'none' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                className="sortable-header" 
                onClick={() => handleSort('companyName')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                COMPANY
                {sortConfig.key === 'companyName' && sortConfig.direction !== 'none' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                className="sortable-header" 
                onClick={() => handleSort('email')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                EMAIL
                {sortConfig.key === 'email' && sortConfig.direction !== 'none' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th>PHONE</th>
              <th
                className="sortable-header"
                onClick={() => handleSort('projectCount')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                PROJECTS
                {sortConfig.key === 'projectCount' && sortConfig.direction !== 'none' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th
                className="sortable-header"
                onClick={() => handleSort('address')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                ADDRESS
                {sortConfig.key === 'address' && sortConfig.direction !== 'none' && (
                  <span style={{ marginLeft: '4px' }}>
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedClients.map((client) => (
              <ClientRow key={client.id} client={client} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ClientRow({ client }: { client: ClientWithProjects }) {
  return (
    <tr>
      <td className="project-name-cell">
        <Link href={`/clients/${client.id}`} className="project-name-link">
          <div className="project-name-link-content">
            <div className="project-name">{client.name}</div>
            <div className="project-client">{client.email}</div>
          </div>
        </Link>
      </td>
      <td className="client-company">
        <InlineEditableField
          clientId={client.id}
          field="companyName"
          value={client.companyName}
          placeholder="Add company name"
          className="company-name"
        />
      </td>
      <td className="client-email">
        <a href={`mailto:${client.email}`} className="email-link">
          {client.email}
        </a>
      </td>
      <td className="client-phone">
        {client.phone ? (
          <a href={`tel:${client.phone}`} className="phone-link">
            {client.phone}
          </a>
        ) : (
          <span className="no-data">-</span>
        )}
      </td>
      <ProjectsCell client={client} />
      <td className="client-address">
        <InlineEditableField
          clientId={client.id}
          field="address"
          value={client.address}
          placeholder="Add address"
          className="company-name"
          multiline={true}
        />
      </td>
    </tr>
  )
}

function ProjectsCell({ client }: { client: ClientWithProjects }) {
  const pillRef = useRef<HTMLAnchorElement>(null)
  const [popover, setPopover] = useState<{ top: number; left: number } | null>(null)

  const showPopover = useCallback(() => {
    const el = pillRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPopover({ top: rect.top, left: rect.left + rect.width / 2 })
  }, [])

  const hidePopover = useCallback(() => setPopover(null), [])

  const projects = client.projects
  if (!projects || projects.length === 0) {
    return (
      <td className="active-tasks">
        <span className="active-task-count-zero">0</span>
      </td>
    )
  }

  return (
    <td className="active-tasks">
      <div
        className="active-tasks-wrapper"
        onMouseEnter={showPopover}
        onMouseLeave={hidePopover}
      >
        <Link
          ref={pillRef}
          href={`/clients/${client.id}`}
          className="active-task-count"
        >
          {projects.length}
        </Link>
        {popover && createPortal(
          <div
            className="active-tasks-popover"
            style={{ top: popover.top, left: popover.left }}
          >
            <div className="active-tasks-popover-header">
              Projects ({projects.length})
            </div>
            <ul className="active-tasks-popover-list">
              {projects.map(project => (
                <li key={project.id} className="active-tasks-popover-item">
                  <Link href={`/projects/${project.id}`} className="active-tasks-popover-title" style={{ textDecoration: 'none', color: 'inherit' }}>
                    {project.title}
                  </Link>
                  <span className="active-tasks-popover-manager">{project.user.name}</span>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}
      </div>
    </td>
  )
}
