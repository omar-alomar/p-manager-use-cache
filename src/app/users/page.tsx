import { getUsers } from "@/db/users"
import Link from "next/link"
import { UserDeleteButton } from "@/components/UserDeleteButton"

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <>
      <div className="page-title">
        <h1>Team</h1>
        <div className="team-count">
          {users.length} member{users.length !== 1 ? 's' : ''}
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
              <div className="team-card-header">
                <div className="user-avatar">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="user-info">
                  <h3 className="user-name">{user.name}</h3>
                  <span className={`user-role role-${user.role || 'default'}`}>
                    {user.role || 'user'}
                  </span>
                </div>
                <div className="user-actions">
                  <UserDeleteButton userId={user.id} userName={user.name} />
                </div>
              </div>
              <Link href={`users/${user.id.toString()}`} className="team-card-clickable">
                <div className="team-card-body">
                  <div className="user-email">
                    <div className="email-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    {user.email}
                  </div>
                  <div className="user-stats">
                    <div className="stat-item">
                      <div className="stat-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                      </div>
                      <span className="stat-label">Projects</span>
                      <span className="stat-value">{user.projects?.length || 0}</span>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9,11 12,14 22,4"/>
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                        </svg>
                      </div>
                      <span className="stat-label">Tasks</span>
                      <span className="stat-value">{user.tasks?.length || 0}</span>
                    </div>
                  </div>
                  <div className="user-joined">
                    <div className="joined-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                    <span className="click-hint">→</span>
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
