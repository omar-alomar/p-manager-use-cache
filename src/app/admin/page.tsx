
// app/admin/page.tsx

import { getCurrentUser } from "@/auth/currentUser"
import { redirect } from "next/navigation"
import { getAdminStatsAction, getAllUsersAction, getAllProjectsAction, getAllTasksAction, getAllClientsAction } from "@/actions/admin"
import { AdminStats } from "@/components/admin/AdminStats"
import { AdminUserManagement } from "@/components/admin/AdminUserManagement"
import { AdminProjectManagement } from "@/components/admin/AdminProjectManagement"
import { AdminTaskManagement } from "@/components/admin/AdminTaskManagement"
import { AdminClientManagement } from "@/components/admin/AdminClientManagement"

export default async function AdminPage() {
  // Check if user is authenticated
  const user = await getCurrentUser()
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login")
  }
  
  // Redirect to home if not admin
  if (user.role !== "admin") {
    redirect("/")
  }

  // Fetch all admin data
  const [stats, users, projectsData, tasks, clients] = await Promise.all([
    getAdminStatsAction(),
    getAllUsersAction(),
    getAllProjectsAction(),
    getAllTasksAction(),
    getAllClientsAction()
  ])

  // Transform projects data to match AdminProjectManagement component expectations
  const projects = projectsData.map(project => ({
    ...project,
    client: project.clientRef?.name || 'No Client'
  }))

  return (
    <div className="admin-page">
      <div className="page-title">
        <div className="title-content">
          <h1>Admin Dashboard</h1>
          <p className="page-subtitle">System administration and management</p>
        </div>
      </div>

      {/* System Statistics */}
      <AdminStats stats={stats} />

      {/* User Management */}
      <div id="user-management">
        <AdminUserManagement users={users} />
      </div>

      {/* Client Management */}
      <div id="client-management">
        <AdminClientManagement clients={clients} />
      </div>

      {/* Project Management */}
      <div id="project-management">
        <AdminProjectManagement projects={projects} />
      </div>

      {/* Task Management */}
      <div id="task-management">
        <AdminTaskManagement tasks={tasks} />
      </div>
    </div>
  )
}