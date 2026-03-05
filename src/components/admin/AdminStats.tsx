"use client"

interface AdminStatsProps {
  stats: {
    totalUsers: number
    totalProjects: number
    totalTasks: number
    totalClients: number
    completedTasks: number
    pendingTasks: number
    adminUsers: number
    regularUsers: number
  }
}

export function AdminStats({ stats }: AdminStatsProps) {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const navbarHeight = 80
      const elementPosition = element.offsetTop - navbarHeight
      window.scrollTo({ top: elementPosition, behavior: 'smooth' })
    }
  }

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0

  return (
    <div className="admin-kpi-bar">
      <button
        type="button"
        className="admin-kpi-card"
        onClick={() => scrollToSection('user-management')}
      >
        <div className="admin-kpi-label">Users</div>
        <div className="admin-kpi-value">{stats.totalUsers}</div>
        <div className="admin-kpi-sub">
          {stats.adminUsers} admin{stats.adminUsers !== 1 ? 's' : ''} &middot; {stats.regularUsers} member{stats.regularUsers !== 1 ? 's' : ''}
        </div>
      </button>

      <button
        type="button"
        className="admin-kpi-card"
        onClick={() => scrollToSection('client-management')}
      >
        <div className="admin-kpi-label">Clients</div>
        <div className="admin-kpi-value">{stats.totalClients}</div>
        <div className="admin-kpi-sub">Registered clients</div>
      </button>

      <button
        type="button"
        className="admin-kpi-card"
        onClick={() => scrollToSection('project-management')}
      >
        <div className="admin-kpi-label">Projects</div>
        <div className="admin-kpi-value">{stats.totalProjects}</div>
        <div className="admin-kpi-sub">Active projects</div>
      </button>

      <button
        type="button"
        className="admin-kpi-card"
        onClick={() => scrollToSection('task-management')}
      >
        <div className="admin-kpi-label">Tasks</div>
        <div className="admin-kpi-value">{stats.totalTasks}</div>
        <div className="admin-kpi-sub">
          {completionRate}% complete &middot; {stats.pendingTasks} pending
        </div>
      </button>
    </div>
  )
}
