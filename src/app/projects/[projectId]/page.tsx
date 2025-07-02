import { getProjectComments } from "@/db/comments"
import { getProject } from "@/db/projects"
import { getUser } from "@/db/users"
import { Skeleton, SkeletonList } from "@/components/Skeleton"
import Link from "next/link"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { DeleteButton } from "./_DeleteButton"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  return (
    <>
      <Suspense
        fallback={
          <>
            <div className="page-title">
              <Skeleton inline short />
              <div className="title-btns">
                <Link
                  className="btn btn-outline"
                  href={`/projects/${projectId}/edit`}
                >
                  Edit
                </Link>
                <DeleteButton projectId={projectId} />
              </div>
            </div>
            <span className="page-subtitle">
              By: <Skeleton short inline />
            </span>
            <div>
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
          </>
        }
      >
        <ProjectDetails projectId={projectId} />
      </Suspense>

      <h3 className="mt-4 mb-2">Comments</h3>
      <div className="card-stack">
        <Suspense
          fallback={
            <SkeletonList amount={5}>
              <div className="card">
                <div className="card-body">
                  <div className="text-sm mb-1">
                    <Skeleton short />
                  </div>
                  <Skeleton />
                  <Skeleton />
                </div>
              </div>
            </SkeletonList>
          }
        >
          <Comments projectId={projectId} />
        </Suspense>
      </div>
    </>
  )
}

async function ProjectDetails({ projectId }: { projectId: string }) {
  const project = await getProject(projectId)

  if (project == null) return notFound()

  return (
    <>
      <div className="page-title">
        <h1>{project.title}</h1>
        <div className="title-btns">
          <Link className="btn btn-outline" href={`/projects/${projectId}/edit`}>
            Edit
          </Link>
          <DeleteButton projectId={projectId} />
        </div>
      </div>
      <span className="page-subtitle">
        By:{" "}
        <Suspense fallback={<Skeleton short inline />}>
          <UserDetails userId={project.userId} />
        </Suspense>
      </span>
      <div>{project.body}</div>
    </>
  )
}

async function UserDetails({ userId }: { userId: number }) {
  const user = await getUser(userId)

  if (user == null) return notFound()

  return <Link href={`/users/${user.id}`}>{user.name}</Link>
}

async function Comments({ projectId }: { projectId: string }) {
  const comments = await getProjectComments(projectId)

  return comments.map(comment => (
    <div key={comment.id} className="card">
      <div className="card-body">
        <div className="text-sm mb-1">{comment.email}</div>
        {comment.body}
      </div>
    </div>
  ))
}
