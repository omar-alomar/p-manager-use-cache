import { Suspense } from "react"
import { TasksPageContent } from "@/components/TasksPageContent"
import TasksLoading from "./loading"

export default async function TasksPage() {
  return (
    <div className="tasks-page">
      <div className="page-title">
        <div className="title-content">
          <h1>Task Management</h1>
          <p className="page-subtitle">
            Manage and track all tasks across your projects
          </p>
        </div>
      </div>

      <Suspense fallback={<TasksLoading />}>
        <TasksPageContent />
      </Suspense>
    </div>
  )
}
