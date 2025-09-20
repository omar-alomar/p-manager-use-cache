"use server"

import { createProject, deleteProject, updateProject, addMilestone } from "@/db/projects"
import { revalidatePath } from "next/cache"
import { getProjects } from "@/db/projects"
import { redirect } from "next/navigation"

export async function createProjectAction(prevState: unknown, formData: FormData) {
  const [data, errors] = validateProject(formData)

  if (!data) return errors

  await createProject(data)

  return { success: true, message: 'Project created successfully', redirectTo: `/projects` }
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
  redirect("/projects")
}

export async function updateProjectCommentsAction(
  projectId: number,
  data: {
    title: string
    clientId: number | null
    body: string  // This is the comments field
    milestone: Date | null
    mbaNumber: string | null
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
    clientId: number | null
    body: string
    milestone: Date | null
    mbaNumber: string | null
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
    clientId: number | null
    body: string
    milestone: Date | null
    mbaNumber: string | null
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
    clientId: number | null
    body: string
    milestone: Date | null
    mbaNumber: string | null
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
  const errors: { title?: string; clientId?: string, body?: string; milestone?: string; mbaNumber?: string; coFileNumbers?: string; dldReviewer?: string; userId?: string } = {}
  const title = formData.get("title") as string
  const clientId = formData.get("clientId") as string
  const body = formData.get("body") as string
  const milestone = formData.get("milestone") as string
  const mbaNumber = formData.get("mbaNumber") as string
  const coFileNumbers = formData.get("coFileNumbers") as string
  const dldReviewer = formData.get("dldReviewer") as string
  const userId = Number(formData.get("userId"))
  
  // Parse milestone entries
  const milestones: { date: Date; item: string }[] = []
  let milestoneIndex = 0
  while (formData.get(`milestoneDate_${milestoneIndex}`)) {
    const date = formData.get(`milestoneDate_${milestoneIndex}`) as string
    const item = formData.get(`milestoneItem_${milestoneIndex}`) as string
    if (date) {
      milestones.push({ date: new Date(date), item: item || "" })
    }
    milestoneIndex++
  }
  
  let isValid = true

  if (title === "") {
    errors.title = "Required"
    isValid = false
  }

  if (clientId === "" || clientId === null) {
    errors.clientId = "Required"
    isValid = false
  }

  if (body === "") {
    errors.body = "Required"
    isValid = false
  }

  // Milestone entries are now optional - no validation needed

  if (isNaN(userId)) {
    errors.userId = "Required"
    isValid = false
  }

  return [isValid ? { 
    title, 
    clientId: clientId ? Number(clientId) : null, 
    body, 
    milestone: milestone ? new Date(milestone) : null, 
    mbaNumber: mbaNumber || "", 
    coFileNumbers, 
    dldReviewer, 
    userId,
    milestones
  } : undefined, errors] as const
}

export async function addMilestoneAction(
  projectId: number,
  prevState: unknown,
  formData: FormData
) {
  const date = formData.get("date") as string
  const item = formData.get("item") as string

  const errors: { date?: string; item?: string } = {}
  let isValid = true

  if (!date) {
    errors.date = "Date is required"
    isValid = false
  }

  if (!item || item.trim() === "") {
    errors.item = "Milestone description is required"
    isValid = false
  }

  if (!isValid) {
    return { errors }
  }

  try {
    await addMilestone(projectId, {
      date: new Date(date),
      item: item.trim()
    })

    return { success: true }
  } catch (error) {
    console.error("Error adding milestone:", error)
    return { 
      errors: { 
        general: "Failed to add milestone. Please try again." 
      } 
    }
  }
}
