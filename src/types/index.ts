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
