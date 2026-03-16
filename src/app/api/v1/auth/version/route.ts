import { NextRequest } from "next/server"
import prisma from "@/db/db"
import { APP_VERSION } from "@/constants/version"
import { requireAuth, isErrorResponse } from "../../_lib/auth"
import { jsonSuccess } from "../../_lib/responses"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { lastSeenVersion: true }
  })

  return jsonSuccess({
    currentVersion: APP_VERSION,
    lastSeenVersion: user?.lastSeenVersion ?? null,
    needsAck: user?.lastSeenVersion !== APP_VERSION,
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isErrorResponse(auth)) return auth

  await prisma.user.update({
    where: { id: auth.id },
    data: { lastSeenVersion: APP_VERSION }
  })

  return jsonSuccess({ lastSeenVersion: APP_VERSION })
}
