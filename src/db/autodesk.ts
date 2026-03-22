import prisma from "./db"
import { revalidateTag } from "next/cache"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"

// --- Token CRUD (no caching — tokens are sensitive and short-lived) ---

export async function upsertAutodeskToken(data: {
  userId: number
  accessToken: string
  refreshToken: string
  expiresAt: Date
  refreshExpiresAt: Date
  scope: string
}) {
  return prisma.autodeskToken.upsert({
    where: { userId: data.userId },
    create: data,
    update: {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
      refreshExpiresAt: data.refreshExpiresAt,
      scope: data.scope,
    },
  })
}

export async function deleteAutodeskToken(userId: number) {
  await prisma.autodeskToken.delete({ where: { userId } }).catch(() => {})
}

export async function getUserAutodeskStatus(userId: number): Promise<{
  connected: boolean
  refreshExpiresAt: Date | null
}> {
  const token = await prisma.autodeskToken.findUnique({
    where: { userId },
    select: { refreshExpiresAt: true },
  })
  if (!token) return { connected: false, refreshExpiresAt: null }
  const expired = token.refreshExpiresAt < new Date()
  if (expired) {
    await prisma.autodeskToken.delete({ where: { userId } }).catch(() => {})
    return { connected: false, refreshExpiresAt: null }
  }
  return { connected: true, refreshExpiresAt: token.refreshExpiresAt }
}

// --- ACC Project Link CRUD (cached) ---

export async function getAccProjectLinks(projectId: number) {
  "use cache"
  cacheTag(`acc:links:projectId=${projectId}`)
  return prisma.accProjectLink.findMany({
    where: { projectId },
    orderBy: { linkedAt: "asc" },
  })
}

export async function linkAccProject(data: {
  projectId: number
  accHubId: string
  accHubName: string
  accProjectId: string
  accProjectName: string
  linkedByUserId: number
}) {
  const link = await prisma.accProjectLink.create({ data })
  revalidateTag(`acc:links:projectId=${data.projectId}`)
  revalidateTag(`projects:id=${data.projectId}`)
  return link
}

export async function unlinkAccProject(linkId: number) {
  const link = await prisma.accProjectLink.delete({ where: { id: linkId } }).catch(() => null)
  if (link) {
    revalidateTag(`acc:links:projectId=${link.projectId}`)
    revalidateTag(`projects:id=${link.projectId}`)
  }
}

export async function unlinkAllAccProjects(projectId: number) {
  await prisma.accProjectLink.deleteMany({ where: { projectId } })
  revalidateTag(`acc:links:projectId=${projectId}`)
  revalidateTag(`projects:id=${projectId}`)
}

export async function getAllAccProjectLinks() {
  "use cache"
  cacheTag("acc:links:all")
  return prisma.accProjectLink.findMany({
    include: { project: { select: { id: true, title: true } } },
    orderBy: { linkedAt: "desc" },
  })
}

export async function bulkLinkAccProjects(
  links: {
    projectId: number
    accHubId: string
    accHubName: string
    accProjectId: string
    accProjectName: string
    linkedByUserId: number
  }[]
) {
  const results = await prisma.$transaction(
    links.map((data) =>
      prisma.accProjectLink.upsert({
        where: {
          projectId_accProjectId: {
            projectId: data.projectId,
            accProjectId: data.accProjectId,
          },
        },
        create: data,
        update: {
          accHubId: data.accHubId,
          accHubName: data.accHubName,
          accProjectName: data.accProjectName,
          linkedByUserId: data.linkedByUserId,
        },
      })
    )
  )

  // Invalidate cache for all affected projects
  const projectIds = [...new Set(links.map((l) => l.projectId))]
  for (const pid of projectIds) {
    revalidateTag(`acc:links:projectId=${pid}`)
    revalidateTag(`projects:id=${pid}`)
  }
  revalidateTag("acc:links:all")

  return results
}
