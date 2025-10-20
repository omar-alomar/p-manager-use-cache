import { redirect } from "next/navigation"
import { getCurrentUser } from "@/auth/currentUser"
import { getUsers } from "@/db/users"
import Link from "next/link"
import { Role } from "@prisma/client"

export default async function UsersPage() {
  // Check if user is authenticated
  const user = await getCurrentUser()
  
  // Redirect to login if not authenticated
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
      <div className="team-grid">
        {users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No Team Members Yet</h3>
            <p>Get started by adding your first team member.</p>
          </div>
        ) : (
          users.map(user => (
            <div key={user.id} className="team-card">
              <Link href={`users/${user.id.toString()}`} className="team-card-clickable">
                <div className="team-card-header">
                  <div className="user-avatar">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="user-info">
                    <h3 className="user-name">{user.name}</h3>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>
                <div className="team-card-body">
                  <div className="user-metrics">
                    <div className="metric">
                      <span className="metric-value">{user.projects?.length || 0}</span>
                      <span className="metric-label">Projects</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{user.tasks?.length || 0}</span>
                      <span className="metric-label">Tasks</span>
                    </div>
                  </div>
                  
                  {user.projects && user.projects.length > 0 && (
                    <div className="user-projects">
                      <div className="projects-header">
                        <span className="projects-title">Projects</span>
                      </div>
                      <div className="projects-list">
                        {user.projects.slice(0, 2).map(project => (
                          <div key={project.id} className="project-item">
                            <div className="project-dot"></div>
                            <div className="project-info">
                              <div className="project-name">{project.title}</div>
                            </div>
                          </div>
                        ))}
                        {user.projects.length > 2 && (
                          <div className="project-item project-more">
                            <div className="project-dot"></div>
                            <div className="project-info">
                              <div className="project-name">+{user.projects.length - 2} more</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="user-meta">
                    <span className="join-date">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    <div className="meta-right">
                      <div className={`user-role-badge role-${user.role || 'default'}`}>
                        {user.role || Role.user}
                      </div>
                      <span className="click-hint">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>
    </>
  )
}
