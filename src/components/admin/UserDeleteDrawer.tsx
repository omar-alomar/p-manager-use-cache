"use client"

import React, { useState, useEffect, useTransition } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { getUserDeletionImpactAction, deleteUserAction } from "@/actions/users"

interface User {
  id: number
  name: string
}

interface DeletionImpact {
  user: { id: number; name: string }
  projects: { id: number; title: string }[]
  projectTasks: { id: number; title: string; completed: boolean }[]
  stragglerTasks: { id: number; title: string }[]
}

interface UserDeleteDrawerProps {
  user: User
  allUsers: User[]
  onClose: () => void
}

export function UserDeleteDrawer({ user, allUsers, onClose }: UserDeleteDrawerProps) {
  const [impact, setImpact] = useState<DeletionImpact | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reassignToUserId, setReassignToUserId] = useState<number | "">("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Users eligible for reassignment (everyone except the user being deleted)
  const eligibleUsers = allUsers.filter(u => u.id !== user.id)

  useEffect(() => {
    getUserDeletionImpactAction(user.id)
      .then(setImpact)
      .catch((err) => setError(err.message || "Failed to load deletion impact"))
      .finally(() => setLoading(false))
  }, [user.id])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  const hasAssetsToReassign = impact && (
    impact.projects.length > 0 || impact.stragglerTasks.length > 0 || impact.projectTasks.length > 0
  )

  const canDelete = !loading && !error && (
    !hasAssetsToReassign || reassignToUserId !== ""
  )

  const handleDelete = () => {
    if (!canDelete) return

    const targetId = hasAssetsToReassign ? reassignToUserId : eligibleUsers[0]?.id
    if (!targetId) return

    startTransition(async () => {
      const result = await deleteUserAction(user.id, targetId)
      if (result && "success" in result && !result.success) {
        setError(("message" in result ? result.message : "Failed to delete user") as string)
        return
      }
      router.refresh()
      onClose()
    })
  }

  return createPortal(
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel">
        <div className="drawer-header">
          <h2 className="modal-title">Delete User: {user.name}</h2>
          <button className="modal-close-btn" onClick={onClose} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="drawer-body">
          {loading && (
            <div className="admin-empty">
              <div className="spinner-ring" style={{ width: 24, height: 24 }}></div>
              <p>Checking impact...</p>
            </div>
          )}

          {error && (
            <div className="error-message" style={{ marginBottom: "1rem" }}>{error}</div>
          )}

          {impact && !loading && (
            <>
              <div className="user-delete-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>Deleting <strong>{user.name}</strong> will permanently remove their comments, mentions, and notifications.</span>
              </div>

              {hasAssetsToReassign ? (
                <>
                  <h3 className="user-delete-section-title">Assets to Reassign</h3>

                  {impact.projects.length > 0 && (
                    <div className="user-delete-impact-group">
                      <div className="user-delete-impact-header">
                        <span className="user-delete-impact-count">{impact.projects.length}</span>
                        <span>project{impact.projects.length !== 1 ? "s" : ""} managed</span>
                      </div>
                      <ul className="user-delete-impact-list">
                        {impact.projects.map(p => (
                          <li key={p.id}>{p.title}</li>
                        ))}
                      </ul>
                      {impact.projectTasks.length > 0 && (
                        <p className="user-delete-impact-note">
                          + {impact.projectTasks.length} task{impact.projectTasks.length !== 1 ? "s" : ""} on these projects assigned to {user.name}
                        </p>
                      )}
                    </div>
                  )}

                  {impact.stragglerTasks.length > 0 && (
                    <div className="user-delete-impact-group">
                      <div className="user-delete-impact-header">
                        <span className="user-delete-impact-count">{impact.stragglerTasks.length}</span>
                        <span>standalone uncompleted task{impact.stragglerTasks.length !== 1 ? "s" : ""}</span>
                      </div>
                      <ul className="user-delete-impact-list">
                        {impact.stragglerTasks.map(t => (
                          <li key={t.id}>{t.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="form-group" style={{ marginTop: "1.5rem" }}>
                    <label htmlFor="reassign-to">Reassign all assets to *</label>
                    <select
                      id="reassign-to"
                      value={reassignToUserId}
                      onChange={(e) => setReassignToUserId(e.target.value ? Number(e.target.value) : "")}
                      required
                    >
                      <option value="">Select a user...</option>
                      {eligibleUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <p className="user-delete-no-assets">
                  {user.name} has no projects or uncompleted tasks to reassign.
                </p>
              )}

              <div className="form-actions" style={{ marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-outline"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="btn btn-danger"
                  disabled={!canDelete || isPending}
                >
                  {isPending ? (
                    <>
                      <span className="btn-spinner"></span>
                      Deleting...
                    </>
                  ) : (
                    "Delete User"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
