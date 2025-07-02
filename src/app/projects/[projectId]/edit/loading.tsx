import { SkeletonProjectForm } from "@/components/ProjectForm"

export default function LoadingEditProjectPage() {
  return (
    <>
      <h1 className="page-title">Edit Project</h1>
      <SkeletonProjectForm />
    </>
  )
}
