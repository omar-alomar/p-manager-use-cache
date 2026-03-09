"use client"

import { useState, useTransition } from "react"
import { toggleMaintenanceAction } from "@/actions/admin"

interface MaintenanceToggleProps {
  initialEnabled: boolean
}

export function MaintenanceToggle({ initialEnabled }: MaintenanceToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    const newValue = !enabled
    startTransition(async () => {
      const result = await toggleMaintenanceAction(newValue)
      if (result.success) {
        setEnabled(newValue)
      }
    })
  }

  return (
    <div className="maintenance-toggle-card">
      <div className="maintenance-toggle-content">
        <div className="maintenance-toggle-info">
          <div className="maintenance-toggle-label">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M8 1L1 4.5V8C1 11.87 4 15.35 8 16C12 15.35 15 11.87 15 8V4.5L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
              <path d="M6 8L7.5 9.5L10.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Maintenance Mode
          </div>
          <div className="maintenance-toggle-description">
            {enabled
              ? "Site is in maintenance mode. Only admins can access it."
              : "Site is live and accessible to all users."
            }
          </div>
        </div>
        <button
          type="button"
          className={`maintenance-switch ${enabled ? "maintenance-switch--on" : ""}`}
          onClick={handleToggle}
          disabled={isPending}
          aria-label={enabled ? "Disable maintenance mode" : "Enable maintenance mode"}
        >
          <span className="maintenance-switch-thumb" />
        </button>
      </div>
      {enabled && (
        <div className="maintenance-toggle-warning">
          All non-admin users will see a maintenance page.
        </div>
      )}
    </div>
  )
}
