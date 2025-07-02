import { getTasks } from "@/db/tasks"
import { Skeleton, SkeletonList } from "@/components/Skeleton"
import { TaskItem } from "@/components/TaskItem"
import { Suspense } from "react"

export default function TasksPage() {
  return (
    <>
      <h1 className="page-title">Tasks</h1>
      <ul>
        <Suspense
          fallback={
            <SkeletonList amount={10}>
              <li>
                <Skeleton short />
              </li>
            </SkeletonList>
          }
        >
          <TasksList />
        </Suspense>
      </ul>
    </>
  )
}

async function TasksList() {
  const tasks = await getTasks()

  return tasks.map(task => <TaskItem key={task.id} {...task} />)
}
