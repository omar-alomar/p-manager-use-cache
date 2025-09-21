import Link from "next/link"
import { Skeleton, SkeletonButton } from "./Skeleton"
import { getUser } from "@/db/users"
import { BriefcaseIcon, UserIcon } from "./icons"
import { formatDate } from "@/utils/dateUtils"

function getMilestoneStatus(milestone: Date | null): string {
  if (!milestone) return 'normal'
  
  const today = new Date()
  const milestoneDate = new Date(milestone)
  const diffTime = milestoneDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 14) return 'urgent'
  if (diffDays <= 28) return 'warning'
  return 'normal'
}

export function ProjectCard({
  id,
  title,
  client,
  clientId,
  body,
  milestone,
  milestones,
  userId,
  showManager = true,
  showClient = true
}: {
  id: number
  title: string
  client: string
  clientId?: number | null
  body: string
  milestone: Date | null
  milestones?: { id: number; date: Date; item: string; completed?: boolean }[]
  userId: number
  showManager?: boolean
  showClient?: boolean
}) {
  return (
    <div className="enhanced-project-card">
      <div className="project-card-header">
        <div className="project-title-section">
          <h3 className="project-title">{title}</h3>
          {showClient && (
            <div className="project-client">
              <BriefcaseIcon />
              {client && clientId ? (
                <Link href={`/clients/${clientId}`} className="client-name-link">
                  <span className="client-name">{client}</span>
                </Link>
              ) : (
                <span className="client-name-placeholder">No client specified</span>
              )}
            </div>
          )}
        </div>
        
        <div className="project-meta">
          {(() => {
            // Use nearest milestone date from milestones array if available, otherwise fall back to single milestone
            const nearestMilestone = milestones && milestones.length > 0 
              ? (() => {
                  // Filter out completed milestones
                  const activeMilestones = milestones.filter(milestone => !milestone.completed)
                  
                  if (activeMilestones.length === 0) return null
                  
                  return activeMilestones.reduce((nearest, current) => {
                    const now = new Date()
                    // Normalize to UTC midnight for date-only comparison (milestone dates are stored in UTC)
                    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
                    const nearestDate = new Date(nearest.date)
                    const nearestDateUTC = new Date(Date.UTC(nearestDate.getUTCFullYear(), nearestDate.getUTCMonth(), nearestDate.getUTCDate()))
                    const currentDate = new Date(current.date)
                    const currentDateUTC = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()))
                    
                    // If current is today or in the future and nearest is not, or if both are today/future and current is closer
                    if (currentDateUTC >= todayUTC && (nearestDateUTC < todayUTC || currentDate < nearestDate)) {
                      return current
                    }
                    // If both are in the past, take the most recent
                    if (currentDateUTC < todayUTC && nearestDateUTC < todayUTC && currentDate > nearestDate) {
                      return current
                    }
                    return nearest
                  })
                })()
              : milestone ? { date: milestone, item: '' } : null

            return nearestMilestone && (
              <div className={`project-milestone ${getMilestoneStatus(nearestMilestone.date)}`}>
                <span className="milestone-label">MILESTONE</span>
                <span className="milestone-value">
                  {formatDate(nearestMilestone.date)}
                </span>
              </div>
            )
          })()}
          {showManager && <ProjectManagerInline userId={userId} />}
        </div>
      </div>

      <div className="project-card-body">
        <div className="project-description">
          {body ? (
            <div className="project-text">{body.length > 150 ? `${body.substring(0, 150)}...` : body}</div>
          ) : (
            <div className="project-text-placeholder">No description available</div>
          )}
        </div>
      </div>

      <div className="project-card-footer">
        <Link className="project-view-btn" href={`/projects/${id}`}>
          View Project
          <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>
    </div>
  )
}

async function ProjectManagerInline({ userId }: { userId: number }) {
  const user = await getUser(userId)
  if (!user) return null

  return (
    <div className="project-manager">
      <UserIcon />
      <Link href={`/users/${user.id}`} className="manager-name-link">
        <span className="manager-name">{user.name}</span>
      </Link>
    </div>
  )
}

export function SkeletonProjectCard() {
  return (
    <div className="enhanced-project-card skeleton-card">
      <div className="project-card-header">
        <div className="project-title-section">
          <Skeleton short />
          <Skeleton short />
        </div>
        <div className="project-meta">
          <Skeleton short />
          <Skeleton short />
        </div>
      </div>
      <div className="project-card-body">
        <div className="project-description">
          <Skeleton />
          <Skeleton short />
        </div>
      </div>
      <div className="project-card-footer">
        <SkeletonButton />
      </div>
    </div>
  )
}

