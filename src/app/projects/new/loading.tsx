import { SkeletonProjectForm } from "@/components/ProjectForm"

export default function LoadingNewProjectPage() {
  return (
    <>
      <h1 className="page-title">New Project</h1>
      <SkeletonProjectForm />
    </>
  )
}
