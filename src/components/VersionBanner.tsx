"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/AuthContext"
import { getPostLoginRedirect } from "@/actions/auth"

export function VersionBanner() {
  const [visible, setVisible] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    let cancelled = false
    getPostLoginRedirect().then((path) => {
      if (!cancelled && path === "/changelog") {
        setVisible(true)
      }
    })
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => setVisible(false), 10000)
    return () => clearTimeout(timer)
  }, [visible])

  if (!visible) return null

  return (
    <div className="version-banner">
      <div className="version-banner-content">
        <div className="version-banner-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="version-banner-text">
          The app has been updated — read the changelog to see what&apos;s new.
        </span>
        <button
          className="version-banner-close"
          onClick={() => setVisible(false)}
          aria-label="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
