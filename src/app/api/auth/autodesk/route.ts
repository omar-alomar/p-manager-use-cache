// Autodesk OAuth initiation route
//
// User must already be logged in — this is "connect Autodesk", not "login via Autodesk."
// Generates a CSRF state token with a returnTo URL, stores in a short-lived httpOnly cookie,
// then redirects to Autodesk's login page.
//
// Query param: ?returnTo=/projects/5 (optional, defaults to /projects)

import { NextRequest, NextResponse } from "next/server"
import { getAutodeskAuthUrl } from "@/auth/autodesk"
import { getUserFromSession } from "@/auth/session"
import { cookies } from "next/headers"
import crypto from "crypto"

const BASE_URL = process.env.APP_URL || "http://localhost:3000"

export async function GET(request: NextRequest) {
  // Require existing session — user must be logged in
  const cookieStore = await cookies()
  const session = await getUserFromSession(cookieStore)
  if (!session) {
    return NextResponse.redirect(new URL("/login?error=auth_required", BASE_URL))
  }

  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/projects"
  const csrf = crypto.randomBytes(16).toString("hex")

  // Encode CSRF + returnTo in the state cookie as JSON
  const statePayload = JSON.stringify({ csrf, returnTo })
  const authUrl = getAutodeskAuthUrl(csrf)

  const response = NextResponse.redirect(authUrl)

  response.cookies.set("autodesk-oauth-state", statePayload, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  })

  return response
}
