"use server"

import { createProject, deleteProject, updateProject } from "@/db/projects"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { getProjects } from "@/db/projects"

export async function createProjectAction(prevState: unknown, formData: FormData) {
  const [data, errors] = validateProject(formData)

  if (!data) return errors

  const project = await createProject(data)

  return { success: true, message: 'Project created successfully', redirectTo: `/projects/${project.id}` }
}

export async function editProjectAction(
  projectId: number,
  prevState: unknown,
  formData: FormData
) {
  const [data, errors] = validateProject(formData)

  if (!data) return errors

  const project = await updateProject(projectId, data)

  return { success: true, message: 'Project updated successfully', redirectTo: `/projects/${project.id}` }
}

export async function deleteProjectAction(projectId: number | string) {
  await deleteProject(projectId)
  return { success: true, message: 'Project deleted successfully', redirectTo: "/projects" }
}

export async function updateProjectCommentsAction(
  projectId: number,
  data: {
    title: string
    client: string
    body: string  // This is the comments field
    apfo: string
    mbaNumber: string
    coFileNumbers: string
    dldReviewer: string
    userId: number
  }
) {
  await updateProject(projectId, data)
  
  // Revalidate to update the UI
  revalidatePath('/projects')
  revalidatePath(`/projects/${projectId}`)
  
  return { success: true }
}

export async function updateProjectCoFilesAction(
  projectId: number,
  data: {
    title: string
    client: string
    body: string
    apfo: string
    mbaNumber: string
    coFileNumbers: string
    dldReviewer: string
    userId: number
  }
) {
  await updateProject(projectId, data)
  
  // Revalidate to update the UI
  revalidatePath('/projects')
  revalidatePath(`/projects/${projectId}`)
  
  return { success: true }
}

export async function updateProjectDldReviewerAction(
  projectId: number,
  data: {
    title: string
    client: string
    body: string
    apfo: string
    mbaNumber: string
    coFileNumbers: string
    dldReviewer: string
    userId: number
  }
) {
  await updateProject(projectId, data)
  
  // Revalidate to update the UI
  revalidatePath('/projects')
  revalidatePath(`/projects/${projectId}`)
  
  return { success: true }
}

export async function updateProjectMbaNumberAction(
  projectId: number,
  data: {
    title: string
    client: string
    body: string
    apfo: string
    mbaNumber: string
    coFileNumbers: string
    dldReviewer: string
    userId: number
  }
) {
  await updateProject(projectId, data)
  
  // Revalidate to update the UI
  revalidatePath('/projects')
  revalidatePath(`/projects/${projectId}`)
  
  return { success: true }
}

export async function getProjectsAction() {
  return getProjects()
}

function validateProject(formData: FormData) {
  const errors: { title?: string; client?: string, body?: string; apfo?: string; mbaNumber?: string; coFileNumbers?: string; dldReviewer?: string; userId?: string } = {}
  const title = formData.get("title") as string
  const client = formData.get("client") as string
  const body = formData.get("body") as string
  const apfo = formData.get("apfo") as string
  const mbaNumber = formData.get("mbaNumber") as string
  const coFileNumbers = formData.get("coFileNumbers") as string
  const dldReviewer = formData.get("dldReviewer") as string
  const userId = Number(formData.get("userId"))
  let isValid = true

  if (title === "") {
    errors.title = "Required"
    isValid = false
  }

  if (client === "") {
    errors.title = "Required"
    isValid = false
  }

  if (body === "") {
    errors.body = "Required"
    isValid = false
  }

  if (apfo === "") {
    errors.body = "Required"
    isValid = false
  }

  if (isNaN(userId)) {
    errors.userId = "Required"
    isValid = false
  }

  return [isValid ? { title, client, body, apfo, mbaNumber, coFileNumbers, dldReviewer, userId } : undefined, errors] as const
}
