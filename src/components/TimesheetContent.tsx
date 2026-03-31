import { getEntriesForDate, getWeeklyTotals } from "@/db/timesheets"
import { getProjects } from "@/db/projects"
import { getUserTasks } from "@/db/tasks"
import { getUsers } from "@/db/users"
import { getWeekDaysSat, getWeekStartSat, toDateKey } from "@/utils/dateUtils"
import { TimesheetClient } from "./TimesheetClient"

interface Props {
  userId: number
  dateParam: string | null
  isAdmin: boolean
}

export async function TimesheetContent({ userId, dateParam, isAdmin }: Props) {
  // Determine the selected date (default to today)
  const selectedDate = dateParam
    ? new Date(dateParam + "T00:00:00Z")
    : new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()))

  // Week runs Sat-Fri
  const weekStartSat = getWeekStartSat(selectedDate)
  const weekDays = getWeekDaysSat(weekStartSat)

  // Fetch data in parallel
  const [entries, weeklyTotals, allProjects, userTasks, allUsers] = await Promise.all([
    getEntriesForDate(userId, selectedDate),
    getWeeklyTotals(userId, weekDays),
    getProjects({ includeArchived: false }),
    getUserTasks(userId),
    isAdmin ? getUsers() : Promise.resolve([]),
  ])

  // Serialize entries
  const serializedEntries = entries.map((e) => ({
    id: e.id,
    projectId: e.projectId,
    projectTitle: e.project.title,
    taskId: e.taskId,
    taskTitle: e.task?.title ?? null,
    hours: e.hours,
    billable: e.billable,
    note: e.note,
  }))

  // Build project options with their tasks
  const projectOptions = allProjects.map((p) => ({
    id: p.id,
    title: p.title,
    tasks: userTasks
      .filter((t) => t.projectId === p.id && !t.completed)
      .map((t) => ({ id: t.id, title: t.title })),
  }))

  // Serialize weekly bar data
  const weekBarData = weekDays.map((d) => ({
    date: d.toISOString(),
    dateKey: toDateKey(d),
    total: weeklyTotals[toDateKey(d)] ?? 0,
  }))

  const weekTotal = Object.values(weeklyTotals).reduce((sum, h) => sum + h, 0)

  // Admin user list
  const userOptions = allUsers.map((u) => ({ id: u.id, name: u.name }))

  return (
    <TimesheetClient
      selectedDate={selectedDate.toISOString()}
      entries={serializedEntries}
      weekBar={weekBarData}
      weekTotal={weekTotal}
      projects={projectOptions}
      isAdmin={isAdmin}
      users={userOptions}
      currentUserId={userId}
    />
  )
}
