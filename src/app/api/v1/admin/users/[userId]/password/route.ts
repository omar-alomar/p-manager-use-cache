import { NextRequest } from "next/server"
import { z } from "zod"
import { updateUserPassword } from "@/db/users"
import { generateSalt, hashPassword } from "@/auth/passwordHasher"
import { requireAdmin, isErrorResponse } from "../../../../_lib/auth"
import { checkMaintenance } from "../../../../_lib/maintenance"
import { jsonSuccess, jsonError } from "../../../../_lib/responses"

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
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

  const parsed = passwordSchema.safeParse(body)
  if (!parsed.success) {
    return jsonError("Password must be at least 8 characters", 400)
  }

  const salt = generateSalt()
  const hashedPassword = await hashPassword(parsed.data.password, salt)
  await updateUserPassword(userId, hashedPassword, salt)

  return jsonSuccess({ message: "Password updated" })
}
