"use server"

import { createClient, deleteClient, updateClient, validateClient } from "@/db/clients"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function createClientAction(prevState: unknown, formData: FormData) {
  const [data, errors] = validateClient(formData)

  if (!data) return errors

  const client = await createClient(data)

  return { 
    success: true, 
    message: 'Client created successfully', 
    redirectTo: `/clients`,
    client: {
      id: client.id,
      name: client.name,
      email: client.email
    }
  }
}

export async function editClientAction(
  clientId: number,
  prevState: unknown,
  formData: FormData
) {
  const [data, errors] = validateClient(formData)

  if (!data) return errors

  const client = await updateClient({
    id: clientId,
    ...data,
  })

  return { success: true, message: 'Client updated successfully', redirectTo: `/clients` }
}

export async function deleteClientAction(clientId: number) {
  await deleteClient(clientId)
  revalidatePath("/clients")
  redirect("/clients")
}
