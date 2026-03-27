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
  onCompareVersions: (urnA: string, versionA: number, urnB: string, versionB: number) => void
}

export function AccFileVersions({
  accProjectId,
  itemId,
  fileName,
  open,
  onClose,
  onViewVersion,
  onCompareVersions,
}: AccFileVersionsProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<Version[]>([])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    setCompareMode(false)
    setSelectedForCompare([])

    fetch(`/api/acc/versions?accProjectId=${accProjectId}&itemId=${itemId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
          return
        }
        const versionList = data.versions || []
        setVersions(versionList)

        // Pre-trigger translations for all versions in background
        // so they're ready by the time user picks versions to compare
        for (const v of versionList) {
          fetch("/api/acc/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ urn: v.urn }),
          }).catch(() => {}) // fire and forget
        }
      })
      .catch(() => setError("Failed to load versions"))
      .finally(() => setLoading(false))
  }, [open, accProjectId, itemId])

  const toggleCompareSelect = (v: Version) => {
    setSelectedForCompare((prev) => {
      const exists = prev.find((s) => s.id === v.id)
      if (exists) return prev.filter((s) => s.id !== v.id)
      if (prev.length >= 2) return [prev[1], v] // Replace oldest selection
      return [...prev, v]
    })
  }

  const handleCompare = () => {
    if (selectedForCompare.length !== 2) return
    // Sort so newer version is A (left), older is B (right)
    const sorted = [...selectedForCompare].sort((a, b) => b.versionNumber - a.versionNumber)
    onCompareVersions(sorted[0].urn, sorted[0].versionNumber, sorted[1].urn, sorted[1].versionNumber)
  }

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
          <div className="acc-versions-header">
            <p className="acc-versions-filename">{fileName}</p>
            {versions.length >= 2 && (
              <button
                className={`acc-compare-toggle ${compareMode ? "active" : ""}`}
                onClick={() => {
                  setCompareMode(!compareMode)
                  setSelectedForCompare([])
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                {compareMode ? "Cancel" : "Compare"}
              </button>
            )}
          </div>

          {compareMode && (
            <div className="acc-compare-bar">
              <span className="acc-compare-bar-text">
                {selectedForCompare.length === 0 && "Select two versions to compare"}
                {selectedForCompare.length === 1 && `v${selectedForCompare[0].versionNumber} selected — pick another`}
                {selectedForCompare.length === 2 && `v${selectedForCompare[0].versionNumber} vs v${selectedForCompare[1].versionNumber}`}
              </span>
              {selectedForCompare.length === 2 && (
                <button className="btn btn-primary btn-sm" onClick={handleCompare}>
                  Compare
                </button>
              )}
            </div>
          )}

          {loading && (
            <div className="acc-loading">
              <div className="acc-spinner" />
              <span>Loading versions...</span>
            </div>
          )}

          {error && <div className="acc-error-message">{error}</div>}

          {!loading && !error && versions.length > 0 && (
            <div className="acc-version-list">
              {versions.map((v, i) => {
                const isSelected = selectedForCompare.some((s) => s.id === v.id)
                return (
                  <div
                    key={v.id}
                    className={`acc-version-item ${i === 0 ? "acc-version-current" : ""} ${compareMode && isSelected ? "acc-version-selected" : ""}`}
                    onClick={compareMode ? () => toggleCompareSelect(v) : undefined}
                    style={compareMode ? { cursor: "pointer" } : undefined}
                  >
                    {compareMode && (
                      <span className={`acc-version-checkbox ${isSelected ? "checked" : ""}`}>
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        )}
                      </span>
                    )}
                    <div className="acc-version-info">
                      <span className="acc-version-number">v{v.versionNumber}</span>
                      {i === 0 && <span className="acc-version-badge">Current</span>}
                      <span className="acc-version-date">{formatDate(v.lastModified)}</span>
                    </div>
                    <div className="acc-version-meta">
                      {v.lastModifiedBy && <span>{v.lastModifiedBy}</span>}
                      {v.size ? <span>{formatSize(v.size)}</span> : null}
                    </div>
                    {!compareMode && (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => onViewVersion(v.urn, v.versionNumber)}
                      >
                        View
                      </button>
                    )}
                  </div>
                )
              })}
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
