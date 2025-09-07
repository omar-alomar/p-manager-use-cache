import { redirect } from "next/navigation"
import { getCurrentUser } from "@/auth/currentUser"
import { getClient } from "@/db/clients"
import { ClientForm } from "@/components/ClientForm"
import { notFound } from "next/navigation"

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  // Check if user is authenticated
  const user = await getCurrentUser()
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login")
  }

  const { clientId } = await params
  const client = await getClient(clientId)

  if (!client) {
    notFound()
  }

  return (
    <>
      <div className="page-title">
        <div className="title-content">
          <h1>Edit Client</h1>
          <p className="page-subtitle">Update client information</p>
        </div>
      </div>

      <div className="form-container">
        <ClientForm 
          initialData={{
            name: client.name,
            email: client.email,
            phone: client.phone || undefined,
            address: client.address || undefined,
          }}
          clientId={client.id}
          isEdit={true}
        />
      </div>
    </>
  )
}
