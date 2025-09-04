"use client"

interface AdminStatsProps {
  stats: {
    totalUsers: number
    totalProjects: number
    totalTasks: number
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
      const navbarHeight = 80 // Approximate navbar height
      const elementPosition = element.offsetTop - navbarHeight
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="admin-section">
      <h2 className="section-title">System Overview</h2>
      <div className="stats-grid">
        <div 
          className="stat-card stat-card-clickable" 
          onClick={() => scrollToSection('user-management')}
        >
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
            <div className="stat-detail">
              {stats.adminUsers} admin{stats.adminUsers !== 1 ? 's' : ''}, {stats.regularUsers} user{stats.regularUsers !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div 
          className="stat-card stat-card-clickable" 
          onClick={() => scrollToSection('project-management')}
        >
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalProjects}</div>
            <div className="stat-label">Total Projects</div>
            <div className="stat-detail">Active projects</div>
          </div>
        </div>

        <div 
          className="stat-card stat-card-clickable" 
          onClick={() => scrollToSection('task-management')}
        >
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalTasks}</div>
            <div className="stat-label">Total Tasks</div>
            <div className="stat-detail">
              {stats.completedTasks} completed, {stats.pendingTasks} pending
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
