import { Prisma } from "@prisma/client"
import prisma from "./db"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { revalidateTag } from "next/cache"

export async function getClients({
  query,
}: {
  query?: string
} = {}) {
  "use cache"
  cacheTag("clients:all")

  await wait(500)

  const where: Prisma.ClientFindManyArgs["where"] = {}
  if (query) {
    where.OR = [
      { name: { contains: query } }, 
      { email: { contains: query } },
      { phone: { contains: query } },
      { address: { contains: query } }
    ]
  }

  return prisma.client.findMany({ 
    where,
    include: {
      projects: {
        include: {
          user: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })
}

export async function getClient(clientId: string | number) {
  "use cache"
  cacheTag(`clients:id=${clientId}`)

  await wait(500)

  return prisma.client.findUnique({
    where: { id: Number(clientId) },
    include: {
      projects: {
        include: {
          user: true,
          apfos: {
            orderBy: {
              date: 'asc'
            }
          }
        }
      }
    }
  })
}

export async function createClient({
  name,
  companyName,
  email,
  phone,
  address,
}: {
  name: string
  companyName?: string
  email: string
  phone?: string
  address?: string
}) {
  await wait(500)
  const client = await prisma.client.create({
    data: {
      name,
      companyName: companyName || null,
      email,
      phone: phone || null,
      address: address || null,
    },
  })

  revalidateTag("clients:all")
  revalidateTag(`clients:id=${client.id}`)

  return client
}

export async function updateClient({
  id,
  name,
  companyName,
  email,
  phone,
  address,
}: {
  id: number
  name: string
  companyName?: string
  email: string
  phone?: string
  address?: string
}) {
  await wait(500)
  const client = await prisma.client.update({
    where: { id },
    data: {
      name,
      companyName: companyName || null,
      email,
      phone: phone || null,
      address: address || null,
    },
  })

  revalidateTag("clients:all")
  revalidateTag(`clients:id=${client.id}`)

  return client
}

export async function updateClientField(clientId: number, field: 'companyName' | 'address', value: string | null) {
  await wait(500)
  const client = await prisma.client.update({
    where: { id: clientId },
    data: {
      [field]: value,
    },
  })

  revalidateTag("clients:all")
  revalidateTag(`clients:id=${client.id}`)

  return client
}

export async function deleteClient(clientId: string | number) {
  await wait(500)
  
  const client = await prisma.client.delete({
    where: { id: Number(clientId) },
  })

  revalidateTag("clients:all")
  revalidateTag(`clients:id=${Number(clientId)}`)

  return client
}

function validateClient(formData: FormData) {
  const errors: Record<string, string> = {}
  const name = formData.get("name") as string
  const companyName = formData.get("companyName") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string

  if (!name || name.trim().length === 0) {
    errors.name = "Name is required"
  }

  if (!email || email.trim().length === 0) {
    errors.email = "Email is required"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address"
  }

  if (phone && phone.trim().length > 0 && !/^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ""))) {
    errors.phone = "Please enter a valid phone number"
  }

  if (Object.keys(errors).length > 0) {
    return [null, errors] as const
  }

  return [
    {
      name: name.trim(),
      companyName: companyName?.trim() || undefined,
      email: email.trim(),
      phone: phone?.trim() || undefined,
      address: address?.trim() || undefined,
    },
    null,
  ] as const
}

export { validateClient }

// Utility function for consistent delays
function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
