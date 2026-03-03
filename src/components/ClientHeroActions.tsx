"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { ClientForm } from "./ClientForm"
import { DeleteClientButton } from "@/app/clients/[clientId]/_DeleteButton"

interface ClientHeroActionsProps {
  clientId: number
  initialData: {
    name: string
    companyName?: string
    email: string
    phone?: string
    address?: string
  }
}

export function ClientHeroActions({ clientId, initialData }: ClientHeroActionsProps) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerKey, setDrawerKey] = useState(0)

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setDrawerKey(prev => prev + 1)
  }, [])

  const handleDrawerSuccess = useCallback(() => {
    closeDrawer()
    router.refresh()
  }, [closeDrawer, router])

  // Escape key closes drawer
  useEffect(() => {
    if (!drawerOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [drawerOpen, closeDrawer])

  // Lock body scroll while drawer is open
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
        onClick={() => setDrawerOpen(true)}
        className="hero-action-btn primary"
      >
        Edit Client
      </button>
      <DeleteClientButton clientId={clientId} />

      {drawerOpen && createPortal(
        <>
          <div className="drawer-backdrop" onClick={closeDrawer} />
          <div className="drawer-panel">
            <div className="drawer-header">
              <h2 className="modal-title">Edit Client</h2>
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
                initialData={initialData}
                clientId={clientId}
                isEdit
                onSuccess={handleDrawerSuccess}
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
