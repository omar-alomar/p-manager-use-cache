
export default function DashboardLoading() {
  return (
    <div className="dashboard-loading">
      {/* KPI Stats Bar — 3 cards */}
      <div className="dashboard-kpi-bar">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="kpi-skeleton">
            <div className="skeleton" style={{ height: '0.875rem', width: '5rem', marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ height: '2rem', width: '3rem', marginBottom: '0.25rem' }} />
            <div className="skeleton" style={{ height: '0.75rem', width: '4rem' }} />
          </div>
        ))}
      </div>

      {/* Milestones + Activity (above board) */}
      <div className="dashboard-grid">
        <div className="section-skeleton-card">
          <div className="skeleton" style={{ height: '1rem', width: '10rem', marginBottom: '1.25rem' }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.625rem' }}>
              <div className="skeleton" style={{ height: '2.5rem', flex: 1, borderRadius: '8px' }} />
            </div>
          ))}
        </div>
        <div className="section-skeleton-card">
          <div className="skeleton" style={{ height: '1rem', width: '8rem', marginBottom: '1.25rem' }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
              <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
              <div className="skeleton" style={{ height: '0.875rem', flex: 1, borderRadius: '4px' }} />
              <div className="skeleton" style={{ height: '0.6875rem', width: '2.5rem' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-skeleton">
        <div className="skeleton" style={{ height: '1.25rem', flex: 1, borderRadius: '6px' }} />
        <div className="skeleton" style={{ height: '1.25rem', width: '140px', borderRadius: '6px' }} />
        <div className="skeleton" style={{ height: '1.25rem', width: '140px', borderRadius: '6px' }} />
        <div className="skeleton" style={{ height: '1.25rem', width: '100px', borderRadius: '6px' }} />
      </div>

      {/* Team Board */}
      <div className="board-skeleton">
        <div className="skeleton" style={{ height: '1rem', width: '7rem', marginBottom: '1.25rem' }} />
        <div className="board-skeleton-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="board-skeleton-column">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
                <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                <div>
                  <div className="skeleton" style={{ height: '0.8rem', width: '5rem', marginBottom: '0.375rem' }} />
                  <div className="skeleton" style={{ height: '0.6rem', width: '3rem' }} />
                </div>
                <div className="skeleton" style={{ height: '6px', width: '60px', borderRadius: '3px', marginLeft: 'auto' }} />
              </div>
              {Array.from({ length: 3 - i }).map((_, j) => (
                <div key={j} className="skeleton" style={{ height: '3.5rem', borderRadius: '8px', marginBottom: '0.375rem' }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
