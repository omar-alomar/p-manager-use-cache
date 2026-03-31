"use client"

import { useState, useEffect, useTransition } from "react"
import { createPortal } from "react-dom"
import { saveTimeEntryAction } from "@/actions/timesheets"
import { hoursToHMM, hmmToHours } from "@/utils/dateUtils"

interface EntryData {
  id: number
  projectId: number
  taskId: number | null
  hours: number
  billable: boolean
  note: string | null
}

interface ProjectOption {
  id: number
  title: string
  tasks: { id: number; title: string }[]
}

interface Props {
  date: string
  entry: EntryData | null // null = new entry
  projects: ProjectOption[]
  onClose: () => void
  onSaved: () => void
}

export function TimesheetEntryDrawer({ date, entry, projects, onClose, onSaved }: Props) {
  const [projectId, setProjectId] = useState<number | "">(entry?.projectId ?? "")
  const [category, setCategory] = useState<"billable" | "nonbillable">(
    entry?.billable === false ? "nonbillable" : "billable"
  )
  const [taskId, setTaskId] = useState<number | "">(entry?.taskId ?? "")
  const [note, setNote] = useState(entry?.note ?? "")
  const [duration, setDuration] = useState(entry ? hoursToHMM(entry.hours) : "")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  // Tasks for the selected project
  const selectedProject = projects.find((p) => p.id === projectId)
  const availableTasks = selectedProject?.tasks ?? []

  // Reset task when project changes
  useEffect(() => {
    if (!entry) setTaskId("")
  }, [projectId, entry])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!projectId) {
      setError("Project is required")
      return
    }

    const hours = hmmToHours(duration)
    if (hours === null || hours <= 0) {
      setError("Enter a valid duration (e.g. 4:00 or 1:30)")
      return
    }
    if (hours > 24) {
      setError("Duration cannot exceed 24 hours")
      return
    }

    startTransition(async () => {
      const result = await saveTimeEntryAction({
        projectId: projectId as number,
        taskId: taskId || null,
        date,
        hours,
        billable: category === "billable",
        note: note.trim() || null,
      })

      if (result.success) {
        onSaved()
      } else {
        setError(result.message)
      }
    })
  }

  return createPortal(
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel">
        <div className="drawer-header">
          <h2>{entry ? "Edit Entry" : "New timesheet entry"}</h2>
          <button className="drawer-close" onClick={onClose}>&times;</button>
        </div>
        <div className="drawer-body">
          <form onSubmit={handleSubmit} className="form">
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>{error}</div>
            )}

            {/* Project */}
            <div className="form-group">
              <label>Project *</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : "")}
                required
              >
                <option value="">Select a project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="form-group">
              <label>Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as "billable" | "nonbillable")}
              >
                <option value="billable">Billable</option>
                <option value="nonbillable">Non-billable</option>
              </select>
            </div>

            {/* Task */}
            <div className="form-group">
              <label>Task</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <select
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value ? Number(e.target.value) : "")}
                  style={{ flex: 1 }}
                  disabled={!projectId || availableTasks.length === 0}
                >
                  <option value="">
                    {!projectId ? "Select a project first" : availableTasks.length === 0 ? "No tasks" : "Select a task..."}
                  </option>
                  {availableTasks.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
                {taskId && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => setTaskId("")}
                    style={{ flexShrink: 0 }}
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* Notes + Duration side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "start" }}>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Optional notes..."
                  maxLength={200}
                />
              </div>
              <div className="form-group">
                <label>Duration *</label>
                <input
                  type="text"
                  className="timesheet-duration-input"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="0:00"
                  required
                  autoComplete="off"
                />
                <span className="timesheet-duration-hint">H:MM format</span>
              </div>
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isPending}
              >
                {isPending ? "Saving..." : "Save Entry"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  )
}
