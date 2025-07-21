import { getUsersWithTasks } from "@/db/users"
import { Skeleton, SkeletonList } from "@/components/Skeleton"
import { TaskItem } from "@/components/TaskItem"
import { Suspense } from "react"
import Link from "next/link"

export default function TasksPage() {
  return (
    <>
      <div className="page-title">
        <h1>TASK STATUS</h1>
        <div className="title-btns">
          <Link className="btn" href="/tasks/new">
            New Task
          </Link>
        </div>
      </div>
      <Suspense
        fallback={
          <SkeletonList amount={10}>
            <li>
              <Skeleton short />
            </li>
          </SkeletonList>
        }
      >
        <Tasks />
      </Suspense>
    </>
  )
}

async function Tasks() {
  const users = await getUsersWithTasks()
  
  // Filter out any users without tasks (defensive programming)
  const usersWithTasks = users.filter(user => user.tasks && user.tasks.length > 0)
  
  if (usersWithTasks.length === 0) {
    return <p className="text-gray-500">No users with tasks found.</p>
  }
  
  return (
    <div className="space-y-6">
      {usersWithTasks.map(user => (
        <div key={user.id} className="border-b pb-4 last:border-b-0">
          <h3 className="font-semibold mb-3 text-lg">{user.name}</h3>
          <ul className="space-y-2">
            {user.tasks.map(task => (
              <TaskItem 
                key={task.id}
                id={task.id}
                initialCompleted={task.completed}
                title={task.title}
                projectId={task.projectId}
                projectTitle={task.Project?.title || ""}
                userId={task.userId}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}