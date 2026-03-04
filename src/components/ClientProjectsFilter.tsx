"use client"

import { useState } from "react"
import type { ReactNode } from "react"

export function ClientProjectsFilter({
  activeProjects,
  archivedProjects,
}: {
  activeProjects: ReactNode
  archivedProjects: ReactNode
}) {
  const [view, setView] = useState<"active" | "archived">("active")

  return (
    <>
      <div className="client-projects-tabs">
        <button
          className={`client-projects-tab ${view === "active" ? "active" : ""}`}
          onClick={() => setView("active")}
        >
          Active
        </button>
        <button
          className={`client-projects-tab ${view === "archived" ? "active" : ""}`}
          onClick={() => setView("archived")}
        >
          Archived
        </button>
      </div>
      {view === "active" ? activeProjects : archivedProjects}
    </>
  )
}
