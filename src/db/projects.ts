import { Prisma } from "@prisma/client"
import prisma from "./db"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { revalidateTag } from "next/cache"

export async function getProjects({
  query,
  userId,
}: {
  query?: string
  userId?: string | number
} = {}) {
  "use cache"
  cacheTag("projects:all")

  await wait(500)

  const where: Prisma.ProjectFindManyArgs["where"] = {}
  if (query) {
    where.OR = [{ title: { contains: query } }, { body: { contains: query } }]
  }

  if (userId) {
    where.userId = Number(userId)
  }

  return prisma.project.findMany({ 
    where,
    include: {
      clientRef: true,
      milestones: {
        orderBy: {
          date: 'asc'
        }
      }
    }
  })
}

export async function getProject(projectId: string | number) {
  "use cache"
  cacheTag(`projects:id=${projectId}`)

  await wait(500)
  return prisma.project.findUnique({ 
    where: { id: Number(projectId) },
    include: {
      clientRef: true,
      milestones: {
        orderBy: {
          date: 'asc'
        }
      }
    }
  })
}

export async function getUserProjects(userId: string | number) {
  "use cache"
  cacheTag(`projects:userId=${userId}`)

  await wait(500)
  return prisma.project.findMany({ 
    where: { userId: Number(userId) },
    include: {
      clientRef: true,
      milestones: {
        orderBy: {
          date: 'asc'
        }
      }
    }
  })
}

export async function getProjectsWithUserTasks(userId: string | number) {
  "use cache"
  cacheTag(`projects:userTasks=${userId}`)

  await wait(500)
  
  // Get projects where the user is either the manager OR has tasks assigned
  return prisma.project.findMany({
    where: {
      OR: [
        { userId: Number(userId) }, // Projects where user is the manager
        { 
          tasks: {
            some: {
              userId: Number(userId) // Projects where user has tasks assigned
            }
          }
        }
      ]
    },
    include: {
      clientRef: true,
      milestones: {
        orderBy: {
          date: 'asc'
        }
      }
    },
    orderBy: {
      title: 'asc'
    }
  })
}

export async function createProject({
  title,
  clientId,
  body,
  milestone,
  mbaNumber,
  coFileNumbers,
  dldReviewer,
  userId,
  milestones,
}: {
  title: string
  clientId: number | null
  body: string
  milestone: Date | null
  mbaNumber: string | null
  coFileNumbers: string
  dldReviewer: string
  userId: number
  milestones?: { date: Date; item: string }[]
}) {
  await wait(500)
  
  const project = await prisma.project.create({
    data: {
      title,
      clientRef: clientId ? {
        connect: { id: clientId }
      } : undefined,
      body,
      milestone,
      mbaNumber: mbaNumber || "",
      coFileNumbers,
      dldReviewer,
      user: {
        connect: { id: userId }
      },
      milestones: milestones ? {
        create: milestones.map(milestone => ({
          date: milestone.date,
          item: milestone.item
        }))
      } : undefined,
    },
  })

  revalidateTag("projects:all")
  revalidateTag(`projects:id=${project.id}`)
  revalidateTag(`projects:userId=${project.userId}`)
  revalidateTag("clients:all")
  if (clientId) {
    revalidateTag(`clients:id=${clientId}`)
  }

  return project
}

function validateProject(formData: FormData) {
  const errors: { title?: string; body?: string; milestone?: string; mbaNumber?: string; coFileNumbers?: string; dldReviewer?: string; userId?: string } = {}
  const title = formData.get("title") as string
  const body = formData.get("body") as string
  const milestone = formData.get("milestone") as string
  const mbaNumber = formData.get("mbaNumber") as string
  const coFileNumbers = formData.get("coFileNumbers") as string
  const dldReviewer = formData.get("dldReviewer") as string
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

  if (milestone === "") {
    errors.milestone = "Required"
    isValid = false
  }

  if (isNaN(userId)) {
    errors.userId = "Required"
    isValid = false
  }

  return [isValid ? { title, body, milestone: milestone ? new Date(milestone) : null, mbaNumber: mbaNumber || "", coFileNumbers, dldReviewer, userId } : undefined, errors] as const
}

export async function updateProject(
  projectId: string | number,
  {
    title,
    clientId,
    body,
    milestone,
    mbaNumber,
    coFileNumbers,
    dldReviewer,
    userId,
    milestones,
  }: {
    title: string
    clientId: number | null
    body: string
    milestone: Date | null
    mbaNumber: string | null
    coFileNumbers: string
    dldReviewer: string
    userId: number
    milestones?: { date: Date; item: string }[]
  }
) {
  await wait(500)
  
  const project = await prisma.project.update({
    where: { id: Number(projectId) },
    data: {
      title,
      clientRef: clientId ? {
        connect: { id: clientId }
      } : {
        disconnect: true
      },
      body,
      milestone,
      mbaNumber: mbaNumber || "",
      coFileNumbers,
      dldReviewer,
      user: {
        connect: { id: userId }
      },
      milestones: milestones ? {
        deleteMany: {},
        create: milestones.map(milestone => ({
          date: milestone.date,
          item: milestone.item
        }))
      } : undefined,
    },
  })

  revalidateTag("projects:all")
  revalidateTag(`projects:id=${project.id}`)
  revalidateTag(`projects:userId=${project.userId}`)
  revalidateTag("clients:all")
  if (clientId) {
    revalidateTag(`clients:id=${clientId}`)
  }

  return project
}

export async function deleteProject(projectId: string | number) {
  await wait(500)

  const project = await prisma.project.delete({ where: { id: Number(projectId) } })

  revalidateTag("projects:all")
  revalidateTag(`projects:id=${project.id}`)
  revalidateTag(`projects:userId=${project.userId}`)
  revalidateTag("clients:all")
  if (project.clientId) {
    revalidateTag(`clients:id=${project.clientId}`)
  }

  return project
}

export function getNearestMilestoneDate(milestones: { date: Date; completed?: boolean }[]): Date | null {
  if (!milestones || milestones.length === 0) return null
  
  // Filter out completed milestones
  const activeMilestones = milestones.filter(milestone => !milestone.completed)
  if (activeMilestones.length === 0) return null
  
  const now = new Date()
  // Normalize to UTC midnight for date-only comparison (milestone dates are stored in UTC)
  const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const futureMilestones = activeMilestones.filter(milestone => {
    const milestoneDate = new Date(milestone.date)
    const milestoneDateUTC = new Date(Date.UTC(milestoneDate.getUTCFullYear(), milestoneDate.getUTCMonth(), milestoneDate.getUTCDate()))
    return milestoneDateUTC >= todayUTC
  })
  
  if (futureMilestones.length === 0) {
    // If no future dates, return the most recent past date
    return activeMilestones.reduce((nearest, current) => 
      current.date > nearest.date ? current : nearest
    ).date
  }
  
  // Return the nearest future date
  return futureMilestones.reduce((nearest, current) => 
    current.date < nearest.date ? current : nearest
  ).date
}

export async function addMilestone(
  projectId: number,
  milestoneData: { date: Date; item: string }
) {
  await wait(500)
  
  const milestone = await prisma.milestone.create({
    data: {
      projectId,
      date: milestoneData.date,
      item: milestoneData.item
    }
  })

  revalidateTag(`projects:id=${projectId}`)
  revalidateTag("projects:all")

  return milestone
}

function wait(duration: number) {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}
