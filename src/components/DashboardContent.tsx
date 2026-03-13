import { getTasks } from "@/db/tasks"
import { getProjects } from "@/db/projects"
import { getUsers } from "@/db/users"
import { getMilestoneColorClass, getNearestMilestoneDate } from "@/utils/milestoneUtils"
import { DashboardClient, type DashboardData } from "./DashboardClient"

export async function DashboardContent() {
  const [tasks, projects, users] = await Promise.all([
    getTasks(),
    getProjects(),
    getUsers(),
  ])

  // Active (non-archived) projects
  const activeProjects = projects.filter((p) => !p.archived)

  // ── 3 KPIs ──
  const activeTasks = tasks.filter((t) => !t.completed).length
  const criticalHighTasks = tasks.filter(
    (t) => !t.completed && (t.urgency === "CRITICAL" || t.urgency === "HIGH")
  ).length
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.completed).length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // ── Serialize tasks for client ──
  const serializedTasks: DashboardData["tasks"] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    completed: t.completed,
    completedAt: t.completedAt?.toISOString() ?? null,
    urgency: t.urgency ?? "MEDIUM",
    userId: t.userId,
    userName: t.User?.name ?? "Unassigned",
    projectId: t.projectId,
    projectTitle: t.Project?.title ?? "",
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }))

  // ── Simplified users + projects for dropdowns ──
  const serializedUsers = users.map((u) => ({ id: u.id, name: u.name }))
  const serializedProjects = activeProjects.map((p) => ({ id: p.id, title: p.title }))

  // ── Upcoming milestones (kept as-is) ──
  const now = new Date()
  const allMilestones: DashboardData["upcomingMilestones"] = []
  for (const p of activeProjects) {
    if (!p.milestones) continue
    for (const ms of p.milestones) {
      if (ms.completed) continue
      const msDate = new Date(ms.date)
      const diffDays = Math.ceil((msDate.getTime() - now.getTime()) / 86400000)
      if (diffDays >= -7) {
        allMilestones.push({
          id: ms.id,
          item: ms.item,
          date: ms.date.toISOString(),
          projectId: p.id,
          projectTitle: p.title,
          daysUntil: diffDays,
          colorClass: getMilestoneColorClass(ms.date),
        })
      }
    }
  }
  allMilestones.sort((a, b) => a.daysUntil - b.daysUntil)
  const upcomingMilestones = allMilestones.slice(0, 8)

  // ── Recent activity (kept as-is) ──
  const recentActivity: DashboardData["recentActivity"] = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 20)
    .map((t) => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      projectTitle: t.Project?.title ?? null,
      assigneeName: t.User?.name ?? null,
      assignedByName: t.AssignedBy?.name ?? null,
      updatedAt: t.updatedAt.toISOString(),
    }))

  const dashboardData: DashboardData = {
    activeTasks,
    criticalHighTasks,
    completionRate,
    tasks: serializedTasks,
    users: serializedUsers,
    projects: serializedProjects,
    upcomingMilestones,
    recentActivity,
  }

  return <DashboardClient data={dashboardData} />
}
