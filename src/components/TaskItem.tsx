export function TaskItem({
  completed,
  title,
}: {
  completed: boolean
  title: string
}) {
  return <li className={completed ? "strike-through" : undefined}>{title}</li>
}
