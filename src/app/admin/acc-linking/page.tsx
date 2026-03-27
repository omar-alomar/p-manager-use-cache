import { getCurrentUser } from "@/auth/currentUser"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"
import { getProjects } from "@/db/projects"
import { getAllAccProjectLinks } from "@/db/autodesk"
import { AccBulkLinker } from "@/components/admin/AccBulkLinker"
import Link from "next/link"

export default async function AccLinkingPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.role !== Role.admin) redirect("/")

  const [projects, existingLinks] = await Promise.all([
    getProjects({ includeArchived: false }),
    getAllAccProjectLinks(),
  ])

  const projectsForLinker = projects.map((p) => ({
    id: p.id,
    title: p.title,
    mbaNumber: p.mbaNumber || "",
  }))

  const existingLinksMap: Record<number, { accProjectId: string; accProjectName: string; accHubName: string; linkId: number }[]> = {}
  for (const link of existingLinks) {
    if (!existingLinksMap[link.projectId]) existingLinksMap[link.projectId] = []
    existingLinksMap[link.projectId].push({
      accProjectId: link.accProjectId,
      accProjectName: link.accProjectName,
      accHubName: link.accHubName,
      linkId: link.id,
    })
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <Link href="/admin" className="acc-back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6" />
            </svg>
            Back to Admin
          </Link>
          <h1>ACC Project Linking</h1>
          <p className="admin-page-subtitle">Link your projects to Autodesk Construction Cloud projects</p>
        </div>
      </div>

      <AccBulkLinker
        projects={projectsForLinker}
        existingLinks={existingLinksMap}
      />
    </div>
  )
}
