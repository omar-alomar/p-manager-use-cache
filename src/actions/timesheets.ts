"use server"

import { getCurrentUser } from "@/auth/currentUser"
import {
  upsertTimeEntry,
  deleteTimeEntry,
  getTimesheetWeek,
} from "@/db/timesheets"
import { revalidateTimesheetPaths } from "@/utils/revalidate"
import { isBlocked } from "@/utils/maintenance"
import { getMonday } from "@/utils/dateUtils"
import prisma from "@/db/db"
import type { ActionResult } from "@/types"

const MAINTENANCE_MSG = "Site is under maintenance. Please try again later."

export async function saveTimeEntryAction(params: {
  projectId: number
  taskId?: number | null
  date: string
  hours: number
  billable: boolean
  note?: string | null
}): Promise<ActionResult<{ entryId: number | null; totalHours: number }>> {
  if (await isBlocked()) return { success: false, message: MAINTENANCE_MSG }

  const user = await getCurrentUser()
  if (!user) return { success: false, message: "Not authenticated" }

  const { projectId, taskId, date, hours, billable, note } = params

  if (!projectId || !date || hours < 0 || hours > 24) {
    return { success: false, message: "Invalid input" }
  }

  try {
    const dateObj = new Date(date)
    const weekStart = getMonday(dateObj)

    const result = await upsertTimeEntry({
      userId: user.id,
      weekStart,
      projectId,
      taskId: taskId ?? null,
      date: dateObj,
      hours,
      billable,
      note: note ?? null,
    })

    revalidateTimesheetPaths()

    return {
      success: true,
      data: { entryId: result.entry?.id ?? null, totalHours: result.totalHours },
    }
  } catch (error) {
    console.error("Failed to save time entry:", error)
    return { success: false, message: "Failed to save time entry" }
  }
}

export async function deleteTimeEntryAction(
  entryId: number
): Promise<ActionResult> {
  if (await isBlocked()) return { success: false, message: MAINTENANCE_MSG }

  const user = await getCurrentUser()
  if (!user) return { success: false, message: "Not authenticated" }

  try {
    // Verify ownership
    const entry = await prisma.timeEntry.findUnique({
      where: { id: entryId },
      include: { timesheetWeek: { select: { userId: true } } },
    })
    if (!entry) return { success: false, message: "Entry not found" }
    if (entry.timesheetWeek.userId !== user.id) {
      return { success: false, message: "Not authorized" }
    }

    await deleteTimeEntry(entryId)
    revalidateTimesheetPaths()
    return { success: true }
  } catch (error) {
    console.error("Failed to delete time entry:", error)
    return { success: false, message: "Failed to delete entry" }
  }
}

export async function copyPreviousEntriesAction(
  targetDate: string
): Promise<ActionResult<{ entriesCopied: number }>> {
  if (await isBlocked()) return { success: false, message: MAINTENANCE_MSG }

  const user = await getCurrentUser()
  if (!user) return { success: false, message: "Not authenticated" }

  try {
    const target = new Date(targetDate)
    const weekStart = getMonday(target)

    // Find the most recent day with entries (up to 30 days back)
    const cutoff = new Date(target)
    cutoff.setUTCDate(cutoff.getUTCDate() - 30)

    const recentEntries = await prisma.timeEntry.findMany({
      where: {
        timesheetWeek: { userId: user.id },
        date: { lt: target, gte: cutoff },
      },
      orderBy: { date: "desc" },
      include: {
        project: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
    })

    if (recentEntries.length === 0) {
      return { success: false, message: "No recent entries to copy" }
    }

    // Get the most recent date that has entries
    const mostRecentDate = recentEntries[0].date.toISOString().split("T")[0]
    const entriesToCopy = recentEntries.filter(
      (e) => e.date.toISOString().split("T")[0] === mostRecentDate
    )

    // Copy each entry to the target date
    let copied = 0
    for (const entry of entriesToCopy) {
      await upsertTimeEntry({
        userId: user.id,
        weekStart,
        projectId: entry.projectId,
        taskId: entry.taskId,
        date: target,
        hours: entry.hours,
        billable: entry.billable,
        note: entry.note,
      })
      copied++
    }

    revalidateTimesheetPaths()
    return { success: true, data: { entriesCopied: copied } }
  } catch (error) {
    console.error("Failed to copy entries:", error)
    return { success: false, message: "Failed to copy entries" }
  }
}
