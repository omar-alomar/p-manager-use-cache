import { Suspense } from "react"
import { MyTasksContent } from "@/components/MyTasksContent"
import TasksLoading from "../tasks/loading"

export default async function MyTasksPage() {
  return (
    <div className="my-tasks-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">
            Tasks assigned to you across all projects
          </p>
        </div>
      </div>

      <Suspense fallback={<TasksLoading />}>
        <MyTasksContent />
      </Suspense>
    </div>
  )
}
