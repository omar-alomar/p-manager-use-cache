export interface TaskWithRelations {
  id: number
  title: string
  completed: boolean
  completedAt?: Date | null
  urgency?: string | null
  userId: number
  projectId: number | null
  createdAt: Date
  updatedAt: Date
  assignedById?: number | null
  User: { id: number; name: string }
  AssignedBy?: { id: number; name: string } | null
  Project?: { id: number; title: string } | null
}

/** Standardized return type for server actions */
export type ActionResult<T = void> =
  | ({ success: true; message?: string } & (T extends void ? {} : { data: T }))
  | { success: false; message: string }

export interface TimesheetWeekWithEntries {
  id: number
  userId: number
  weekStart: Date
  status: string
  submittedAt: Date | null
  reviewedAt: Date | null
  reviewedById: number | null
  rejectionNote: string | null
  totalHours: number
  createdAt: Date
  updatedAt: Date
  user: { id: number; name: string }
  reviewedBy: { id: number; name: string } | null
  entries: TimesheetEntry[]
}

export interface TimesheetEntry {
  id: number
  timesheetWeekId: number
  projectId: number
  taskId: number | null
  date: Date
  hours: number
  billable: boolean
  note: string | null
  project: { id: number; title: string }
  task: { id: number; title: string } | null
}

export interface TimesheetRow {
  projectId: number
  projectTitle: string
  taskId: number | null
  taskTitle: string | null
  billable: boolean
  entries: Record<string, { id?: number; hours: number; note?: string | null }>
  total: number
}
