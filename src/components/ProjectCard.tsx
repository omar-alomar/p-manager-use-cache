import Link from "next/link"
import { Skeleton, SkeletonButton } from "./Skeleton"

export function ProjectCard({
  id,
  title,
  body,
}: {
  id: number
  title: string
  body: string
}) {
  return (
    <div className="card">
      <div className="card-header">{title}</div>
      <div className="card-body">
        <div className="card-preview-text">{body}</div>
      </div>
      <div className="card-footer">
        <Link className="btn" href={`/projects/${id}`}>
          View
        </Link>
      </div>
    </div>
  )
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
