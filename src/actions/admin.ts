"use server"

import { getUsers } from "@/db/users"
import { getProjects } from "@/db/projects"
import { getTasks } from "@/db/tasks"
import { getClients } from "@/db/clients"
import { deleteProject } from "@/db/projects"
import { deleteTask } from "@/db/tasks"
import { deleteClient } from "@/db/clients"
import { revalidatePath } from "next/cache"
import { Role } from "@prisma/client"
import { getCurrentUser } from "@/auth/currentUser"
import { isMaintenanceMode, setMaintenanceMode } from "@/redis/maintenance"


export async function getAdminStatsAction() {
  const [users, projects, tasks, clients] = await Promise.all([
    getUsers(),
    getProjects({}),
    getTasks(),
    getClients()
  ])

  const stats = {
    totalUsers: users.length,
    totalProjects: projects.length,
    totalTasks: tasks.length,
    totalClients: clients.length,
    completedTasks: tasks.filter(task => task.completed).length,
    pendingTasks: tasks.filter(task => !task.completed).length,
    adminUsers: users.filter(user => user.role === Role.admin).length,
    regularUsers: users.filter(user => user.role === Role.user).length
  }

  return stats
}

export async function getAllUsersAction() {
  return getUsers()
}

export async function getAllProjectsAction() {
  const projects = await getProjects({})
  // Fetch user names for manager display
  const users = await getUsers()
  const userMap = new Map(users.map(u => [u.id, u.name]))
  return projects.map(p => ({
    ...p,
    managerName: userMap.get(p.userId) || 'Unknown'
  }))
}

export async function getAllTasksAction() {
  return getTasks()
}

export async function getAllClientsAction() {
  return getClients()
}

export async function adminDeleteProjectAction(projectId: number | string) {
  await deleteProject(projectId)
  
  // Revalidate paths
  revalidatePath('/admin')
  revalidatePath('/projects')
  revalidatePath('/')
  
  return { success: true, message: 'Project deleted successfully' }
}

export async function adminDeleteTaskAction(taskId: number | string) {
  await deleteTask(taskId)
  
  // Revalidate paths
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  revalidatePath('/projects')
  revalidatePath('/')
  
  return { success: true, message: 'Task deleted successfully' }
}

export async function adminDeleteClientAction(clientId: number | string) {
  await deleteClient(clientId)

  // Revalidate paths
  revalidatePath('/admin')
  revalidatePath('/clients')
  revalidatePath('/projects')
  revalidatePath('/')

  return { success: true, message: 'Client deleted successfully' }
}

export async function getMaintenanceStatusAction(): Promise<boolean> {
  return isMaintenanceMode()
}

export async function toggleMaintenanceAction(enabled: boolean): Promise<{ success: boolean; message: string }> {
  const user = await getCurrentUser()
  if (!user || user.role !== Role.admin) {
    return { success: false, message: 'Unauthorized' }
  }

  await setMaintenanceMode(enabled)
  revalidatePath('/', 'layout')

  return {
    success: true,
    message: enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled'
  }
}
