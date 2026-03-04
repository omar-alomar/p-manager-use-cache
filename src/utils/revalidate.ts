import { revalidatePath } from "next/cache"

export function revalidateTaskPaths(opts?: { projectId?: number | null; taskId?: number }) {
  if (opts?.projectId) {
    revalidatePath(`/projects/${opts.projectId}`)
  }
  revalidatePath('/projects')
  revalidatePath('/dashboard')
  revalidatePath('/tasks')
  if (opts?.taskId) {
    revalidatePath(`/tasks/${opts.taskId}`)
  }
  revalidatePath('/')
}
