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
  return getProjects({})
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
  revalidatePath('/tasks')
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
