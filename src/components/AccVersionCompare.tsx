"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { preloadViewerScripts } from "./AccViewer"

interface AccVersionCompareProps {
  accProjectId: string
  itemId: string
  fileName: string
  urnA: string
  versionA: number
  urnB: string
  versionB: number
  open: boolean
  onClose: () => void
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace AccCompare {
    type ViewerInstance = {
      start: () => void
      finish: () => void
      resize: () => void
      fitToView: () => void
      getState: (filter: { viewport: boolean }) => unknown
      restoreState: (state: unknown, filter?: unknown) => void
      addEventListener: (event: string, callback: () => void) => void
      removeEventListener: (event: string, callback: () => void) => void
      loadDocumentNode: (doc: unknown, geometry: unknown) => Promise<unknown>
    }
  }
}

const CAMERA_CHANGE = "cameraChanged"

export function AccVersionCompare({
  fileName,
  urnA,
  versionA,
  urnB,
  versionB,
  open,
  onClose,
}: AccVersionCompareProps) {
  const [phase, setPhase] = useState<"preparing" | "loading" | "ready" | "error">("preparing")
  const [errorMsg, setErrorMsg] = useState("")
  const [statusA, setStatusA] = useState<"translating" | "loading" | "ready" | "error">("translating")
  const [statusB, setStatusB] = useState<"translating" | "loading" | "ready" | "error">("translating")
  const [progressA, setProgressA] = useState("")
  const [progressB, setProgressB] = useState("")
  const containerARef = useRef<HTMLDivElement>(null)
  const containerBRef = useRef<HTMLDivElement>(null)
  const viewerARef = useRef<AccCompare.ViewerInstance | null>(null)
  const viewerBRef = useRef<AccCompare.ViewerInstance | null>(null)
  const syncingRef = useRef(false)
  const initRef = useRef(false)

  // Ensure translations exist for both URNs
  useEffect(() => {
    if (!open || initRef.current) return
    initRef.current = true
    setPhase("preparing")

    async function init() {
      try {
        // Step 1: Get token + load scripts + start both translations — all in parallel
        const [tokenData] = await Promise.all([
          fetch("/api/acc/viewer-token").then((r) => r.json()),
          (async () => {
            if (!window.Autodesk) {
              preloadViewerScripts()
              const { getPreloadPromise } = await import("./AccViewer")
              const promise = getPreloadPromise()
              if (promise) await promise
            }
          })(),
          // Kick off translations (no-op if already translated)
          fetch("/api/acc/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ urn: urnA }),
          }),
          fetch("/api/acc/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ urn: urnB }),
          }),
        ])

        if (tokenData.error) {
          setPhase("error")
          setErrorMsg(tokenData.error)
          return
        }

        if (!window.Autodesk) {
          setPhase("error")
          setErrorMsg("Failed to load viewer scripts")
          return
        }

        // Step 2: Init viewers, then translate + load each side independently
        setPhase("loading")

        const Viewer = window.Autodesk!.Viewing.GuiViewer3D

        window.Autodesk!.Viewing.Initializer(
          {
            env: "AutodeskProduction",
            api: "derivativeV2",
            accessToken: tokenData.accessToken,
          },
          () => {
            if (!containerARef.current || !containerBRef.current) return

            const viewerA = new Viewer(containerARef.current, {
              extensions: ["Autodesk.DocumentBrowser"],
            }) as unknown as AccCompare.ViewerInstance
            viewerA.start()
            viewerARef.current = viewerA

            const viewerB = new Viewer(containerBRef.current, {
              extensions: ["Autodesk.DocumentBrowser"],
            }) as unknown as AccCompare.ViewerInstance
            viewerB.start()
            viewerBRef.current = viewerB

            // Load each side independently — whichever translates first shows first
            loadSide(viewerA, urnA, `v${versionA}`, setStatusA, setProgressA)
            loadSide(viewerB, urnB, `v${versionB}`, setStatusB, setProgressB)
          }
        )
      } catch {
        setPhase("error")
        setErrorMsg("Failed to prepare comparison")
      }
    }

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function loadSide(
    viewer: AccCompare.ViewerInstance,
    urn: string,
    label: string,
    setStatus: (s: "translating" | "loading" | "ready" | "error") => void,
    setProgress: (p: string) => void
  ) {
    // Poll translation until ready
    setStatus("translating")
    try {
      for (let i = 0; i < 60; i++) {
        const res = await fetch(`/api/acc/translate/status?urn=${urn}`)
        const data = await res.json()
        if (data.status === "success") break
        if (data.status === "failed") {
          setStatus("error")
          return
        }
        setProgress(data.progress || "0%")
        await new Promise((r) => setTimeout(r, 3000))
      }
    } catch {
      setStatus("error")
      return
    }

    // Load document
    setStatus("loading")
    try {
      await new Promise<void>((resolve, reject) => {
        window.Autodesk!.Viewing.Document.load(
          `urn:${urn}`,
          async (doc) => {
            const root = doc.getRoot() as { getDefaultGeometry: () => unknown; search?: (opts: Record<string, string>) => unknown[] }
            const geometry = root.getDefaultGeometry()
              || root.search?.({ type: "geometry", role: "2d" })?.[0]
              || root.search?.({ type: "geometry", role: "3d" })?.[0]
            if (!geometry) {
              reject("No viewable geometry")
              return
            }
            await viewer.loadDocumentNode(doc, geometry)
            resolve()
          },
          (_code, msg) => reject(msg)
        )
      })

      setStatus("ready")

      // Resize + fit once, then set up sync
      setTimeout(() => {
        viewer.resize()
        viewer.fitToView()
        trySync()
      }, 300)
    } catch {
      setStatus("error")
    }
  }

  function trySync() {
    const a = viewerARef.current
    const b = viewerBRef.current
    if (!a || !b || syncingRef.current) return
    syncingRef.current = true

    let source: "a" | "b" | null = null
    let timeout: ReturnType<typeof setTimeout> | null = null

    a.addEventListener(CAMERA_CHANGE, () => {
      if (source === "b") return
      source = "a"
      b.restoreState(a.getState({ viewport: true }))
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => { source = null }, 150)
    })

    b.addEventListener(CAMERA_CHANGE, () => {
      if (source === "a") return
      source = "b"
      a.restoreState(b.getState({ viewport: true }))
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => { source = null }, 150)
    })
  }

  // Escape to close
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  // Lock body scroll
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [open])

  const handleClose = useCallback(() => {
    if (viewerARef.current) { viewerARef.current.finish(); viewerARef.current = null }
    if (viewerBRef.current) { viewerBRef.current.finish(); viewerBRef.current = null }
    onClose()
  }, [onClose])

  if (!open) return null

  return createPortal(
    <div className="acc-viewer-overlay">
      <div className="acc-viewer-header">
        <span className="acc-viewer-filename">
          {fileName}
          <span className="acc-viewer-version"> — v{versionA} vs v{versionB}</span>
        </span>
        <button className="acc-viewer-close" onClick={handleClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="acc-compare-body">
        {/* Version labels */}
        <div className="acc-compare-labels">
          <span className="acc-compare-label">v{versionA} (newer)</span>
          <span className="acc-compare-label">v{versionB} (older)</span>
        </div>

        {/* Two viewer containers */}
        <div className="acc-compare-viewers">
          <div ref={containerARef} className="acc-compare-viewer-pane" />
          <div className="acc-compare-divider" />
          <div ref={containerBRef} className="acc-compare-viewer-pane" />
        </div>

        {/* Per-side status overlays */}
        {statusA !== "ready" && (
          <div className="acc-compare-side-overlay" style={{ left: 0, right: "50%" }}>
            {statusA === "error" ? (
              <p className="acc-viewer-error">v{versionA}: Failed to load</p>
            ) : (
              <>
                <div className="acc-spinner" />
                <p>{statusA === "translating" ? `Preparing v${versionA}... ${progressA}` : "Loading..."}</p>
              </>
            )}
          </div>
        )}
        {statusB !== "ready" && (
          <div className="acc-compare-side-overlay" style={{ left: "50%", right: 0 }}>
            {statusB === "error" ? (
              <p className="acc-viewer-error">v{versionB}: Failed to load</p>
            ) : (
              <>
                <div className="acc-spinner" />
                <p>{statusB === "translating" ? `Preparing v${versionB}... ${progressB}` : "Loading..."}</p>
              </>
            )}
          </div>
        )}

        {/* Full overlay only during initial setup */}
        {phase === "preparing" && (
          <div className="acc-viewer-status-overlay">
            <div className="acc-spinner" />
            <p>Setting up comparison...</p>
          </div>
        )}
        {phase === "error" && (
          <div className="acc-viewer-status-overlay">
            <p className="acc-viewer-error">{errorMsg}</p>
            <button className="btn btn-sm btn-outline" onClick={handleClose}>Close</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
