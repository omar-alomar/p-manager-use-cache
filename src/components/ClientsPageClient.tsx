"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Client } from "@prisma/client"
import { User } from "@prisma/client"

type ClientWithProjects = Client & {
  projects: Array<{
    id: number
    title: string
    user: User
  }>
}

interface ClientsPageClientProps {
  clients: ClientWithProjects[]
  currentUser: User
}

type SortConfig = {
  key: keyof Client | 'projectCount'
  direction: 'asc' | 'desc' | 'none'
}

export function ClientsPageClient({ clients, currentUser }: ClientsPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' })

  const handleSort = (key: keyof Client | 'projectCount') => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        const direction = prevConfig.direction === 'asc' ? 'desc' : 
                        prevConfig.direction === 'desc' ? 'none' : 'asc'
        return { key, direction }
      }
      return { key, direction: 'asc' }
    })
  }

  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = clients.filter(client => 
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        (client.phone && client.phone.toLowerCase().includes(query)) ||
        (client.address && client.address.toLowerCase().includes(query))
      )
    }

    // Sort
    if (sortConfig.direction !== 'none') {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number
        let bValue: string | number

        if (sortConfig.key === 'projectCount') {
          aValue = a.projects.length
          bValue = b.projects.length
        } else {
          aValue = a[sortConfig.key] || ''
          bValue = b[sortConfig.key] || ''
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
              <th>ADDRESS</th>
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
              <th>ACTIONS</th>
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
      <td className="client-address">
        {client.address ? (
          <span className="address-text">{client.address}</span>
        ) : (
          <span className="no-data">-</span>
        )}
      </td>
      <td className="client-projects">
        <div className="project-count">
          {client.projects.length > 0 ? (
            <Link href={`/clients/${client.id}`} className="project-count-link">
              {client.projects.length} project{client.projects.length !== 1 ? 's' : ''}
            </Link>
          ) : (
            <span className="no-data">No projects</span>
          )}
        </div>
      </td>
      <td className="client-actions">
        <div className="action-buttons">
          <Link 
            href={`/clients/${client.id}/edit`}
            className="action-btn edit"
          >
            Edit
          </Link>
          <Link 
            href={`/clients/${client.id}`}
            className="action-btn view"
          >
            View
          </Link>
        </div>
      </td>
    </tr>
  )
}
