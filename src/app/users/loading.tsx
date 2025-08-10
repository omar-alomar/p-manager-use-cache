import { Skeleton, SkeletonButton, SkeletonList } from "@/components/Skeleton"

export default function LoadingUsersPage() {
  return (
    <>
      <h1 className="page-title">Team</h1>
      <div className="team-grid">
        <SkeletonList amount={6}>
          <div className="team-card">
            <div className="team-card-header">
              <div className="user-avatar">
                <Skeleton short />
              </div>
              <div className="user-info">
                <Skeleton short />
                <Skeleton short />
              </div>
              <div className="user-actions">
                <SkeletonButton />
              </div>
            </div>
            <div className="team-card-body">
              <div className="user-email">
                <div className="email-icon">
                  <Skeleton short />
                </div>
                <Skeleton short />
              </div>
              <div className="user-stats">
                <div className="stat-item">
                  <div className="stat-icon">
                    <Skeleton short />
                  </div>
                  <Skeleton short />
                  <Skeleton short />
                </div>
                <div className="stat-item">
                  <div className="stat-icon">
                    <Skeleton short />
                  </div>
                  <Skeleton short />
                  <Skeleton short />
                </div>
              </div>
              <div className="user-joined">
                <div className="joined-icon">
                  <Skeleton short />
                </div>
                <Skeleton short />
              </div>
            </div>

          </div>
        </SkeletonList>
      </div>
    </>
  )
}
