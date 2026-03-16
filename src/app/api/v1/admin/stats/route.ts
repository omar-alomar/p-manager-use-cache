import { NextRequest } from "next/server"
import { getUsers } from "@/db/users"
import { getProjects } from "@/db/projects"
import { getTasks } from "@/db/tasks"
import { getClients } from "@/db/clients"
import { Role } from "@prisma/client"
import { requireAdmin, isErrorResponse } from "../../_lib/auth"
import { jsonSuccess } from "../../_lib/responses"

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isErrorResponse(auth)) return auth

  const [users, projects, tasks, clients] = await Promise.all([
    getUsers(),
    getProjects({}),
    getTasks(),
    getClients(),
  ])

  return jsonSuccess({
    totalUsers: users.length,
    totalProjects: projects.length,
    totalTasks: tasks.length,
    totalClients: clients.length,
    completedTasks: tasks.filter(t => t.completed).length,
    pendingTasks: tasks.filter(t => !t.completed).length,
    adminUsers: users.filter(u => u.role === Role.admin).length,
    regularUsers: users.filter(u => u.role === Role.user).length,
  })
}
