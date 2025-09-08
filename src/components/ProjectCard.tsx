import Link from "next/link"
import { Skeleton, SkeletonButton } from "./Skeleton"
import { getUser } from "@/db/users"
import { notFound } from "next/navigation"
import { BriefcaseIcon, UserIcon, CalendarIcon } from "./icons"

function getApfoStatus(apfo: Date | null): string {
  if (!apfo) return 'normal'
  
  const today = new Date()
  const apfoDate = new Date(apfo)
  const diffTime = apfoDate.getTime() - today.getTime()
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
  apfo,
  apfos,
  userId,
  showManager = true,
  showClient = true
}: {
  id: number
  title: string
  client: string
  clientId?: number | null
  body: string
  apfo: Date | null
  apfos?: { id: number; date: Date; item: string }[]
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
            // Use nearest APFO date from apfos array if available, otherwise fall back to single apfo
            const nearestApfo = apfos && apfos.length > 0 
              ? apfos.reduce((nearest, current) => {
                  const now = new Date()
                  const nearestDate = new Date(nearest.date)
                  const currentDate = new Date(current.date)
                  
                  // If current is in the future and nearest is not, or if both are in future and current is closer
                  if (currentDate >= now && (nearestDate < now || currentDate < nearestDate)) {
                    return current
                  }
                  // If both are in the past, take the most recent
                  if (currentDate < now && nearestDate < now && currentDate > nearestDate) {
                    return current
                  }
                  return nearest
                })
              : apfo ? { date: apfo, item: '' } : null

            return nearestApfo && (
              <div className={`project-apfo ${getApfoStatus(nearestApfo.date)}`}>
                <span className="apfo-label">APFO</span>
                <span className="apfo-value">
                  {new Date(nearestApfo.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
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
            <p className="project-text">{body.length > 150 ? `${body.substring(0, 150)}...` : body}</p>
          ) : (
            <p className="project-text-placeholder">No description available</p>
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

