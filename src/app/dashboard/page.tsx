import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/auth/currentUser"
import { DashboardContent } from "@/components/DashboardContent"
import DashboardLoading from "./loading"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="tasks-page">
      <div className="page-title">
        <div className="title-content">
          <h1>Dashboard</h1>
          <p className="page-subtitle">
            Team workload and task management
          </p>
        </div>
      </div>

      <Suspense fallback={<DashboardLoading />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
