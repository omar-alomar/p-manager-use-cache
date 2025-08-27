import Link from "next/link"
import { Skeleton, SkeletonButton } from "./Skeleton"
import { getUser } from "@/db/users"
import { notFound } from "next/navigation"
import { BriefcaseIcon, UserIcon, CalendarIcon } from "./icons"

export function ProjectCard({
  id,
  title,
  client,
  body,
  apfo,
  userId,
  showManager = true
}: {
  id: number
  title: string
  client: string
  body: string
  apfo: string
  userId: number
  showManager?: boolean
}) {
  return (
    <div className="enhanced-project-card">
      <div className="project-card-header">
        <div className="project-title-section">
          <h3 className="project-title">{title}</h3>
          <div className="project-client">
            <BriefcaseIcon />
            <span>{client || 'No client specified'}</span>
          </div>
        </div>
        
        <div className="project-meta">
          {apfo && (
            <div className="project-apfo">
              <span className="apfo-label">APFO</span>
              <span className="apfo-value">{apfo}</span>
            </div>
          )}
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
      <span className="manager-name">{user.name}</span>
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

