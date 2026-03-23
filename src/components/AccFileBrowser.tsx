"use client"

import { useState, useEffect, useCallback } from "react"
import { AccProjectLinker } from "./AccProjectLinker"
import { AccFileVersions } from "./AccFileVersions"
import { AccViewer } from "./AccViewer"
import { unlinkAccProjectAction } from "@/actions/autodesk"

type AccLink = {
  id: number
  accHubId: string
  accHubName: string
  accProjectId: string
  accProjectName: string
}

type FolderItem = {
  id: string
  type: "folders" | "items"
  name: string
  displayName: string
  lastModified: string | null
  lastModifiedBy: string | null
  size: number | null
  fileType: string | null
  reserved: boolean
  reservedBy: string | null
}

interface AccFileBrowserProps {
  projectId: number
  projectTitle: string
  accLinks: AccLink[]
}

export function AccFileBrowser({ projectId, projectTitle, accLinks: initialLinks }: AccFileBrowserProps) {
  const [accLinks, setAccLinks] = useState(initialLinks)
  const [expanded, setExpanded] = useState(initialLinks.length > 0)
  const [linkerOpen, setLinkerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [folderStack, setFolderStack] = useState<{ id: string | null; name: string }[]>([{ id: null, name: "Root" }])
  const [items, setItems] = useState<FolderItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsReauth, setNeedsReauth] = useState(false)
  const [unlinking, setUnlinking] = useState<number | null>(null)
  const [versionsItem, setVersionsItem] = useState<{ itemId: string; name: string } | null>(null)
  const [viewerState, setViewerState] = useState<{ itemId: string; name: string; urn?: string; version?: number } | null>(null)
  const [unlockingItem, setUnlockingItem] = useState<string | null>(null)

  const activeLink = accLinks[activeTab] || null

  // Fetch folder contents when tab or folder changes
  const fetchFiles = useCallback(async (accProjectId: string, folderId: string | null, refresh = false) => {
    setLoading(true)
    setError(null)
    setNeedsReauth(false)

    const params = new URLSearchParams({ accProjectId })
    if (folderId) params.set("folderId", folderId)
    if (refresh) params.set("refresh", "1")

    try {
      const res = await fetch(`/api/acc/files?${params}`)
      const data = await res.json()

      if (data.needsReauth) {
        setNeedsReauth(true)
        return
      }
      if (data.error) {
        setError(data.error)
        return
      }
      setItems(data.items || [])
    } catch {
      setError("Failed to load files")
    } finally {
      setLoading(false)
    }
  }, [])

  // Load files when active link or folder changes
  useEffect(() => {
    if (!activeLink) return
    const currentFolder = folderStack[folderStack.length - 1]
    fetchFiles(activeLink.accProjectId, currentFolder.id)
  }, [activeLink, folderStack, fetchFiles])

  // Reset folder stack when switching tabs
  useEffect(() => {
    setFolderStack([{ id: null, name: "Root" }])
  }, [activeTab])

  const handleFolderClick = useCallback((folderId: string, folderName: string) => {
    setFolderStack((prev) => [...prev, { id: folderId, name: folderName }])
  }, [])

  const handleBreadcrumbClick = useCallback((index: number) => {
    setFolderStack((prev) => prev.slice(0, index + 1))
  }, [])

  const handleRefresh = useCallback(() => {
    if (!activeLink) return
    const currentFolder = folderStack[folderStack.length - 1]
    fetchFiles(activeLink.accProjectId, currentFolder.id, true)
  }, [activeLink, folderStack, fetchFiles])

  const handleUnlink = useCallback(async (linkId: number) => {
    setUnlinking(linkId)
    await unlinkAccProjectAction(linkId, projectId)
    setAccLinks((prev) => prev.filter((l) => l.id !== linkId))
    if (activeTab >= accLinks.length - 1 && activeTab > 0) {
      setActiveTab(activeTab - 1)
    }
    setUnlinking(null)
  }, [projectId, accLinks.length, activeTab])

  const handleUnlockFile = useCallback(async (itemId: string) => {
    if (!activeLink) return
    setUnlockingItem(itemId)
    try {
      await fetch("/api/acc/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accProjectId: activeLink.accProjectId, itemId }),
      })
      // Refresh file list
      const currentFolder = folderStack[folderStack.length - 1]
      fetchFiles(activeLink.accProjectId, currentFolder.id, true)
    } catch {
      // Silently fail
    } finally {
      setUnlockingItem(null)
    }
  }, [activeLink, folderStack, fetchFiles])

  const handleViewFile = useCallback((item: FolderItem) => {
    setViewerState({ itemId: item.id, name: item.displayName })
  }, [])

  const handleLinked = useCallback((newLink: AccLink) => {
    setAccLinks((prev) => [...prev, newLink])
    setActiveTab(accLinks.length) // Switch to the newly linked tab
    setExpanded(true)
    setFolderStack([{ id: null, name: "Root" }])
  }, [accLinks.length])

  const formatSize = (bytes: number | null) => {
    if (!bytes) return ""
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getFileIcon = (item: FolderItem) => {
    if (item.type === "folders") {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning-500, #f59e0b)" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      )
    }
    const ext = item.fileType?.toLowerCase() || item.name.split(".").pop()?.toLowerCase() || ""
    const isDwg = ext === "dwg" || ext === "dwfx" || ext === "rvt"
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isDwg ? "var(--primary-600, #4F46E5)" : "var(--neutral-400)"} strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
      </svg>
    )
  }

  return (
    <div className="acc-browser">
      <div className="acc-browser-header" onClick={() => setExpanded(!expanded)}>
        <h3 className="acc-browser-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Autodesk Files
        </h3>
        <div className="acc-browser-actions">
          {accLinks.length > 0 && expanded && (
            <>
              <button
                className="acc-icon-btn"
                onClick={(e) => { e.stopPropagation(); handleRefresh() }}
                title="Refresh"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23,4 23,10 17,10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>
              <button
                className="acc-icon-btn"
                onClick={(e) => { e.stopPropagation(); setLinkerOpen(true) }}
                title="Link another ACC project"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </>
          )}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          >
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </div>
      </div>

      {expanded && <div className="acc-browser-body">
          {/* No links — empty state */}
          {accLinks.length === 0 && !needsReauth && (
            <div className="acc-empty-state">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-300)" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
              <p>Link an ACC project to browse files and drawings.</p>
              <button className="btn btn-primary btn-sm" onClick={() => setLinkerOpen(true)}>
                Link ACC Project
              </button>
            </div>
          )}

          {/* Needs reauth */}
          {needsReauth && (
            <div className="acc-empty-state">
              <p>Connect your Autodesk account to view files.</p>
              <a
                href={`/api/auth/autodesk?returnTo=/projects/${projectId}`}
                className="btn btn-primary btn-sm"
              >
                Connect Autodesk
              </a>
            </div>
          )}

          {/* Tabs (only if multiple links) */}
          {accLinks.length > 1 && (
            <div className="acc-tabs">
              {accLinks.map((link, i) => (
                <button
                  key={link.id}
                  className={`acc-tab ${i === activeTab ? "acc-tab-active" : ""}`}
                  onClick={() => setActiveTab(i)}
                >
                  <span className="acc-tab-name">{link.accProjectName}</span>
                  <button
                    className="acc-tab-unlink"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnlink(link.id)
                    }}
                    disabled={unlinking === link.id}
                    title="Unlink"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </button>
              ))}
            </div>
          )}

          {/* Single link header */}
          {accLinks.length === 1 && activeLink && (
            <div className="acc-single-link-header">
              <span className="acc-link-name">{activeLink.accProjectName}</span>
              <button
                className="acc-unlink-btn"
                onClick={() => handleUnlink(activeLink.id)}
                disabled={unlinking === activeLink.id}
              >
                {unlinking === activeLink.id ? "Unlinking..." : "Unlink"}
              </button>
            </div>
          )}

          {/* Breadcrumbs */}
          {activeLink && folderStack.length > 1 && (
            <div className="acc-breadcrumbs">
              {folderStack.map((crumb, i) => (
                <span key={i}>
                  {i > 0 && <span className="acc-breadcrumb-sep">/</span>}
                  <button
                    className={`acc-breadcrumb ${i === folderStack.length - 1 ? "acc-breadcrumb-active" : ""}`}
                    onClick={() => handleBreadcrumbClick(i)}
                    disabled={i === folderStack.length - 1}
                  >
                    {i === 0 ? activeLink.accProjectName : crumb.name}
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && activeLink && (
            <div className="acc-loading">
              <div className="acc-spinner" />
            </div>
          )}

          {/* Error */}
          {error && activeLink && !loading && (
            <div className="acc-error-message">{error}</div>
          )}

          {/* File list */}
          {!loading && !error && activeLink && items.length > 0 && (
            <div className="acc-file-list">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`acc-file-item ${item.type === "folders" ? "acc-file-item-folder" : "acc-file-item-file"}`}
                  onClick={item.type === "folders" ? () => handleFolderClick(item.id, item.displayName) : () => handleViewFile(item)}
                >
                  <span className="acc-file-icon">{getFileIcon(item)}</span>
                  <span className="acc-file-name">{item.displayName}</span>
                  <span className="acc-file-meta">
                    {item.size ? formatSize(item.size) : ""}
                  </span>
                  {item.type === "items" && (
                    <button
                      className="acc-file-action-btn acc-versions-btn"
                      onClick={(e) => { e.stopPropagation(); setVersionsItem({ itemId: item.id, name: item.displayName }) }}
                      title="Version history"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12,6 12,12 16,14" />
                      </svg>
                    </button>
                  )}
                  <span className="acc-file-date">{formatDate(item.lastModified)}</span>
                  {item.reserved && (
                    <span className="acc-lock-badge" title={`Locked by ${item.reservedBy}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                  )}
                  {item.type === "items" && item.reserved && (
                    <button
                      className="acc-file-action-btn acc-unlock-btn"
                      onClick={(e) => { e.stopPropagation(); handleUnlockFile(item.id) }}
                      disabled={unlockingItem === item.id}
                      title="Unlock file"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty folder */}
          {!loading && !error && activeLink && items.length === 0 && (
            <div className="acc-empty">No files in this folder</div>
          )}
        </div>}

      <AccProjectLinker
        projectId={projectId}
        projectTitle={projectTitle}
        existingLinks={accLinks}
        open={linkerOpen}
        onClose={() => setLinkerOpen(false)}
        onLinked={handleLinked}
      />

      {versionsItem && activeLink && (
        <AccFileVersions
          accProjectId={activeLink.accProjectId}
          itemId={versionsItem.itemId}
          fileName={versionsItem.name}
          open={true}
          onClose={() => setVersionsItem(null)}
          onViewVersion={(urn, versionNumber) => {
            setVersionsItem(null)
            setViewerState({ itemId: versionsItem.itemId, urn, name: versionsItem.name, version: versionNumber })
          }}
        />
      )}

      {viewerState && activeLink && (
        <AccViewer
          accProjectId={activeLink.accProjectId}
          itemId={viewerState.itemId}
          urn={viewerState.urn}
          fileName={viewerState.name}
          versionNumber={viewerState.version}
          open={true}
          onClose={() => setViewerState(null)}
        />
      )}
    </div>
  )
}
