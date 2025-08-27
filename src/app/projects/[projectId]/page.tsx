import { getProjectComments } from "@/db/comments"
import { getProject } from "@/db/projects"
import { getUser } from "@/db/users"
import Link from "next/link"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { DeleteButton } from "./_DeleteButton"
import { getProjectTasks } from "@/db/tasks"
import { TaskItem } from "@/components/TaskItem"
import { EditableComments } from "@/components/EditableComments"
import { AddTaskToProjectButton } from "@/components/AddTaskToProjectButton"
import { ProjectEmptyStateActions } from "@/components/ProjectEmptyStateActions"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Hero Section */}
      <Suspense
        fallback={
          <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>
              <div style={{ height: '24px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '33%', marginBottom: '12px' }}></div>
              <div style={{ height: '14px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '50%' }}></div>
            </div>
          </div>
        }
      >
        <ProjectHero projectId={projectId} />
      </Suspense>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          {/* Project Details Section */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '6px', backgroundColor: '#f3e8ff', borderRadius: '6px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>Project Details</h2>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '3px 0 0 0' }}>Project information and metadata</p>
                </div>
              </div>
            </div>
            
            <div style={{ padding: '20px' }}>
              <Suspense
                fallback={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} style={{ height: '20px', backgroundColor: '#f3f4f6', borderRadius: '4px', width: i === 1 ? '60%' : i === 2 ? '40%' : i === 3 ? '50%' : '70%' }}></div>
                    ))}
                  </div>
                }
              >
                <ProjectDetails projectId={projectId} />
              </Suspense>
            </div>
          </div>

          {/* Tasks Section */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '6px', backgroundColor: '#dcfce7', borderRadius: '6px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>Tasks</h2>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '3px 0 0 0' }}>Project task management</p>
                  </div>
                </div>
                <AddTaskToProjectButton projectId={projectId} />
              </div>
            </div>
            
            <div style={{ padding: '20px' }}>
              <Suspense
                fallback={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} style={{ height: '48px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}></div>
                    ))}
                  </div>
                }
              >
                <Tasks projectId={projectId} />
              </Suspense>
            </div>
          </div>

          {/* Comments Section */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '6px', backgroundColor: '#dbeafe', borderRadius: '6px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>Comments & Notes</h2>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '3px 0 0 0' }}>Project documentation</p>
                </div>
              </div>
            </div>
            
            <div style={{ padding: '20px' }}>
              <Suspense
                fallback={
                  <div style={{ height: '72px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}></div>
                }
              >
                <Comments projectId={projectId} />
              </Suspense>
            </div>
          </div>

          {/* Project Details Section */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', backgroundColor: '#e0e7ff', borderRadius: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>Project Details</h2>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>Key information</p>
                </div>
              </div>
            </div>
            
            <div style={{ padding: '24px' }}>
              <Suspense
                fallback={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i}>
                        <div style={{ height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '33%', marginBottom: '8px' }}></div>
                        <div style={{ height: '24px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}></div>
                      </div>
                    ))}
                  </div>
                }
              >
                <ProjectDetails projectId={projectId} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

async function ProjectHero({ projectId }: { projectId: string }) {
  try {
    const project = await getProject(projectId)
    if (project == null) return notFound()

    const tasks = await getProjectTasks(projectId)
    const completedTasks = tasks.filter(task => task.completed).length
    const activeTasks = tasks.filter(task => !task.completed).length

    return (
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '32px', alignItems: 'start' }}>
            {/* Project Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', backgroundColor: '#3b82f6', borderRadius: '6px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>{project.title}</h1>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {project.client && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '9999px', fontSize: '13px', fontWeight: '500' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        {project.client}
                      </span>
                    )}
                    {project.apfo && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '9999px', fontSize: '13px', fontWeight: '500' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10,9 9,9 8,9"/>
                        </svg>
                        {project.apfo}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {project.body && (
                <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6', maxWidth: '768px' }}>
                  {project.body}
                </p>
              )}
            </div>

            {/* Stats & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '280px' }}>
              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                  <div style={{ width: '32px', height: '32px', backgroundColor: '#bbf7d0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#166534', marginBottom: '4px' }}>{completedTasks}</div>
                  <div style={{ fontSize: '11px', color: '#166534', fontWeight: '500' }}>Completed</div>
                </div>
                
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#fffbeb', borderRadius: '6px', border: '1px solid #fcd34d' }}>
                  <div style={{ width: '32px', height: '32px', backgroundColor: '#fcd34d', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>{activeTasks}</div>
                  <div style={{ fontSize: '11px', color: '#92400e', fontWeight: '500' }}>Active</div>
                </div>
                
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                  <div style={{ width: '32px', height: '32px', backgroundColor: '#bfdbfe', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e40af', marginBottom: '4px' }}>{tasks.length}</div>
                  <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: '500' }}>Total</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link 
                  href={`/projects/${projectId}/edit`}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', fontWeight: '500', borderRadius: '6px', textDecoration: 'none', transition: 'background-color 0.2s', fontSize: '13px' }}
                >
                  Edit Project
                </Link>
                <DeleteButton projectId={projectId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error in ProjectHero:', error)
    return (
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '64px 16px' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>Error Loading Project</h1>
            <p style={{ color: '#4b5563' }}>There was an error loading the project information.</p>
          </div>
        </div>
      </div>
    )
  }
}

async function ProjectDetails({ projectId }: { projectId: string }) {
  try {
    const project = await getProject(projectId)
    if (project == null) return notFound()

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Project Manager
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', backgroundColor: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <Suspense fallback={<span style={{ color: '#9ca3af' }}>Loading...</span>}>
                <UserDetails userId={project.userId} />
              </Suspense>
            </div>
          </div>

          {project.client && (
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Client
              </label>
              <div style={{ color: '#111827', fontWeight: '500' }}>{project.client}</div>
            </div>
          )}

          {project.apfo && (
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                APFO
              </label>
              <div style={{ color: '#111827', fontWeight: '500' }}>{project.apfo}</div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Created
            </label>
            <div style={{ color: '#111827', fontWeight: '500' }}>
              {new Date(project.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Description
            </label>
            <div style={{ color: '#111827', lineHeight: '1.6' }}>
              {project.body || (
                <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No description provided</span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error in ProjectDetails:', error)
    return (
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <p style={{ color: '#6b7280' }}>Error loading project details</p>
      </div>
    )
  }
}

async function UserDetails({ userId }: { userId: number }) {
  try {
    const user = await getUser(userId)
    if (user == null) return notFound()

    return (
      <Link 
        href={`/users/${user.id}`} 
        style={{ color: '#3b82f6', fontWeight: '500', textDecoration: 'none' }}
      >
        {user.name}
      </Link>
    )
  } catch (error) {
    console.error('Error in UserDetails:', error)
    return <span style={{ color: '#9ca3af' }}>Error loading user</span>
  }
}

async function Tasks({ projectId }: { projectId: string }) {
  try {
    const tasks = await getProjectTasks(projectId)
    const project = await getProject(projectId)
    
    if (tasks.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', margin: '0 0 8px 0' }}>No tasks yet</h3>
          <p style={{ color: '#6b7280', margin: '0 0 24px 0' }}>Get started by creating your first task for this project.</p>
          <ProjectEmptyStateActions projectId={projectId} />
        </div>
      )
    }

    return (
      <div className="tasks-list">
        {tasks.map(task => (
          <TaskItem 
            key={task.id}
            id={task.id}
            initialCompleted={task.completed}
            title={task.title}
            projectId={task.projectId}
            projectTitle={project?.title || ""}
            userId={task.userId}
            userName={task.User?.name} 
            displayProject={false}
            displayUser={true}
          />
        ))}
      </div>
    )
  } catch (error) {
    console.error('Error in Tasks:', error)
    return (
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <p style={{ color: '#6b7280' }}>Error loading tasks</p>
      </div>
    )
  }
}

async function Comments({ projectId }: { projectId: string }) {
  try {
    const comments = await getProjectComments(projectId)
    const project = await getProject(projectId)

    if (project == null) return notFound()

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ backgroundColor: '#eff6ff', borderRadius: '8px', padding: '24px', border: '1px solid #bfdbfe' }}>
          <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 12px 0' }}>Project Comments</h4>
          <EditableComments
            projectId={project.id}
            initialComments={project.body}
            title={project.title}
            client={project.client}
            apfo={project.apfo}
            coFileNumbers={project.coFileNumbers || ""}
            dldReviewer={project.dldReviewer || ""}
            userId={project.userId}
          />
        </div>
        
        {comments.length > 0 && (
          <div>
            <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>External Comments</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {comments.map(comment => (
                <div key={comment.id} style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', backgroundColor: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                      <span style={{ fontWeight: '500', color: '#111827' }}>{comment.email}</span>
                    </div>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      {new Date(comment.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div style={{ color: '#374151', lineHeight: '1.5' }}>{comment.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error('Error in Comments:', error)
    return (
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <p style={{ color: '#6b7280' }}>Error loading comments</p>
      </div>
    )
  }
}


