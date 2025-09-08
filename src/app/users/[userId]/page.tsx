import { getProjectsWithUserTasks } from "@/db/projects"
import { getUserTasks } from "@/db/tasks"
import { getProjectTasks } from "@/db/tasks"
import { getUser } from "@/db/users"
import { ProjectCard, SkeletonProjectCard } from "@/components/ProjectCard"
import { Skeleton, SkeletonList } from "@/components/Skeleton"
import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/auth/currentUser"
import { CalendarIcon, BriefcaseIcon, CheckCircleIcon, ClockIcon, UserIcon, EnvelopeIcon } from "@/components/icons"
import Link from "next/link"
import { InteractiveProjectCardWithTasks } from "@/components/InteractiveProjectCardWithTasks"

export default async function UserPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  // Check if user is authenticated
  const user = await getCurrentUser()
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login")
  }

  const { userId } = await params

  return (
    <div className="user-profile-container">
      {/* Hero Section */}
      <Suspense
        fallback={
          <div className="user-hero skeleton-hero">
            <div className="hero-left-section">
              <div className="hero-avatar">
                <Skeleton className="w-24 h-24 rounded-full" />
              </div>
              <div className="hero-basic-info">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-5 w-64 mb-2" />
                <Skeleton className="h-5 w-48" />
              </div>
            </div>
            <div className="hero-right-section">
              <div className="hero-stats">
                <Skeleton className="h-16 w-20" />
                <Skeleton className="h-16 w-20" />
                <Skeleton className="h-16 w-20" />
              </div>
            </div>
          </div>
        }
      >
        <UserHero userId={userId} />
      </Suspense>

      {/* Projects Section with Integrated Tasks */}
      <div className="projects-section">
        <div className="section-header">
          <div className="section-icon">
            <BriefcaseIcon />
          </div>
          <div className="section-title-group">
            <h2 className="section-title">Projects & Assigned Tasks</h2>
            <p className="section-subtitle">Projects where this user is the manager or has tasks assigned</p>
          </div>
        </div>
        
        <div className="projects-grid">
          <Suspense
            fallback={
              <SkeletonList amount={3}>
                <SkeletonProjectCard />
              </SkeletonList>
            }
          >
            <UserProjectsWithTasks userId={userId} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

async function UserHero({ userId }: { userId: string }) {
  const user = await getUser(userId)
  if (user == null) return notFound()

  // Get user stats - projects where user is manager or has tasks
  const projects = await getProjectsWithUserTasks(userId)
  const userTasks = await getUserTasks(userId)
  const completedTasks = userTasks.filter(task => task.completed).length
  const activeTasks = userTasks.filter(task => !task.completed).length

  // Generate initials for avatar
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="user-hero">
      {/* Left Section - Avatar and Basic Info */}
      <div className="hero-left-section">
        <div className="hero-avatar">
          <div className="avatar-circle">
            <span className="avatar-text">{initials}</span>
          </div>
        </div>
        
        <div className="hero-basic-info">
          <h1 className="hero-name">{user.name}</h1>
          <div className="hero-contact-info">
            <div className="contact-item">
              <div className="contact-icon">
                <EnvelopeIcon />
              </div>
              <span className="contact-text">{user.email}</span>
            </div>
            <div className="contact-item">
              <div className="contact-icon">
                <UserIcon />
              </div>
              <span className="contact-text">{user.role}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Section - Stats */}
      <div className="hero-right-section">
        <div className="hero-stats">
          <div className="stat-card primary">
            <div className="stat-icon">
              <BriefcaseIcon />
            </div>
            <div className="stat-content">
              <div className="stat-number">{projects.length}</div>
              <div className="stat-label">Projects</div>
            </div>
          </div>
          
          <div className="stat-card success">
            <div className="stat-icon">
              <CheckCircleIcon />
            </div>
            <div className="stat-content">
              <div className="stat-number">{completedTasks}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-icon">
              <ClockIcon />
            </div>
            <div className="stat-content">
              <div className="stat-number">{activeTasks}</div>
              <div className="stat-label">Active</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

async function UserProjectsWithTasks({ userId }: { userId: string }) {
  const projects = await getProjectsWithUserTasks(userId)

  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <BriefcaseIcon />
        </div>
        <h3 className="empty-title">No projects yet</h3>
        <p className="empty-description">This user isn&apos;t managing any projects or assigned to any tasks.</p>
      </div>
    )
  }

  return (
    <div className="projects-grid">
      {projects.map(async (project) => {
        // Get only tasks assigned to this specific user for this project
        const userTasks = await getUserTasks(userId)
        const projectUserTasks = userTasks.filter(task => task.projectId === project.id)
        
        let projectManager = null
        
        try {
          projectManager = await getUser(project.userId)
        } catch (error) {
          console.error(`Failed to fetch project manager for project ${project.id}:`, error)
        }
        
        return (
          <InteractiveProjectCardWithTasks 
            key={project.id} 
            id={project.id}
            title={project.title}
            client={project.clientRef?.name || 'No client specified'}
            clientId={project.clientRef?.id}
            body={project.body}
            apfo={project.apfo}
            apfos={project.apfos}
            userId={project.userId}
            showManager={true}
            tasks={projectUserTasks}
            projectManager={projectManager ? { id: projectManager.id, name: projectManager.name } : undefined}
          />
        )
      })}
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