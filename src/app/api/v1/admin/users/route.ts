import { NextRequest } from "next/server"
import { z } from "zod"
import { getUsers, createUser } from "@/db/users"
import { requireAdmin, isErrorResponse } from "../../_lib/auth"
import { checkMaintenance } from "../../_lib/maintenance"
import { jsonSuccess, jsonCreated, jsonError } from "../../_lib/responses"
import { getPaginationParams, paginate } from "../../_lib/pagination"

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "admin"]).default("user"),
})

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isErrorResponse(auth)) return auth

  const { searchParams } = new URL(request.url)
  const { page, limit } = getPaginationParams(searchParams)

  const users = await getUsers()
  const sanitized = users.map(({ password, salt, ...u }) => u)
  return jsonSuccess(paginate(sanitized, page, limit))
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isErrorResponse(auth)) return auth

  const blocked = await checkMaintenance(auth)
  if (blocked) return blocked

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const parsed = createUserSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const e of parsed.error.issues) {
      fieldErrors[e.path.join(".")] = e.message
    }
    return jsonError("Validation failed", 400, fieldErrors)
  }

  try {
    const user = await createUser(parsed.data)
    const { password, salt, ...sanitized } = user
    return jsonCreated(sanitized)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create user"
    return jsonError(message, 400)
  }
}
