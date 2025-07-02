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

  await wait(2000)

  const where: Prisma.ProjectFindManyArgs["where"] = {}
  if (query) {
    where.OR = [{ title: { contains: query } }, { body: { contains: query } }]
  }

  if (userId) {
    where.userId = Number(userId)
  }

  return prisma.project.findMany({ where })
}

export async function getProject(projectId: string | number) {
  "use cache"
  cacheTag(`projects:id=${projectId}`)

  await wait(2000)
  return prisma.project.findUnique({ where: { id: Number(projectId) } })
}

export async function getUserProjects(userId: string | number) {
  "use cache"
  cacheTag(`projects:userId=${userId}`)

  await wait(2000)
  return prisma.project.findMany({ where: { userId: Number(userId) } })
}

export async function createProject({
  title,
  body,
  userId,
}: {
  title: string
  body: string
  userId: number
}) {
  await wait(2000)
  const project = await prisma.project.create({
    data: {
      title,
      body,
      userId,
    },
  })

  revalidateTag("projects:all")
  revalidateTag(`projects:id=${project.id}`)
  revalidateTag(`projects:userId=${project.userId}`)

  return project
}

export async function updateProject(
  projectId: string | number,
  {
    title,
    body,
    userId,
  }: {
    title: string
    body: string
    userId: number
  }
) {
  await wait(2000)
  const project = await prisma.project.update({
    where: { id: Number(projectId) },
    data: {
      title,
      body,
      userId,
    },
  })

  revalidateTag("projects:all")
  revalidateTag(`projects:id=${project.id}`)
  revalidateTag(`projects:userId=${project.userId}`)

  return project
}

export async function deleteProject(projectId: string | number) {
  await wait(2000)

  const project = await prisma.project.delete({ where: { id: Number(projectId) } })

  revalidateTag("projects:all")
  revalidateTag(`projects:id=${project.id}`)
  revalidateTag(`projects:userId=${project.userId}`)

  return project
}

function wait(duration: number) {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}
