"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { ClientForm } from "./ClientForm"

export function NewClientButton() {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerKey, setDrawerKey] = useState(0)

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setDrawerKey(prev => prev + 1)
  }, [])

  const handleSuccess = useCallback(() => {
    closeDrawer()
    router.refresh()
  }, [closeDrawer, router])

  useEffect(() => {
    if (!drawerOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [drawerOpen, closeDrawer])

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [drawerOpen])

  return (
    <>
      <button
        className="btn btn-primary"
        onClick={() => setDrawerOpen(true)}
      >
        New Client
      </button>

      {drawerOpen && createPortal(
        <>
          <div className="drawer-backdrop" onClick={closeDrawer} />
          <div className="drawer-panel">
            <div className="drawer-header">
              <h2 className="modal-title">New Client</h2>
              <button className="modal-close-btn" onClick={closeDrawer}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="drawer-body">
              <ClientForm
                key={drawerKey}
                onSuccess={handleSuccess}
                onCancel={closeDrawer}
              />
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
