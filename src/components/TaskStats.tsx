interface TaskStatsProps {
  stats: {
    total: number
    completed: number
    inProgress: number
  }
}

export function TaskStats({ stats }: TaskStatsProps) {
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="task-stats">
      <div className="stat-card">
        <div className="stat-icon total">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"/>
            <path d="M9 11V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
            <path d="M9 7h6"/>
          </svg>
        </div>
        <div className="stat-content">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon completed">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <div className="stat-content">
          <div className="stat-number">{stats.completed}</div>
          <div className="stat-label">Completed</div>
          <div className="stat-percentage">{completionRate}%</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon in-progress">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <div className="stat-content">
          <div className="stat-number">{stats.inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
      </div>
    </div>
  )
}
