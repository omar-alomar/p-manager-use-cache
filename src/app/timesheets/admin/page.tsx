import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/auth/currentUser"
import { Role } from "@prisma/client"
import { TimesheetContent } from "@/components/TimesheetContent"

export default async function TimesheetAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; userId?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.role !== Role.admin) redirect("/timesheets")

  const params = await searchParams
  const dateParam = params.date ?? null
  const viewUserId = params.userId ? parseInt(params.userId) : user.id

  return (
    <Suspense fallback={<div className="skeleton" style={{ height: 200, borderRadius: 12 }} />}>
      <TimesheetContent userId={viewUserId} dateParam={dateParam} isAdmin={true} />
    </Suspense>
  )
}
