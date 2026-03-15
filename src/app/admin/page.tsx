
// app/admin/page.tsx

import { getCurrentUser } from "@/auth/currentUser"
import { redirect } from "next/navigation"
import { getAdminStatsAction, getAllUsersAction, getAllProjectsAction, getAllTasksAction, getAllClientsAction, getMaintenanceStatusAction } from "@/actions/admin"
import { MaintenanceToggle } from "@/components/admin/MaintenanceToggle"
import { AdminStats } from "@/components/admin/AdminStats"
import { AdminUserManagement } from "@/components/admin/AdminUserManagement"
import { AdminProjectManagement } from "@/components/admin/AdminProjectManagement"
import { AdminTaskManagement } from "@/components/admin/AdminTaskManagement"
import { AdminClientManagement } from "@/components/admin/AdminClientManagement"
import { Role } from "@prisma/client"
import { APP_VERSION } from "@/constants/version"

export default async function AdminPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== Role.admin) {
    redirect("/")
  }

  const [stats, users, projectsData, tasks, clients, maintenanceEnabled] = await Promise.all([
    getAdminStatsAction(),
    getAllUsersAction(),
    getAllProjectsAction(),
    getAllTasksAction(),
    getAllClientsAction(),
    getMaintenanceStatusAction()
  ])

  const projects = projectsData.map(project => ({
    ...project,
    client: project.clientRef?.name || 'No Client',
    managerName: project.managerName
  }))

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Admin</h1>
        <p className="admin-page-subtitle">System administration and management</p>
      </div>

      <MaintenanceToggle initialEnabled={maintenanceEnabled} />

      <AdminStats stats={stats} />

      <div className="admin-sections" id="user-management">
        <AdminUserManagement users={users} currentAppVersion={APP_VERSION} />
      </div>

      <div className="admin-sections" id="client-management">
        <AdminClientManagement clients={clients} />
      </div>

      <div className="admin-sections" id="project-management">
        <AdminProjectManagement projects={projects} />
      </div>

      <div className="admin-sections" id="task-management">
        <AdminTaskManagement tasks={tasks} />
      </div>
    </div>
  )
}
