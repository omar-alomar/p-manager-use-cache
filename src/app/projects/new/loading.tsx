import { SkeletonProjectForm } from "@/components/ProjectForm"

export default function LoadingNewProjectPage() {
  return (
    <>
      <div className="page-title">
        <div className="title-content">
          <h1>New Project</h1>
          <p className="page-subtitle">Create a new project and assign it to a project manager</p>
        </div>
      </div>
      <SkeletonProjectForm />
    </>
  )
}
