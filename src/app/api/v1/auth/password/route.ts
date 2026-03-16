import { NextRequest } from "next/server"
import prisma from "@/db/db"
import { changePasswordSchema } from "@/schemas/schemas"
import { comparePasswords, generateSalt, hashPassword } from "@/auth/passwordHasher"
import { requireAuth, isErrorResponse } from "../../_lib/auth"
import { checkMaintenance } from "../../_lib/maintenance"
import { jsonSuccess, jsonError } from "../../_lib/responses"

export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const blocked = await checkMaintenance(auth)
  if (blocked) return blocked

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) {
    return jsonError("Invalid password data. New password must be at least 8 characters.", 400)
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { password: true, salt: true }
  })

  if (!user || !user.password || !user.salt) {
    return jsonError("User not found or invalid password setup", 400)
  }

  const isCorrectPassword = await comparePasswords({
    hashedPassword: user.password,
    password: parsed.data.currentPassword,
    salt: user.salt,
  })

  if (!isCorrectPassword) {
    return jsonError("Current password is incorrect", 400)
  }

  const newSalt = generateSalt()
  const hashedNewPassword = await hashPassword(parsed.data.newPassword, newSalt)

  await prisma.user.update({
    where: { id: auth.id },
    data: { password: hashedNewPassword, salt: newSalt }
  })

  return jsonSuccess({ message: "Password updated successfully" })
}
