"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"

type Version = {
  id: string
  versionNumber: number
  name: string
  lastModified: string | null
  lastModifiedBy: string | null
  size: number | null
  urn: string
}

interface AccFileVersionsProps {
  accProjectId: string
  itemId: string
  fileName: string
  open: boolean
  onClose: () => void
  onViewVersion: (urn: string, versionNumber: number) => void
}

export function AccFileVersions({
  accProjectId,
  itemId,
  fileName,
  open,
  onClose,
  onViewVersion,
}: AccFileVersionsProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)

    fetch(`/api/acc/versions?accProjectId=${accProjectId}&itemId=${itemId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
          return
        }
        setVersions(data.versions || [])
      })
      .catch(() => setError("Failed to load versions"))
      .finally(() => setLoading(false))
  }, [open, accProjectId, itemId])

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
      hour: "numeric",
      minute: "2-digit",
    })
  }

  if (!open) return null

  return createPortal(
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>Version History</h2>
          <button className="drawer-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="drawer-body">
          <p className="acc-versions-filename">{fileName}</p>

          {loading && (
            <div className="acc-loading">
              <div className="acc-spinner" />
              <span>Loading versions...</span>
            </div>
          )}

          {error && <div className="acc-error-message">{error}</div>}

          {!loading && !error && versions.length > 0 && (
            <div className="acc-version-list">
              {versions.map((v, i) => (
                <div key={v.id} className={`acc-version-item ${i === 0 ? "acc-version-current" : ""}`}>
                  <div className="acc-version-info">
                    <span className="acc-version-number">v{v.versionNumber}</span>
                    {i === 0 && <span className="acc-version-badge">Current</span>}
                    <span className="acc-version-date">{formatDate(v.lastModified)}</span>
                  </div>
                  <div className="acc-version-meta">
                    {v.lastModifiedBy && <span>{v.lastModifiedBy}</span>}
                    {v.size ? <span>{formatSize(v.size)}</span> : null}
                  </div>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => onViewVersion(v.urn, v.versionNumber)}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && versions.length === 0 && (
            <div className="acc-empty">No versions found</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
