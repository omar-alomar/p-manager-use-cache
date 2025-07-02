"use server"

import { createProject, deleteProject, updateProject } from "@/db/projects"
import { redirect } from "next/navigation"

export async function createProjectAction(prevState: unknown, formData: FormData) {
  const [data, errors] = validateProject(formData)

  if (!data) return errors

  const project = await createProject(data)

  redirect(`/projects/${project.id}`)
}

export async function editProjectAction(
  projectId: number,
  prevState: unknown,
  formData: FormData
) {
  const [data, errors] = validateProject(formData)

  if (!data) return errors

  const project = await updateProject(projectId, data)

  redirect(`/projects/${project.id}`)
}

export async function deleteProjectAction(projectId: number | string) {
  await deleteProject(projectId)
  redirect("/projects")
}

function validateProject(formData: FormData) {
  const errors: { title?: string; body?: string; userId?: string } = {}
  const title = formData.get("title") as string
  const body = formData.get("body") as string
  const userId = Number(formData.get("userId"))
  let isValid = true

  if (title === "") {
    errors.title = "Required"
    isValid = false
  }

  if (body === "") {
    errors.body = "Required"
    isValid = false
  }

  if (isNaN(userId)) {
    errors.userId = "Required"
    isValid = false
  }

  return [isValid ? { title, body, userId } : undefined, errors] as const
}
