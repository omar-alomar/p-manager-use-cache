"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"

interface AccViewerProps {
  accProjectId: string
  itemId: string
  urn?: string // Pre-resolved URN (from version history)
  fileName: string
  versionNumber?: number
  open: boolean
  onClose: () => void
}

// Declare the Autodesk global
declare global {
  interface Window {
    Autodesk?: {
      Viewing: {
        Initializer: (options: unknown, callback: () => void) => void
        GuiViewer3D: new (container: HTMLElement, options?: Record<string, unknown>) => {
          start: () => void
          finish: () => void
          resize: () => void
          fitToView: () => void
          loadDocumentNode: (doc: unknown, geometry: unknown) => Promise<unknown>
        }
        Document: {
          load: (
            urn: string,
            onSuccess: (doc: { getRoot: () => { getDefaultGeometry: () => unknown } }) => void,
            onError: (code: number, msg: string) => void
          ) => void
        }
      }
    }
  }
}

export function AccViewer({ accProjectId, itemId, urn: preResolvedUrn, fileName, versionNumber, open, onClose }: AccViewerProps) {
  const [phase, setPhase] = useState<"translating" | "loading-viewer" | "ready" | "error">("translating")
  const [progress, setProgress] = useState("0%")
  const [errorMsg, setErrorMsg] = useState("")
  const viewerRef = useRef<HTMLDivElement>(null)
  const viewerInstanceRef = useRef<ReturnType<typeof createViewer> | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resolvedUrnRef = useRef("")
  const formatRef = useRef("svf2")

  // Start translation + poll
  useEffect(() => {
    if (!open) return
    setPhase("translating")
    setProgress("0%")
    setErrorMsg("")

    let cancelled = false

    resolvedUrnRef.current = preResolvedUrn || ""

    async function startTranslation() {
      try {
        const translateBody = preResolvedUrn
          ? { urn: preResolvedUrn }
          : { accProjectId, itemId }

        const res = await fetch("/api/acc/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(translateBody),
        })
        const data = await res.json()

        if (cancelled) return

        if (data.error) {
          setPhase("error")
          setErrorMsg(data.error)
          return
        }

        // Server resolved the URN for us
        if (data.urn) resolvedUrnRef.current = data.urn
        if (data.format) formatRef.current = data.format

        if (data.status === "success") {
          setPhase("loading-viewer")
          return
        }

        // Poll for translation status
        pollingRef.current = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/acc/translate/status?urn=${resolvedUrnRef.current}`)
            const statusData = await statusRes.json()

            if (cancelled) return

            if (statusData.format) formatRef.current = statusData.format

            if (statusData.status === "success") {
              if (pollingRef.current) clearInterval(pollingRef.current)
              setPhase("loading-viewer")
            } else if (statusData.status === "failed") {
              if (pollingRef.current) clearInterval(pollingRef.current)
              setPhase("error")
              setErrorMsg("File could not be prepared for viewing")
            } else {
              setProgress(statusData.progress || "0%")
            }
          } catch {
            // Keep polling on transient errors
          }
        }, 3000)
      } catch {
        if (!cancelled) {
          setPhase("error")
          setErrorMsg("Failed to start translation")
        }
      }
    }

    startTranslation()

    return () => {
      cancelled = true
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [open, preResolvedUrn, accProjectId, itemId])

  // Load viewer scripts + initialize (runs once when phase transitions to loading-viewer)
  const hasInitializedRef = useRef(false)
  useEffect(() => {
    if (phase !== "loading-viewer" || hasInitializedRef.current) return
    hasInitializedRef.current = true

    async function loadViewer() {
      console.log("ACC Viewer: loading scripts...")
      // Load Autodesk Viewer CSS/JS from CDN if not already loaded
      if (!window.Autodesk) {
        try {
          await loadScript("https://developer.api.autodesk.com/modelderivative/v2/viewers/7.100/viewer3D.min.js")
          loadStylesheet("https://developer.api.autodesk.com/modelderivative/v2/viewers/7.100/style.min.css")
        } catch (e) {
          console.error("ACC Viewer: failed to load viewer scripts", e)
          setPhase("error")
          setErrorMsg("Failed to load viewer scripts")
          return
        }
      }

      console.log("ACC Viewer: scripts loaded, getting token...")

      // Get token
      const tokenRes = await fetch("/api/acc/viewer-token")
      const tokenData = await tokenRes.json()
      if (tokenData.error) {
        setPhase("error")
        setErrorMsg(tokenData.error)
        return
      }

      const urnToLoad = resolvedUrnRef.current
      const format = formatRef.current
      console.log("ACC Viewer: initializing. URN:", urnToLoad, "Format:", format)

      // Initialize viewer — use AutodeskProduction which works for both SVF and SVF2
      window.Autodesk!.Viewing.Initializer(
        {
          env: "AutodeskProduction",
          api: "derivativeV2",
          accessToken: tokenData.accessToken,
        },
        () => {
          if (!viewerRef.current) {
            console.error("ACC Viewer: viewerRef is null")
            return
          }

          console.log("ACC Viewer: creating GuiViewer3D...")
          const viewer = new window.Autodesk!.Viewing.GuiViewer3D(viewerRef.current, {
            extensions: ["Autodesk.DocumentBrowser"],
          })
          viewer.start()
          viewerInstanceRef.current = viewer

          console.log("ACC Viewer: loading document urn:" + urnToLoad)
          window.Autodesk!.Viewing.Document.load(
            `urn:${urnToLoad}`,
            (doc) => {
              console.log("ACC Viewer: document loaded, getting geometry...")
              const geometry = doc.getRoot().getDefaultGeometry()
              if (!geometry) {
                console.error("ACC Viewer: no default geometry found")
                setPhase("error")
                setErrorMsg("No viewable geometry found in this file")
                return
              }
              console.log("ACC Viewer: loading geometry into viewer...")
              viewer.loadDocumentNode(doc, geometry)
              // Give the viewer a moment to initialize its canvas, then reveal
              setTimeout(() => {
                viewer.resize()
                viewer.fitToView()
                setPhase("ready")
              }, 500)
            },
            (code, msg) => {
              console.error("ACC Viewer: Document.load failed. Code:", code, "Message:", msg)
              setPhase("error")
              setErrorMsg(msg || `Failed to load document (error ${code})`)
            }
          )
        }
      )
    }

    loadViewer()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

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
    if (pollingRef.current) clearInterval(pollingRef.current)
    if (viewerInstanceRef.current) {
      viewerInstanceRef.current.finish()
      viewerInstanceRef.current = null
    }
    onClose()
  }, [onClose])

  if (!open) return null

  return createPortal(
    <div className="acc-viewer-overlay">
      <div className="acc-viewer-header">
        <span className="acc-viewer-filename">
          {fileName}
          {versionNumber != null && <span className="acc-viewer-version"> (v{versionNumber})</span>}
        </span>
        <button className="acc-viewer-close" onClick={handleClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="acc-viewer-body">
        {/* Canvas is always rendered with full dimensions — viewer needs real size for WebGL */}
        <div ref={viewerRef} className="acc-viewer-canvas" />

        {/* Status overlay sits on top of the canvas */}
        {phase !== "ready" && (
          <div className="acc-viewer-status-overlay">
            {phase === "translating" && (
              <>
                <div className="acc-spinner" />
                <p>Preparing file for viewing...</p>
                <p className="acc-viewer-progress">{progress}</p>
              </>
            )}
            {phase === "loading-viewer" && (
              <>
                <div className="acc-spinner" />
                <p>Loading viewer...</p>
              </>
            )}
            {phase === "error" && (
              <>
                <p className="acc-viewer-error">{errorMsg}</p>
                <button className="btn btn-sm btn-outline" onClick={handleClose}>Close</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// --- Helpers ---

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

function loadStylesheet(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = href
  document.head.appendChild(link)
}

// Type helper
function createViewer(container: HTMLElement) {
  return new window.Autodesk!.Viewing.GuiViewer3D(container)
}
