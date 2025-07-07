import Link from "next/link"
import { Skeleton, SkeletonButton } from "./Skeleton"
import { getUser } from "@/db/users"
import { notFound } from "next/navigation"


export function ProjectCard({
  id,
  title,
  client,
  body,
  apfo,
  userId
}: {
  id: number
  title: string
  client: string
  body: string
  apfo: string
  userId: number
}) {
  return (
    <div className="card">
      
      <div className="card-header">
        <div className="header-left">
      <h3 className="card-title">{title}</h3>
      <div className="card-subtitle">Client: {client}</div>
    </div>

    <div className="header-right">
      <div className="card-apfo">APFO: {apfo}</div>
      <ProjectManagerInline userId={userId} />
    </div>

      </div>


      <div className="card-body">
        <div className="card-preview-text whitespace-pre-wrap">{body}</div>
      </div>

      <div className="card-footer">
        <Link className="btn" href={`/projects/${id}`}>
          View
        </Link>
      </div>
    </div>
  )
}

async function ProjectManagerInline({ userId }: { userId: number }) {
  const user = await getUser(userId)
  if (!user) return null

  return <div className="card-manager-inline">PM: {user.name}</div>
}


export function SkeletonProjectCard() {
  return (
    <div className="card">
      <div className="card-header">
        <Skeleton short />
      </div>
      <div className="card-body">
        <div className="card-preview-text">
          <Skeleton />
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      </div>
      <div className="card-footer">
        <SkeletonButton />
      </div>
    </div>
  )
}

