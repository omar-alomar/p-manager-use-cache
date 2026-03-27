"use client"

import { useState, useEffect, useCallback } from "react"
import { linkAccProjectAction, unlinkAccProjectAction } from "@/actions/autodesk"

type AppProject = {
  id: number
  title: string
  mbaNumber: string
}

type AccProject = {
  id: string
  name: string
}

type AccHub = {
  id: string
  name: string
}

type ExistingLink = {
  accProjectId: string
  accProjectName: string
  accHubName: string
  linkId: number
}

interface AccBulkLinkerProps {
  projects: AppProject[]
  existingLinks: Record<number, ExistingLink[]>
}

// Simple fuzzy similarity (Dice coefficient on bigrams)
function similarity(a: string, b: string): number {
  const aBi = bigrams(a.toLowerCase())
  const bBi = bigrams(b.toLowerCase())
  let matches = 0
  for (const bg of aBi) {
    if (bBi.has(bg)) matches++
  }
  return (2 * matches) / (aBi.size + bBi.size) || 0
}

function bigrams(str: string): Set<string> {
  const s = new Set<string>()
  for (let i = 0; i < str.length - 1; i++) {
    s.add(str.slice(i, i + 2))
  }
  return s
}

export function AccBulkLinker({ projects, existingLinks: initialLinks }: AccBulkLinkerProps) {
  const [hubs, setHubs] = useState<AccHub[]>([])
  const [selectedHub, setSelectedHub] = useState<AccHub | null>(null)
  const [accProjects, setAccProjects] = useState<AccProject[]>([])
  const [loadingHubs, setLoadingHubs] = useState(true)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsReauth, setNeedsReauth] = useState(false)

  // Per-row state: selected ACC project ID
  const [selections, setSelections] = useState<Record<number, string>>({})
  const [existingLinks, setExistingLinks] = useState(initialLinks)
  const [saving, setSaving] = useState<Record<number, boolean>>({})
  const [filter, setFilter] = useState<"all" | "unlinked" | "linked">("all")
  const [search, setSearch] = useState("")

  // Fetch hubs on mount
  useEffect(() => {
    fetch("/api/acc/hubs")
      .then((r) => r.json())
      .then((data) => {
        if (data.needsReauth) {
          setNeedsReauth(true)
          return
        }
        if (data.error) {
          setError(data.error)
          return
        }
        const hubList = data.hubs || []
        setHubs(hubList)
        if (hubList.length === 1) {
          setSelectedHub(hubList[0])
        }
      })
      .catch(() => setError("Failed to load hubs"))
      .finally(() => setLoadingHubs(false))
  }, [])

  // Fetch projects when hub selected
  useEffect(() => {
    if (!selectedHub) return
    setLoadingProjects(true)
    setError(null)

    fetch(`/api/acc/projects?hubId=${selectedHub.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
          return
        }
        setAccProjects(data.projects || [])
      })
      .catch(() => setError("Failed to load ACC projects"))
      .finally(() => setLoadingProjects(false))
  }, [selectedHub])

  const handleLink = useCallback(async (project: AppProject) => {
    const accProjectId = selections[project.id]
    if (!accProjectId || !selectedHub) return

    const accProject = accProjects.find((p) => p.id === accProjectId)
    if (!accProject) return

    setSaving((prev) => ({ ...prev, [project.id]: true }))
    const result = await linkAccProjectAction(
      project.id,
      selectedHub.id,
      selectedHub.name,
      accProject.id,
      accProject.name
    )

    if (result.success) {
      setExistingLinks((prev) => ({
        ...prev,
        [project.id]: [
          ...(prev[project.id] || []),
          {
            accProjectId: accProject.id,
            accProjectName: accProject.name,
            accHubName: selectedHub.name,
            linkId: Date.now(),
          },
        ],
      }))
      setSelections((prev) => {
        const next = { ...prev }
        delete next[project.id]
        return next
      })
    }
    setSaving((prev) => ({ ...prev, [project.id]: false }))
  }, [selections, selectedHub, accProjects])

  const handleUnlink = useCallback(async (projectId: number, linkId: number) => {
    setSaving((prev) => ({ ...prev, [projectId]: true }))
    await unlinkAccProjectAction(linkId, projectId)
    setExistingLinks((prev) => ({
      ...prev,
      [projectId]: (prev[projectId] || []).filter((l) => l.linkId !== linkId),
    }))
    setSaving((prev) => ({ ...prev, [projectId]: false }))
  }, [])

  const handleLinkAll = useCallback(async () => {
    const toLink = Object.entries(selections).filter(([, accId]) => accId)
    for (const [projectIdStr] of toLink) {
      const project = projects.find((p) => p.id === Number(projectIdStr))
      if (project) await handleLink(project)
    }
  }, [selections, projects, handleLink])

  // Sort ACC projects by similarity to the app project name
  const getSortedAccProjects = useCallback(
    (projectTitle: string) => {
      return [...accProjects].sort((a, b) => {
        return similarity(b.name, projectTitle) - similarity(a.name, projectTitle)
      })
    },
    [accProjects]
  )

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    if (filter === "unlinked" && (existingLinks[p.id] || []).length > 0) return false
    if (filter === "linked" && (existingLinks[p.id] || []).length === 0) return false
    if (search) {
      const q = search.toLowerCase()
      return p.title.toLowerCase().includes(q) || p.mbaNumber.toLowerCase().includes(q)
    }
    return true
  })

  const unlinkedCount = projects.filter((p) => (existingLinks[p.id] || []).length === 0).length
  const linkedCount = projects.length - unlinkedCount
  const pendingSelections = Object.values(selections).filter(Boolean).length

  if (needsReauth) {
    return (
      <div className="admin-section-card">
        <div className="admin-section-card-body">
          <div className="acc-empty-state">
            <p>Connect your Autodesk account to link projects.</p>
            <a href="/api/auth/autodesk?returnTo=/admin/acc-linking" className="btn btn-primary">
              Connect Autodesk
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-section-card">
      <div className="admin-section-card-header">
        <div className="admin-section-card-title-group">
          <div className="admin-section-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <div>
            <h2 className="admin-section-card-title">Bulk Link Projects</h2>
            <p className="admin-section-card-subtitle">
              {linkedCount} linked, {unlinkedCount} unlinked of {projects.length} projects
            </p>
          </div>
        </div>
      </div>

      <div className="admin-section-card-body">
        {/* Hub selector */}
        {loadingHubs && (
          <div className="acc-loading">
            <div className="acc-spinner" />
            <span>Loading ACC accounts...</span>
          </div>
        )}

        {!loadingHubs && hubs.length > 1 && (
          <div className="acc-bulk-hub-select">
            <label>ACC Account:</label>
            <select
              value={selectedHub?.id || ""}
              onChange={(e) => {
                const hub = hubs.find((h) => h.id === e.target.value)
                setSelectedHub(hub || null)
              }}
            >
              <option value="">Select a hub...</option>
              {hubs.map((hub) => (
                <option key={hub.id} value={hub.id}>{hub.name}</option>
              ))}
            </select>
          </div>
        )}

        {error && <div className="acc-error-message">{error}</div>}

        {loadingProjects && (
          <div className="acc-loading">
            <div className="acc-spinner" />
            <span>Loading ACC projects...</span>
          </div>
        )}

        {/* Controls */}
        {selectedHub && !loadingProjects && accProjects.length > 0 && (
          <>
            <div className="acc-bulk-controls">
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="acc-search-input"
              />
              <div className="acc-bulk-filters">
                <button
                  className={`acc-bulk-filter ${filter === "all" ? "active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  All ({projects.length})
                </button>
                <button
                  className={`acc-bulk-filter ${filter === "unlinked" ? "active" : ""}`}
                  onClick={() => setFilter("unlinked")}
                >
                  Unlinked ({unlinkedCount})
                </button>
                <button
                  className={`acc-bulk-filter ${filter === "linked" ? "active" : ""}`}
                  onClick={() => setFilter("linked")}
                >
                  Linked ({linkedCount})
                </button>
              </div>
              {pendingSelections > 0 && (
                <button className="btn btn-primary btn-sm" onClick={handleLinkAll}>
                  Link {pendingSelections} selected
                </button>
              )}
            </div>

            {/* Project rows */}
            <div className="acc-bulk-list">
              {filteredProjects.map((project) => {
                const links = existingLinks[project.id] || []
                const sorted = getSortedAccProjects(project.title)
                const topMatch = sorted[0]
                const topSimilarity = topMatch ? similarity(topMatch.name, project.title) : 0
                const isSaving = saving[project.id]

                return (
                  <div key={project.id} className={`acc-bulk-row ${links.length > 0 ? "acc-bulk-row-linked" : ""}`}>
                    <div className="acc-bulk-project">
                      <span className="acc-bulk-project-name">{project.title}</span>
                      {project.mbaNumber && (
                        <span className="acc-bulk-project-mba">{project.mbaNumber}</span>
                      )}
                    </div>

                    <div className="acc-bulk-link-area">
                      {links.length > 0 ? (
                        <div className="acc-bulk-linked-tags">
                          {links.map((link) => (
                            <span key={link.accProjectId} className="acc-bulk-linked-tag">
                              {link.accProjectName}
                              <button
                                className="acc-bulk-linked-tag-remove"
                                onClick={() => handleUnlink(project.id, link.linkId)}
                                disabled={isSaving}
                                title="Unlink"
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="acc-bulk-select-row">
                          <select
                            value={selections[project.id] || ""}
                            onChange={(e) =>
                              setSelections((prev) => ({ ...prev, [project.id]: e.target.value }))
                            }
                            className="acc-bulk-select"
                          >
                            <option value="">Select ACC project...</option>
                            {sorted.map((accP) => (
                              <option key={accP.id} value={accP.id}>
                                {accP.name}
                              </option>
                            ))}
                          </select>
                          {topSimilarity > 0.4 && !selections[project.id] && (
                            <span className="acc-bulk-hint">
                              Best match: {topMatch.name} ({Math.round(topSimilarity * 100)}%)
                            </span>
                          )}
                          {selections[project.id] && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleLink(project)}
                              disabled={isSaving}
                            >
                              {isSaving ? "..." : "Link"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {selectedHub && !loadingProjects && accProjects.length === 0 && !error && (
          <div className="acc-empty">No projects found in this ACC account</div>
        )}
      </div>
    </div>
  )
}
