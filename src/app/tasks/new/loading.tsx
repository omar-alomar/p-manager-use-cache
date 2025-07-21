import { SkeletonTaskForm } from "@/components/TaskForm"

export default function LoadingNewTaskPage() {
  return (
    <>
      <h1 className="page-title">New Task</h1>
      <SkeletonTaskForm />
    </>
  )
}
