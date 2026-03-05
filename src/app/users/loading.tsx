import { Skeleton, SkeletonList } from "@/components/Skeleton"

export default function LoadingUsersPage() {
  return (
    <>
      <div className="page-title">
        <div className="title-content">
          <h1>Team</h1>
          <p className="page-subtitle"><Skeleton short /></p>
        </div>
      </div>
      <div className="team-grid">
        <SkeletonList amount={8}>
          <div className="team-card" style={{ pointerEvents: 'none' }}>
            <div className="team-card-top">
              <div className="team-card-avatar"><Skeleton short /></div>
              <div className="team-card-identity">
                <Skeleton short />
                <Skeleton short />
              </div>
            </div>
            <div className="team-card-stats">
              <div className="team-card-stat"><Skeleton short /></div>
              <div className="team-card-stat-divider" />
              <div className="team-card-stat"><Skeleton short /></div>
            </div>
            <div className="team-card-projects">
              <Skeleton short />
              <Skeleton short />
            </div>
            <div className="team-card-footer">
              <Skeleton short />
            </div>
          </div>
        </SkeletonList>
      </div>
    </>
  )
}
