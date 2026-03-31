import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/auth/currentUser"
import { TimesheetContent } from "@/components/TimesheetContent"
import TimesheetLoading from "./loading"

export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const dateParam = params.date ?? null

  return (
    <Suspense fallback={<TimesheetLoading />}>
      <TimesheetContent userId={user.id} dateParam={dateParam} isAdmin={user.role === "admin"} />
    </Suspense>
  )
}
