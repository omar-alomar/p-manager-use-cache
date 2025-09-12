"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Client } from "@prisma/client"
import { User } from "@prisma/client"
import { InlineEditableField } from "@/components/InlineEditableField"

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

type SortConfig = {
  key: keyof Client | 'projectCount'
  direction: 'asc' | 'desc' | 'none'
}

export function ClientsPageClient({ clients }: ClientsPageClientProps) {
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
        (client.companyName && client.companyName.toLowerCase().includes(query)) ||
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
          const aRaw = a[sortConfig.key]
          const bRaw = b[sortConfig.key]
          
          // Handle Date objects
          if (aRaw instanceof Date && bRaw instanceof Date) {
            aValue = aRaw.getTime()
            bValue = bRaw.getTime()
          } else {
            aValue = (aRaw instanceof Date ? aRaw.getTime() : aRaw) || ''
            bValue = (bRaw instanceof Date ? bRaw.getTime() : bRaw) || ''
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
            href={`/clients/${client.id}/edit?from=clients-list`}
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
