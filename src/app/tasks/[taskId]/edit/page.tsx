import { getTask } from "@/db/tasks"
import { getUsers } from "@/db/users"
import { getProjects } from "@/db/projects"
import { TaskForm } from "@/components/TaskForm"
import { Skeleton } from "@/components/Skeleton"
import { Suspense } from "react"
import { notFound } from "next/navigation"

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = await params

  return (
    <>
      <div className="page-title">
        <div className="title-content">
          <h1>Edit Task</h1>
          <p className="page-subtitle">Modify task details and assignments</p>
        </div>
      </div>
      
      <Suspense
        fallback={
          <div className="edit-task-skeleton">
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        }
      >
        <EditTaskForm taskId={taskId} />
      </Suspense>
    </>
  )
}

async function EditTaskForm({ taskId }: { taskId: string }) {
  const task = await getTask(taskId)
  
  if (!task) {
    notFound()
  }

  const users = await getUsers()
  const projects = await getProjects()

  return (
    <div className="edit-task-container">
      <div className="task-preview">
        <h3 className="preview-title">Editing Task</h3>
        <div className="preview-content">
          <div className="preview-item">
            <span className="preview-label">Current Title:</span>
            <span className="preview-value">{task.title}</span>
          </div>
          <div className="preview-item">
            <span className="preview-label">Status:</span>
            <span className={`preview-status ${task.completed ? 'completed' : 'pending'}`}>
              {task.completed ? 'Completed' : 'Pending'}
            </span>
          </div>
        </div>
      </div>
      
      <TaskForm 
        users={users} 
        projects={projects} 
        task={{
          id: task.id,
          title: task.title,
          completed: task.completed,
          userId: task.userId,
          projectId: task.projectId
        }} 
      />
    </div>
  )
}


