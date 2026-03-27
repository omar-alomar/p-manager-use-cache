
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
import Link from "next/link"

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

      <div className="admin-sections" id="acc-linking">
        <div className="admin-section-card">
          <div className="admin-section-card-header">
            <div className="admin-section-card-title-group">
              <div className="admin-section-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div>
                <h2 className="admin-section-card-title">ACC Project Linking</h2>
                <p className="admin-section-card-subtitle">Bulk link projects to Autodesk Construction Cloud</p>
              </div>
            </div>
            <Link href="/admin/acc-linking" className="btn btn-primary btn-sm">
              Manage Links
            </Link>
          </div>
        </div>
      </div>

      <div className="admin-sections" id="task-management">
        <AdminTaskManagement tasks={tasks} />
      </div>
    </div>
  )
}
