import { getUserProjects } from "@/db/projects"
import { getUserTasks } from "@/db/tasks"
import { getProjectTasks } from "@/db/tasks"
import { getUser } from "@/db/users"
import { ProjectCard, SkeletonProjectCard } from "@/components/ProjectCard"
import { Skeleton, SkeletonList } from "@/components/Skeleton"
import { TaskItem } from "@/components/TaskItem"
import { Suspense } from "react"
import { notFound } from "next/navigation"

export default async function UserPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  return (
    <>
      <Suspense
        fallback={
          <>
            <h1 className="page-title">
              <Skeleton short inline />
            </h1>
            <div className="page-subtitle">
              <Skeleton short inline />
            </div>
          </>
        }
      >
        <UserDetails userId={userId} />
      </Suspense>

      <h3 className="mt-4 mb-2">Projects</h3>
      <div className="card-grid">
        <Suspense
          fallback={
            <SkeletonList amount={3}>
              <SkeletonProjectCard />
            </SkeletonList>
          }
        >
          <UserProjects userId={userId} />
        </Suspense>
      </div>
      <h3 className="mt-4 mb-2">Tasks</h3>
      <ul>
        <Suspense
          fallback={
            <SkeletonList amount={5}>
              <li>
                <Skeleton short />
              </li>
            </SkeletonList>
          }
        >
          <Tasks userId={userId} />
        </Suspense>
      </ul>
    </>
  )
}

async function UserDetails({ userId }: { userId: string }) {
  const user = await getUser(userId)

  if (user == null) return notFound()

  return (
    <>
      <h1 className="page-title">{user.name}</h1>
      <div className="page-subtitle">{user.email}</div>
    </>
  )
}

async function UserProjects({ userId }: { userId: string }) {
  const projects = await getUserProjects(userId)

  return projects.map(project => <ProjectCard key={project.id} {...project} />)
}

async function Tasks({ userId }: { userId: string }) {
  const projects = await getUserProjects(userId)
  
  const allTasks = await Promise.all(
    projects.map(project => getProjectTasks(project.id)) // You'd need this function
  )
  
  const tasks = allTasks.flat() // Flatten the array of arrays
  
  return tasks.map(task => (
    <TaskItem 
      key={task.id} 
      id={task.id}
      initialCompleted={task.completed}
      title={task.title}
      projectId={task.projectId}
      projectTitle={task.Project?.title || ""}
      userId={task.userId}
    />
  ))
}