
export default function TasksLoading() {
  return (
    <div className="tasks-loading">
      {/* Page Header */}
      <div className="page-header-skeleton">
        <div className="skeleton" style={{ height: '2.5rem', width: '12rem', marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: '1.25rem', width: '20rem', marginBottom: '2rem' }} />
        <div className="skeleton skeleton-btn" style={{ width: '8rem', height: '2.5rem' }} />
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat-skeleton">
            <div className="skeleton" style={{ width: '3rem', height: '3rem', borderRadius: '0.5rem', marginBottom: '1rem' }} />
            <div className="skeleton" style={{ height: '2rem', width: '4rem', marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ height: '1rem', width: '6rem' }} />
          </div>
        ))}
      </div>

      {/* Content Sections */}
      <div className="content-skeleton">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="section-skeleton">
            <div className="section-header">
              <div className="skeleton" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%' }} />
              <div className="skeleton" style={{ height: '1.5rem', width: '10rem' }} />
              <div className="skeleton skeleton-btn" style={{ width: '6rem', height: '2rem' }} />
            </div>
            
            <div className="section-content">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="item-skeleton">
                  <div className="skeleton" style={{ width: '1.25rem', height: '1.25rem', borderRadius: '0.25rem' }} />
                  <div className="skeleton" style={{ height: '1.25rem', width: '15rem' }} />
                  <div className="skeleton" style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%' }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
