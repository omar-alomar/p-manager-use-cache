import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/auth/currentUser"
import { getClients } from "@/db/clients"
import { ClientsPageClient } from "@/components/ClientsPageClient"
import { Skeleton } from "@/components/Skeleton"

export default async function ClientsPage() {
  // Check if user is authenticated
  const user = await getCurrentUser({ withFullUser: true })
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login")
  }

  // Fetch data for the client component
  const clients = await getClients()

  return (
    <>
      <div className="page-title">
        <div className="title-content">
          <h1>Clients</h1>
          <p className="page-subtitle">Manage client information and relationships</p>
        </div>
        <div className="title-btns">
          <Link className="btn" href="/clients/new">
            New Client
          </Link>
        </div>
      </div>

      <Suspense fallback={<ClientsTableSkeleton />}>
        <ClientsPageClient clients={clients} />
      </Suspense>
    </>
  )
}

function ClientsTableSkeleton() {
  return (
    <div className="projects-table-container">
      <table className="projects-table">
        <thead>
          <tr>
            <th>CLIENT NAME</th>
            <th>EMAIL</th>
            <th>PHONE</th>
            <th>ADDRESS</th>
            <th>PROJECTS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i}>
              <td><Skeleton /></td>
              <td><Skeleton short /></td>
              <td><Skeleton short /></td>
              <td><Skeleton /></td>
              <td><Skeleton short /></td>
              <td><Skeleton short /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
