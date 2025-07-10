import { getProject } from "@/db/projects"
import { Checkbox } from "./Checkbox"

export async function TaskItem({
  id,
  completed,
  title,
  projectId,
  userId
}: {
  id: number
  completed: boolean
  title: string
  projectId: number
  userId: number
}) {
  const project = await getProject(projectId)

  return (
    <li className="no-bullets">
      <Checkbox 
        taskId={id}
        initialChecked={completed}
        title={title}
        userId={userId}
        projectId={projectId}
      />{" "}
      <span className={completed ? "strike-through" : ""}>
        {title} ({project?.title})
      </span>
    </li>
  )
}