import { getClient } from "@/db/clients"
import Link from "next/link"
import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/auth/currentUser"
import { DeleteClientButton } from "./_DeleteButton"
import { ProjectCard } from "@/components/ProjectCard"

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  // Check if user is authenticated
  const user = await getCurrentUser()
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login")
  }

  const { clientId } = await params

  return (
    <div className="project-profile-container">
      {/* Hero Section */}
      <Suspense
        fallback={
          <div className="project-hero skeleton-hero">
            <div className="hero-left-section">
              <div className="hero-avatar">
                <div className="avatar-circle skeleton-avatar"></div>
              </div>
              <div className="hero-basic-info">
                <div className="skeleton-title"></div>
                <div className="skeleton-subtitle"></div>
              </div>
            </div>
          </div>
        }
      >
        <ClientHero clientId={clientId} />
      </Suspense>

      <div className="project-content-grid">
        {/* Client Details Section */}
        <div className="content-section">
          <div className="section-header">
            <div className="section-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="section-title-group">
              <h2 className="section-title">Client Details</h2>
              <p className="section-subtitle">Contact information and metadata</p>
            </div>
          </div>
          
          <div className="section-content">
            <Suspense
              fallback={
                <div className="skeleton-content">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="skeleton-row">
                      <div className="skeleton-label"></div>
                      <div className="skeleton-value"></div>
                    </div>
                  ))}
                </div>
              }
            >
              <ClientDetails clientId={clientId} />
            </Suspense>
          </div>
        </div>

        {/* Projects Section */}
        <div className="content-section">
          <div className="section-header">
            <div className="section-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <div className="section-title-group">
              <h2 className="section-title">Associated Projects</h2>
              <p className="section-subtitle">Projects for this client</p>
            </div>
          </div>
          
          <div className="section-content">
            <Suspense
              fallback={
                <div className="skeleton-content">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton-task"></div>
                  ))}
                </div>
              }
            >
              <ClientProjects clientId={clientId} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

async function ClientHero({ clientId }: { clientId: string }) {
  try {
    const client = await getClient(clientId)
    if (client == null) return notFound()

    return (
      <div className="project-hero">
        {/* Left Section - Client Info */}
        <div className="hero-left-section">
          <div className="hero-avatar">
            <div className="avatar-circle">
              <span className="avatar-text">
                {client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
          </div>
          
          <div className="hero-basic-info">
            <h1 className="hero-name">{client.name}</h1>
            {client.companyName && (
              <div className="hero-company">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21h18"/>
                  <path d="M5 21V7l8-4v18"/>
                  <path d="M19 21V11l-6-4"/>
                </svg>
                {client.companyName}
              </div>
            )}
            <div className="hero-tags">
              <span className="hero-tag client">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                {client.email}
              </span>
              {client.phone && (
                <span className="hero-tag milestone">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  {client.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Stats & Actions */}
        <div className="hero-right-section">
          <div className="hero-stats">
            <div className="stat-card primary">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              </div>
            <div className="stat-content">
              <div className="stat-number">{client.projects.length}</div>
              <div className="stat-label">Projects</div>
            </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="hero-actions">
            <Link 
              href={`/clients/${clientId}/edit?from=client-page`}
              className="hero-action-btn primary"
            >
              Edit Client
            </Link>
            <DeleteClientButton clientId={Number(clientId)} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error in ClientHero:', error)
    return (
      <div className="project-hero error">
        <div className="hero-error-content">
          <h1 className="hero-error-title">Error Loading Client</h1>
          <p className="hero-error-message">There was an error loading the client information.</p>
        </div>
      </div>
    )
  }
}

async function ClientDetails({ clientId }: { clientId: string }) {
  try {
    const client = await getClient(clientId)
    if (client == null) return notFound()

    return (
      <div className="project-details-grid">
        <div className="detail-item">
          <label className="detail-label">
            Email Address
          </label>
          <div className="detail-value">
            <a href={`mailto:${client.email}`} className="email-link">
              {client.email}
            </a>
          </div>
        </div>

        {client.companyName && (
          <div className="detail-item">
            <label className="detail-label">
              Company Name
            </label>
            <div className="detail-value">
              {client.companyName}
            </div>
          </div>
        )}

        {client.phone && (
          <div className="detail-item">
            <label className="detail-label">
              Phone Number
            </label>
            <div className="detail-value">
              <a href={`tel:${client.phone}`} className="phone-link">
                {client.phone}
              </a>
            </div>
          </div>
        )}

        {client.address && (
          <div className="detail-item">
            <label className="detail-label">
              Address
            </label>
            <div className="detail-value" style={{ whiteSpace: 'pre-line' }}>
              {client.address.replace(/\r\n/g, '\n').replace(/\r/g, '\n')}
            </div>
          </div>
        )}

        <div className="detail-item">
          <label className="detail-label">
            Created
          </label>
          <div className="detail-value">
            {new Date(client.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error in ClientDetails:', error)
    return (
      <div className="error-state">
        <p className="error-message">Error loading client details</p>
      </div>
    )
  }
}

async function ClientProjects({ clientId }: { clientId: string }) {
  try {
    const client = await getClient(clientId)
    if (client == null) return notFound()

    if (client.projects.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <h3 className="empty-title">No projects yet</h3>
          <p className="empty-description">This client doesn&apos;t have any associated projects.</p>
        </div>
      )
    }

    return (
      <div className="projects-grid">
        {client.projects.map(project => (
          <ProjectCard
            key={project.id}
            id={project.id}
            title={project.title}
            client={client.name}
            clientId={client.id}
            body={project.body}
            milestone={project.milestone}
            milestones={project.milestones}
            userId={project.user.id}
            showManager={true}
            showClient={true}
          />
        ))}
      </div>
    )
  } catch (error) {
    console.error('Error in ClientProjects:', error)
    return (
      <div className="error-state">
        <p className="error-message">Error loading projects</p>
      </div>
    )
  }
}
