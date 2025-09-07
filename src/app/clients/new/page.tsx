import { redirect } from "next/navigation"
import { getCurrentUser } from "@/auth/currentUser"
import { ClientForm } from "@/components/ClientForm"

export default async function NewClientPage() {
  // Check if user is authenticated
  const user = await getCurrentUser()
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="page-title">
      <div className="title-content">
        <h1>New Client</h1>
        <p className="page-subtitle">Add a new client to your database</p>
      </div>
    </div>

    <div className="form-container">
      <ClientForm />
    </div>
  )
}
