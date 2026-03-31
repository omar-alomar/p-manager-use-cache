"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { formatDailyDate, toDateKey, hoursToHMM } from "@/utils/dateUtils"
import { deleteTimeEntryAction, copyPreviousEntriesAction } from "@/actions/timesheets"
import { TimesheetEntryDrawer } from "./TimesheetEntryDrawer"

interface TimeEntryData {
  id: number
  projectId: number
  projectTitle: string
  taskId: number | null
  taskTitle: string | null
  hours: number
  billable: boolean
  note: string | null
}

interface WeekBarDay {
  date: string
  dateKey: string
  total: number
}

interface ProjectOption {
  id: number
  title: string
  tasks: { id: number; title: string }[]
}

interface Props {
  selectedDate: string
  entries: TimeEntryData[]
  weekBar: WeekBarDay[]
  weekTotal: number
  projects: ProjectOption[]
  isAdmin: boolean
  users: { id: number; name: string }[]
  currentUserId: number
}

export function TimesheetClient({
  selectedDate,
  entries,
  weekBar,
  weekTotal,
  projects,
  isAdmin,
  users,
  currentUserId,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntryData | null>(null)

  const date = new Date(selectedDate)
  const todayKey = toDateKey(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())))
  const selectedKey = toDateKey(date)

  const dayTotal = entries.reduce((sum, e) => sum + e.hours, 0)

  // ── Navigation ──
  const navigateDay = (offset: number) => {
    const d = new Date(selectedDate)
    d.setUTCDate(d.getUTCDate() + offset)
    router.push(`/timesheets?date=${toDateKey(d)}`)
  }

  const goToToday = () => {
    router.push("/timesheets")
  }

  const goToDay = (dateKey: string) => {
    router.push(`/timesheets?date=${dateKey}`)
  }

  // ── Entry CRUD ──
  const handleAddEntry = () => {
    setEditingEntry(null)
    setDrawerOpen(true)
  }

  const handleEditEntry = (entry: TimeEntryData) => {
    setEditingEntry(entry)
    setDrawerOpen(true)
  }

  const handleDeleteEntry = (entryId: number) => {
    startTransition(async () => {
      await deleteTimeEntryAction(entryId)
      router.refresh()
    })
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setEditingEntry(null)
  }

  const handleDrawerSaved = () => {
    setDrawerOpen(false)
    setEditingEntry(null)
    router.refresh()
  }

  // ── Copy Previous ──
  const handleCopyPrevious = () => {
    startTransition(async () => {
      await copyPreviousEntriesAction(selectedDate)
      router.refresh()
    })
  }

  return (
    <div className="timesheet-page">
      {/* ── Header Bar ── */}
      <div className="timesheet-day-header">
        <h1 className="timesheet-day-title">{formatDailyDate(date)}</h1>
        <div className="timesheet-day-controls">
          {isAdmin && users.length > 0 && (
            <select
              className="timesheet-user-select"
              defaultValue={currentUserId}
              onChange={(e) => {
                // For admin viewing other users — future enhancement
              }}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}
          <div className="timesheet-nav-group">
            <button className="timesheet-nav-btn" onClick={() => navigateDay(-1)}>&#8249;</button>
            <button className="timesheet-nav-btn timesheet-today-btn" onClick={goToToday}>Today</button>
            <button className="timesheet-nav-btn" onClick={() => navigateDay(1)}>&#8250;</button>
          </div>
          <button className="btn btn-primary" onClick={handleAddEntry}>
            + Add Entry
          </button>
        </div>
      </div>

      {/* ── Weekly Summary Bar ── */}
      <div className="timesheet-week-bar">
        {weekBar.map((day) => (
          <button
            key={day.dateKey}
            className={`timesheet-week-bar-day ${day.dateKey === selectedKey ? "active" : ""} ${day.dateKey === todayKey ? "today" : ""}`}
            onClick={() => goToDay(day.dateKey)}
          >
            <span className="timesheet-week-bar-label">
              {new Date(day.date).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })}
            </span>
            <span className="timesheet-week-bar-hours">
              {hoursToHMM(day.total)}
            </span>
          </button>
        ))}
        <div className="timesheet-week-bar-total">
          <span className="timesheet-week-bar-label">Total:</span>
          <span className="timesheet-week-bar-hours">{hoursToHMM(weekTotal)}</span>
        </div>
      </div>

      {/* ── Entries List ── */}
      <div className="timesheet-entries-section">
        <div className="timesheet-entries-section-title">Actual Time</div>

        {entries.length === 0 ? (
          <div className="timesheet-entries-empty">
            <p>No timesheets here yet. <button className="timesheet-link-btn" onClick={handleAddEntry}>Add Entry</button></p>
          </div>
        ) : (
          <div className="timesheet-entries-list">
            {entries.map((entry) => (
              <div key={entry.id} className="timesheet-entry-card" onClick={() => handleEditEntry(entry)}>
                <div className="timesheet-entry-info">
                  <div className="timesheet-entry-project">{entry.projectTitle}</div>
                  <div className="timesheet-entry-meta">
                    {entry.taskTitle && <span>{entry.taskTitle}</span>}
                    {entry.taskTitle && <span className="timesheet-entry-dot">&middot;</span>}
                    <span className={`timesheet-entry-category ${entry.billable ? "billable" : "nonbillable"}`}>
                      {entry.billable ? "Billable" : "Non-billable"}
                    </span>
                  </div>
                  {entry.note && (
                    <div className="timesheet-entry-note">{entry.note}</div>
                  )}
                </div>
                <div className="timesheet-entry-hours">{hoursToHMM(entry.hours)}</div>
                <button
                  className="timesheet-entry-delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteEntry(entry.id)
                  }}
                  title="Delete entry"
                  disabled={isPending}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Day Total */}
        {entries.length > 0 && (
          <div className="timesheet-day-total">
            Day Total: <strong>{hoursToHMM(dayTotal)}</strong>
          </div>
        )}

        {/* Copy Previous */}
        {entries.length === 0 && (
          <button
            className="timesheet-copy-link"
            onClick={handleCopyPrevious}
            disabled={isPending}
          >
            Copy most recent previous timesheets over
          </button>
        )}
      </div>

      {/* ── Entry Drawer ── */}
      {drawerOpen && (
        <TimesheetEntryDrawer
          date={selectedDate}
          entry={editingEntry}
          projects={projects}
          onClose={handleDrawerClose}
          onSaved={handleDrawerSaved}
        />
      )}
    </div>
  )
}
