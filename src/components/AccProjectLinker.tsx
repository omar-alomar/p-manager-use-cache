"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { linkAccProjectAction, unlinkAccProjectAction } from "@/actions/autodesk"

type AccHub = { id: string; name: string; region: string }
type AccProject = { id: string; name: string }
type AccLink = {
  id: number
  accHubId: string
  accHubName: string
  accProjectId: string
  accProjectName: string
}

interface AccProjectLinkerProps {
  projectId: number
  projectTitle: string
  existingLinks: AccLink[]
  open: boolean
  onClose: () => void
  onLinked: (link: AccLink) => void
}

export function AccProjectLinker({
  projectId,
  projectTitle,
  existingLinks,
  open,
  onClose,
  onLinked,
}: AccProjectLinkerProps) {
  const [step, setStep] = useState<"hub" | "project">("hub")
  const [hubs, setHubs] = useState<AccHub[]>([])
  const [projects, setProjects] = useState<AccProject[]>([])
  const [selectedHub, setSelectedHub] = useState<AccHub | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [linking, setLinking] = useState<string | null>(null)
  const [needsReauth, setNeedsReauth] = useState(false)

  const linkedProjectIds = new Set(existingLinks.map((l) => l.accProjectId))

  // Fetch hubs on open
  useEffect(() => {
    if (!open) return
    setStep("hub")
    setSelectedHub(null)
    setSearch("")
    setError(null)
    setNeedsReauth(false)

    setLoading(true)
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
        // Auto-select if only one hub
        if (hubList.length === 1) {
          setSelectedHub(hubList[0])
          setStep("project")
        }
      })
      .catch(() => setError("Failed to load hubs"))
      .finally(() => setLoading(false))
  }, [open])

  // Fetch projects when hub selected
  useEffect(() => {
    if (step !== "project" || !selectedHub) return
    setLoading(true)
    setSearch("")
    setError(null)

    fetch(`/api/acc/projects?hubId=${selectedHub.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
          return
        }
        setProjects(data.projects || [])
      })
      .catch(() => setError("Failed to load projects"))
      .finally(() => setLoading(false))
  }, [step, selectedHub])

  const handleSelectHub = useCallback((hub: AccHub) => {
    setSelectedHub(hub)
    setStep("project")
  }, [])

  const handleLinkProject = useCallback(
    async (project: AccProject) => {
      if (!selectedHub) return
      setLinking(project.id)
      const result = await linkAccProjectAction(
        projectId,
        selectedHub.id,
        selectedHub.name,
        project.id,
        project.name
      )
      setLinking(null)
      if (result.success) {
        onLinked({
          id: Date.now(), // Temporary ID until next server render
          accHubId: selectedHub.id,
          accHubName: selectedHub.name,
          accProjectId: project.id,
          accProjectName: project.name,
        })
        onClose()
      } else {
        setError(result.message || "Failed to link project")
      }
    },
    [projectId, selectedHub, onLinked, onClose]
  )

  const handleBack = useCallback(() => {
    setStep("hub")
    setSelectedHub(null)
    setSearch("")
    setError(null)
  }, [])

  // Fuzzy sort by name similarity to project title
  const sortedProjects = projects
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aMatch = similarity(a.name, projectTitle)
      const bMatch = similarity(b.name, projectTitle)
      return bMatch - aMatch
    })

  if (!open) return null

  return createPortal(
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>Link ACC Project</h2>
          <button className="drawer-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="drawer-body">
          {needsReauth && (
            <div className="acc-reauth-prompt">
              <p>Connect your Autodesk account to browse projects.</p>
              <a
                href={`/api/auth/autodesk?returnTo=/projects/${projectId}`}
                className="btn btn-primary"
              >
                Connect Autodesk
              </a>
            </div>
          )}

          {error && !needsReauth && (
            <div className="acc-error-message">{error}</div>
          )}

          {loading && (
            <div className="acc-loading">
              <div className="acc-spinner" />
              <span>{step === "hub" ? "Loading hubs..." : "Loading projects..."}</span>
            </div>
          )}

          {/* Step 1: Hub selection */}
          {!loading && !needsReauth && step === "hub" && hubs.length > 0 && (
            <div className="acc-list">
              <p className="acc-step-label">Select an ACC account:</p>
              {hubs.map((hub) => (
                <button
                  key={hub.id}
                  className="acc-list-item"
                  onClick={() => handleSelectHub(hub)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9,22 9,12 15,12 15,22" />
                  </svg>
                  <span className="acc-list-item-name">{hub.name}</span>
                  <span className="acc-list-item-meta">{hub.region}</span>
                </button>
              ))}
            </div>
          )}

          {!loading && !needsReauth && step === "hub" && hubs.length === 0 && !error && (
            <div className="acc-empty">No ACC accounts found.</div>
          )}

          {/* Step 2: Project selection */}
          {!loading && !needsReauth && step === "project" && (
            <>
              {hubs.length > 1 && (
                <button className="acc-back-btn" onClick={handleBack}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15,18 9,12 15,6" />
                  </svg>
                  {selectedHub?.name}
                </button>
              )}

              <div className="acc-search-bar">
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="acc-search-input"
                  autoFocus
                />
              </div>

              <div className="acc-list">
                {sortedProjects.map((project) => {
                  const alreadyLinked = linkedProjectIds.has(project.id)
                  return (
                    <button
                      key={project.id}
                      className={`acc-list-item ${alreadyLinked ? "acc-list-item-linked" : ""}`}
                      onClick={() => !alreadyLinked && handleLinkProject(project)}
                      disabled={alreadyLinked || linking === project.id}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      <span className="acc-list-item-name">{project.name}</span>
                      {alreadyLinked && <span className="acc-list-item-badge">Linked</span>}
                      {linking === project.id && <span className="acc-list-item-badge">Linking...</span>}
                    </button>
                  )
                })}
                {sortedProjects.length === 0 && !error && (
                  <div className="acc-empty">
                    {search ? "No matching projects" : "No projects in this account"}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

// Simple string similarity (Dice coefficient on bigrams)
function similarity(a: string, b: string): number {
  const aBigrams = bigrams(a.toLowerCase())
  const bBigrams = bigrams(b.toLowerCase())
  let matches = 0
  for (const bg of aBigrams) {
    if (bBigrams.has(bg)) matches++
  }
  return (2 * matches) / (aBigrams.size + bBigrams.size) || 0
}

function bigrams(str: string): Set<string> {
  const s = new Set<string>()
  for (let i = 0; i < str.length - 1; i++) {
    s.add(str.slice(i, i + 2))
  }
  return s
}
