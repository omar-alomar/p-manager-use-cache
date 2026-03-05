import { redirect } from "next/navigation"
import { getCurrentUser } from "@/auth/currentUser"
import { getUsers } from "@/db/users"
import Link from "next/link"
import { Role } from "@prisma/client"
import { avatarColorClass } from "@/utils/avatarColor"

export default async function UsersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }
  const users = await getUsers()

  return (
    <>
      <div className="page-title">
        <div className="title-content">
          <h1>Team</h1>
          <p className="page-subtitle">
            {users.length} member{users.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>No Team Members Yet</h3>
          <p>Get started by adding your first team member.</p>
        </div>
      ) : (
        <div className="team-grid">
          {users.map(u => {
            const initials = u.name.split(' ').map(n => n[0]).join('').toUpperCase()
            const projectCount = u.projects?.length || 0
            const taskCount = u.tasks?.length || 0
            const isAdmin = u.role === Role.admin
            const colorClass = avatarColorClass(u.name)

            return (
              <Link key={u.id} href={`users/${u.id.toString()}`} className="team-card">
                <div className="team-card-top">
                  <div className={`team-card-avatar ${colorClass}`}>
                    {initials}
                  </div>
                  <div className="team-card-identity">
                    <span className="team-card-name">{u.name}</span>
                    <span className="team-card-email">{u.email}</span>
                  </div>
                  {isAdmin && <span className="team-card-role">Admin</span>}
                </div>

                <div className="team-card-stats">
                  <div className="team-card-stat">
                    <span className="team-card-stat-value">{projectCount}</span>
                    <span className="team-card-stat-label">Projects</span>
                  </div>
                  <div className="team-card-stat-divider" />
                  <div className="team-card-stat">
                    <span className="team-card-stat-value">{taskCount}</span>
                    <span className="team-card-stat-label">Tasks</span>
                  </div>
                </div>

                {u.projects && u.projects.length > 0 && (
                  <div className="team-card-projects">
                    {u.projects.slice(0, 3).map(project => (
                      <span key={project.id} className="team-card-project">
                        {project.title}
                      </span>
                    ))}
                    {u.projects.length > 3 && (
                      <span className="team-card-project team-card-project-more">
                        +{u.projects.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="team-card-footer">
                  <span className="team-card-joined">
                    Joined {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                  <svg className="team-card-arrow" width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
