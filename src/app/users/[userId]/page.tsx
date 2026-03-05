import { getProjectsWithUserTasks } from "@/db/projects"
import { getUserTasks } from "@/db/tasks"
import { getUser } from "@/db/users"
import { ProjectCard, SkeletonProjectCard } from "@/components/ProjectCard"
import { SkeletonList } from "@/components/Skeleton"
import { ClientProjectsFilter } from "@/components/ClientProjectsFilter"
import { UserTasksSection } from "@/components/UserTasksSection"
import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/auth/currentUser"
import { avatarColorClass } from "@/utils/avatarColor"

export default async function UserPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const { userId } = await params

  return (
    <div className="project-profile-container">
      {/* Hero Section */}
      <Suspense
        fallback={
          <div className="client-hero skeleton-hero">
            <div className="hero-top-row">
              <div className="hero-identity">
                <div className="hero-avatar">
                  <div className="avatar-circle skeleton-avatar"></div>
                </div>
                <div className="hero-title-group">
                  <div className="skeleton-heading" style={{ width: '50%' }}></div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <div className="skeleton" style={{ width: 120, height: 20, borderRadius: 999 }}></div>
                    <div className="skeleton" style={{ width: 90, height: 20, borderRadius: 999 }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="hero-stats-bar">
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
                  <div className="skeleton" style={{ width: 24, height: 22 }}></div>
                  <div className="skeleton-text" style={{ width: 55 }}></div>
                </div>
              ))}
            </div>
          </div>
        }
      >
        <UserHero userId={userId} />
      </Suspense>

      <div className="project-detail-body">
        <div className="project-detail-grid">
          {/* Projects Column */}
          <div className="project-detail-col">
            <div className="open-section">
              <h3 className="open-section-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
                Projects
              </h3>
              <Suspense
                fallback={
                  <div className="projects-grid">
                    <SkeletonList amount={3}>
                      <SkeletonProjectCard />
                    </SkeletonList>
                  </div>
                }
              >
                <UserProjects userId={userId} />
              </Suspense>
            </div>
          </div>

          <div className="project-detail-divider" />

          {/* Tasks Column */}
          <div className="project-detail-col">
            <div className="open-section">
              <h3 className="open-section-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                Tasks
              </h3>
              <Suspense
                fallback={
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }}></div>
                    ))}
                  </div>
                }
              >
                <UserTasksSectionWrapper userId={userId} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

async function UserTasksSectionWrapper({ userId }: { userId: string }) {
  const tasks = await getUserTasks(userId)

  if (tasks.length === 0) {
    return (
      <div className="empty-state empty-state--inline">
        <div className="empty-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </div>
        <h3 className="empty-title">No tasks yet</h3>
        <p className="empty-description">This user has no assigned tasks.</p>
      </div>
    )
  }

  // Group tasks by project
  type TaskType = typeof tasks[number]
  const grouped = new Map<string, { project: { id: number; title: string } | null; tasks: TaskType[] }>()

  for (const task of tasks) {
    const key = task.projectId ? String(task.projectId) : "none"
    if (!grouped.has(key)) {
      grouped.set(key, {
        project: task.Project ? { id: task.Project.id, title: task.Project.title } : null,
        tasks: [],
      })
    }
    grouped.get(key)!.tasks.push(task)
  }

  // Sort groups: projects with tasks first (alphabetical), then unassigned
  const sortedGroups = [...grouped.entries()].sort((a, b) => {
    if (!a[1].project) return 1
    if (!b[1].project) return -1
    return a[1].project.title.localeCompare(b[1].project.title)
  })

  return <UserTasksSection groups={sortedGroups.map(([, g]) => g)} />
}

async function UserHero({ userId }: { userId: string }) {
  const user = await getUser(userId)
  if (user == null) return notFound()

  const projects = await getProjectsWithUserTasks(userId)
  const userTasks = await getUserTasks(userId)
  const completedTasks = userTasks.filter(t => t.completed).length
  const activeTasks = userTasks.filter(t => !t.completed).length

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="client-hero">
      {/* Row 1: Identity */}
      <div className="hero-top-row">
        <div className="hero-identity">
          <div className="hero-avatar">
            <div className={`avatar-circle ${avatarColorClass(user.name)}`}>
              <span className="avatar-text">{initials}</span>
            </div>
          </div>
          <div className="hero-title-group">
            <div className="hero-title-row">
              <h1 className="hero-name">{user.name}</h1>
              <span className="hero-badge company">{user.role}</span>
            </div>
            <div className="hero-tags">
              <span className="hero-tag client">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                {user.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Stats bar */}
      <div className="hero-stats-bar">
        <div className="hero-stat">
          <span className="hero-stat-number">{projects.filter(p => !p.archived).length}</span>
          <span className="hero-stat-label">Projects</span>
        </div>
        <div className="hero-stat-divider" />
        <div className="hero-stat">
          <span className="hero-stat-number hero-stat-success">{completedTasks}</span>
          <span className="hero-stat-label">Completed</span>
        </div>
        <div className="hero-stat-divider" />
        <div className="hero-stat">
          <span className="hero-stat-number hero-stat-warning">{activeTasks}</span>
          <span className="hero-stat-label">Active</span>
        </div>
      </div>
    </div>
  )
}

async function UserProjects({ userId }: { userId: string }) {
  const projects = await getProjectsWithUserTasks(userId)

  if (projects.length === 0) {
    return (
      <div className="empty-state empty-state--inline">
        <div className="empty-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        </div>
        <h3 className="empty-title">No projects yet</h3>
        <p className="empty-description">This user isn&apos;t managing any projects or assigned to any tasks.</p>
      </div>
    )
  }

  const activeProjects = projects.filter(p => !p.archived)
  const archivedProjects = projects.filter(p => p.archived)

  const renderGrid = (items: typeof projects, emptyMsg: string) =>
    items.length > 0 ? (
      <div className="projects-grid">
        {items.map(project => (
          <ProjectCard
            key={project.id}
            id={project.id}
            title={project.title}
            client={project.clientRef?.name || "No client"}
            clientId={project.clientRef?.id}
            body={project.body}
            milestone={project.milestone}
            milestones={project.milestones}
            userId={project.userId}
            archived={project.archived}
            showManager={true}
            showClient={true}
          />
        ))}
      </div>
    ) : (
      <div className="empty-state">
        <p className="empty-description">{emptyMsg}</p>
      </div>
    )

  return (
    <ClientProjectsFilter
      activeProjects={renderGrid(activeProjects, "No active projects.")}
      archivedProjects={renderGrid(archivedProjects, "No archived projects.")}
    />
  )
}
