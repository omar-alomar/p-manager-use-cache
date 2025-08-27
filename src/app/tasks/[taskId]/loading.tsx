import { Skeleton, SkeletonList } from "@/components/Skeleton"

export default function LoadingTaskPage() {
  return (
    <div className="task-page">
      <div className="task-hero skeleton-hero">
        <div className="hero-content">
          <div className="hero-title">
            <Skeleton inline short />
          </div>
          <div className="hero-subtitle">
            <Skeleton short inline />
            <Skeleton short inline />
            <Skeleton short inline />
          </div>
          <div className="hero-actions">
            <Skeleton short inline />
            <Skeleton short inline />
          </div>
        </div>
      </div>

      <div className="task-content">
        <div className="content-grid">
          {/* Task Details Section */}
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Task Details
              </h2>
            </div>
            <div className="task-details-container">
              <div className="task-details-skeleton">
                <SkeletonList amount={4}>
                  <div className="detail-item-skeleton">
                    <Skeleton short inline />
                    <Skeleton />
                  </div>
                </SkeletonList>
                <div className="task-interactive-skeleton">
                  <Skeleton short />
                  <Skeleton />
                </div>
              </div>
            </div>
          </div>

          {/* Task Actions Section */}
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Actions
              </h2>
            </div>
            <div className="task-actions-container">
              <div className="task-actions-skeleton">
                <SkeletonList amount={3}>
                  <Skeleton short inline />
                </SkeletonList>
                <div className="action-info-skeleton">
                  <Skeleton short />
                  <Skeleton short />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


