import prisma from "./db"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { revalidateTag } from "next/cache"
import { TimesheetStatus } from "@prisma/client"

// ─── Read functions ────────────────────────────────────────────

export async function getEntriesForDate(userId: number, date: Date) {
  "use cache"
  cacheTag(`timesheets:userId=${userId}`)

  return prisma.timeEntry.findMany({
    where: {
      timesheetWeek: { userId },
      date,
    },
    include: {
      project: { select: { id: true, title: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "asc" },
  })
}

export async function getWeeklyTotals(userId: number, weekDays: Date[]) {
  "use cache"
  cacheTag(`timesheets:userId=${userId}`)

  const startDate = weekDays[0]
  const endDate = new Date(weekDays[6])
  endDate.setUTCDate(endDate.getUTCDate() + 1) // exclusive upper bound

  const entries = await prisma.timeEntry.findMany({
    where: {
      timesheetWeek: { userId },
      date: { gte: startDate, lt: endDate },
    },
    select: { date: true, hours: true },
  })

  // Build a map of dateKey → total hours
  const totals: Record<string, number> = {}
  for (const day of weekDays) {
    totals[day.toISOString().split("T")[0]] = 0
  }
  for (const entry of entries) {
    const key = entry.date.toISOString().split("T")[0]
    if (key in totals) {
      totals[key] += entry.hours
    }
  }

  return totals
}

export async function getTimesheetWeek(userId: number, weekStart: Date) {
  "use cache"
  cacheTag(`timesheets:userId=${userId}`, `timesheets:week=${weekStart.toISOString()}`)

  return prisma.timesheetWeek.findUnique({
    where: {
      userId_weekStart: { userId, weekStart },
    },
    include: {
      user: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, name: true } },
      entries: {
        include: {
          project: { select: { id: true, title: true } },
          task: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })
}

export async function getTimesheetsForWeek(weekStart: Date) {
  "use cache"
  cacheTag(`timesheets:week=${weekStart.toISOString()}`)

  return prisma.timesheetWeek.findMany({
    where: { weekStart },
    include: {
      user: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, name: true } },
      entries: {
        include: {
          project: { select: { id: true, title: true } },
          task: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { user: { name: "asc" } },
  })
}

export async function getPendingTimesheets() {
  "use cache"
  cacheTag("timesheets:pending")

  return prisma.timesheetWeek.findMany({
    where: { status: TimesheetStatus.SUBMITTED },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { submittedAt: "asc" },
  })
}

export async function getRecentTimesheetRows(userId: number, weeksBack = 4) {
  "use cache"
  cacheTag(`timesheets:userId=${userId}`)

  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - weeksBack * 7)

  const entries = await prisma.timeEntry.findMany({
    where: {
      timesheetWeek: { userId },
      date: { gte: cutoff },
    },
    select: {
      projectId: true,
      taskId: true,
      project: { select: { id: true, title: true } },
      task: { select: { id: true, title: true } },
    },
    distinct: ["projectId", "taskId"],
    orderBy: { createdAt: "desc" },
  })

  return entries
}

export async function getPreviousWeekRows(userId: number, weekStart: Date) {
  "use cache"
  cacheTag(`timesheets:userId=${userId}`)

  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7)

  const prevWeek = await prisma.timesheetWeek.findUnique({
    where: {
      userId_weekStart: { userId, weekStart: prevWeekStart },
    },
    include: {
      entries: {
        select: {
          projectId: true,
          taskId: true,
          billable: true,
          project: { select: { id: true, title: true } },
          task: { select: { id: true, title: true } },
        },
        distinct: ["projectId", "taskId"],
      },
    },
  })

  return prevWeek?.entries ?? []
}

// ─── Write functions ───────────────────────────────────────────

export async function upsertTimeEntry({
  userId,
  weekStart,
  projectId,
  taskId,
  date,
  hours,
  billable = true,
  note,
}: {
  userId: number
  weekStart: Date
  projectId: number
  taskId?: number | null
  date: Date
  hours: number | null
  billable?: boolean
  note?: string | null
}) {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Upsert the TimesheetWeek
    const week = await tx.timesheetWeek.upsert({
      where: {
        userId_weekStart: { userId, weekStart },
      },
      create: {
        userId,
        weekStart,
        status: TimesheetStatus.DRAFT,
      },
      update: {},
    })

    // 2. Find existing entry for this cell
    const existing = await tx.timeEntry.findFirst({
      where: {
        timesheetWeekId: week.id,
        projectId,
        taskId: taskId ?? null,
        date,
      },
    })

    let entry = null

    if (!hours || hours <= 0) {
      // Delete entry if hours is 0 or null
      if (existing) {
        await tx.timeEntry.delete({ where: { id: existing.id } })
      }
    } else if (existing) {
      // Update existing entry
      entry = await tx.timeEntry.update({
        where: { id: existing.id },
        data: { hours, billable, note },
      })
    } else {
      // Create new entry
      entry = await tx.timeEntry.create({
        data: {
          timesheetWeekId: week.id,
          projectId,
          taskId: taskId ?? null,
          date,
          hours,
          billable,
          note,
        },
      })
    }

    // 3. Recalculate totalHours
    const { _sum } = await tx.timeEntry.aggregate({
      where: { timesheetWeekId: week.id },
      _sum: { hours: true },
    })

    await tx.timesheetWeek.update({
      where: { id: week.id },
      data: { totalHours: _sum.hours ?? 0 },
    })

    return { entry, totalHours: _sum.hours ?? 0, weekId: week.id }
  })

  revalidateTag(`timesheets:userId=${userId}`)
  revalidateTag(`timesheets:week=${weekStart.toISOString()}`)
  if (result.weekId) revalidateTag(`timesheets:id=${result.weekId}`)

  return result
}

export async function deleteTimeEntry(entryId: number) {
  const entry = await prisma.timeEntry.findUnique({
    where: { id: entryId },
    include: { timesheetWeek: true },
  })
  if (!entry) return

  await prisma.$transaction(async (tx) => {
    await tx.timeEntry.delete({ where: { id: entryId } })

    const { _sum } = await tx.timeEntry.aggregate({
      where: { timesheetWeekId: entry.timesheetWeekId },
      _sum: { hours: true },
    })

    await tx.timesheetWeek.update({
      where: { id: entry.timesheetWeekId },
      data: { totalHours: _sum.hours ?? 0 },
    })
  })

  revalidateTag(`timesheets:userId=${entry.timesheetWeek.userId}`)
  revalidateTag(`timesheets:week=${entry.timesheetWeek.weekStart.toISOString()}`)
  revalidateTag(`timesheets:id=${entry.timesheetWeekId}`)
}

export async function updateTimesheetStatus(
  timesheetId: number,
  status: TimesheetStatus,
  reviewerId?: number,
  rejectionNote?: string
) {
  const data: Record<string, unknown> = { status }

  if (status === TimesheetStatus.SUBMITTED) {
    data.submittedAt = new Date()
    data.reviewedAt = null
    data.reviewedById = null
    data.rejectionNote = null
  } else if (status === TimesheetStatus.APPROVED || status === TimesheetStatus.REJECTED) {
    data.reviewedAt = new Date()
    data.reviewedById = reviewerId
    if (status === TimesheetStatus.REJECTED) {
      data.rejectionNote = rejectionNote ?? null
    }
  }

  const week = await prisma.timesheetWeek.update({
    where: { id: timesheetId },
    data,
  })

  revalidateTag(`timesheets:userId=${week.userId}`)
  revalidateTag(`timesheets:week=${week.weekStart.toISOString()}`)
  revalidateTag(`timesheets:id=${timesheetId}`)
  revalidateTag("timesheets:pending")

  return week
}

export async function updateRowBillable(
  timesheetWeekId: number,
  projectId: number,
  taskId: number | null,
  billable: boolean
) {
  await prisma.timeEntry.updateMany({
    where: {
      timesheetWeekId,
      projectId,
      taskId: taskId ?? null,
    },
    data: { billable },
  })

  const week = await prisma.timesheetWeek.findUnique({
    where: { id: timesheetWeekId },
  })

  if (week) {
    revalidateTag(`timesheets:userId=${week.userId}`)
    revalidateTag(`timesheets:week=${week.weekStart.toISOString()}`)
    revalidateTag(`timesheets:id=${timesheetWeekId}`)
  }
}

export async function copyPreviousWeekRows(userId: number, weekStart: Date) {
  const prevRows = await getPreviousWeekRows(userId, weekStart)
  if (prevRows.length === 0) return 0

  // Ensure the TimesheetWeek exists
  await prisma.timesheetWeek.upsert({
    where: {
      userId_weekStart: { userId, weekStart },
    },
    create: {
      userId,
      weekStart,
      status: TimesheetStatus.DRAFT,
    },
    update: {},
  })

  revalidateTag(`timesheets:userId=${userId}`)
  revalidateTag(`timesheets:week=${weekStart.toISOString()}`)

  return prevRows.length
}
