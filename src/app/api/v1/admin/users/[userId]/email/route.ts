import { NextRequest } from "next/server"
import { z } from "zod"
import { updateUserEmail } from "@/db/users"
import { requireAdmin, isErrorResponse } from "../../../../_lib/auth"
import { checkMaintenance } from "../../../../_lib/maintenance"
import { jsonSuccess, jsonError } from "../../../../_lib/responses"

const emailSchema = z.object({
  email: z.string().email("Valid email required"),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin(request)
  if (isErrorResponse(auth)) return auth

  const blocked = await checkMaintenance(auth)
  if (blocked) return blocked

  const { userId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const parsed = emailSchema.safeParse(body)
  if (!parsed.success) {
    return jsonError("Valid email required", 400)
  }

  const user = await updateUserEmail(userId, parsed.data.email)
  const { password, salt, ...sanitized } = user as typeof user & { password?: string; salt?: string }
  return jsonSuccess(sanitized)
}
