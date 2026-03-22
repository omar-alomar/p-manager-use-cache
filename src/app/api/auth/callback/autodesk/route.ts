// Autodesk OAuth callback route
//
// Autodesk redirects here after the user authenticates. This route:
// 1. Validates the CSRF state token against the cookie set during initiation
// 2. Exchanges the authorization code for access + refresh tokens
// 3. Stores tokens in the AutodeskToken table for the current user
// 4. Redirects to the returnTo URL stored in the state cookie
//
// Key difference from Microsoft callback: Microsoft tokens are discarded after
// email extraction. Autodesk tokens are stored and managed long-term.
//
// All redirects use APP_URL as the base (not request.url) because inside Docker
// request.url resolves to the container's internal address.

import { NextRequest, NextResponse } from "next/server"
import { exchangeAutodeskCode } from "@/auth/autodesk"
import { getUserFromSession } from "@/auth/session"
import { upsertAutodeskToken } from "@/db/autodesk"
import { cookies } from "next/headers"

const BASE_URL = process.env.APP_URL || "http://localhost:3000"
const APS_SCOPES = "data:read data:write data:create account:read viewables:read"

export async function GET(request: NextRequest) {
  console.log("Autodesk callback hit. URL:", request.nextUrl.toString())

  const code = request.nextUrl.searchParams.get("code")
  const state = request.nextUrl.searchParams.get("state")
  const errorParam = request.nextUrl.searchParams.get("error")

  console.log("Autodesk callback params — code:", !!code, "state:", !!state, "error:", errorParam)

  // Handle Autodesk-side errors (user cancelled, consent denied, etc.)
  if (errorParam) {
    const desc = request.nextUrl.searchParams.get("error_description") || "Authentication failed"
    console.error("Autodesk OAuth error:", errorParam, desc)
    return NextResponse.redirect(new URL("/projects?error=autodesk_oauth_failed", BASE_URL))
  }

  if (!code || !state) {
    console.error("Autodesk callback: missing code or state")
    return NextResponse.redirect(new URL("/projects?error=autodesk_oauth_failed", BASE_URL))
  }

  // Validate CSRF state
  const stateCookie = request.cookies.get("autodesk-oauth-state")?.value
  if (!stateCookie) {
    console.error("Autodesk callback: no state cookie found")
    return NextResponse.redirect(new URL("/projects?error=autodesk_oauth_failed", BASE_URL))
  }

  let statePayload: { csrf: string; returnTo: string }
  try {
    statePayload = JSON.parse(stateCookie)
  } catch {
    console.error("Autodesk callback: state cookie JSON parse failed")
    return NextResponse.redirect(new URL("/projects?error=autodesk_oauth_failed", BASE_URL))
  }

  if (statePayload.csrf !== state) {
    console.error("Autodesk callback: CSRF mismatch. Cookie:", statePayload.csrf, "URL:", state)
    return NextResponse.redirect(new URL("/projects?error=autodesk_oauth_failed", BASE_URL))
  }

  // Require existing session — user must be logged in
  const cookieStore = await cookies()
  const session = await getUserFromSession(cookieStore)
  if (!session) {
    console.error("Autodesk callback: no session found")
    return NextResponse.redirect(new URL("/login?error=auth_required", BASE_URL))
  }

  try {
    // Exchange authorization code for tokens
    const result = await exchangeAutodeskCode(code)

    const now = new Date()
    await upsertAutodeskToken({
      userId: session.id,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: new Date(now.getTime() + result.expiresIn * 1000),
      refreshExpiresAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days
      scope: APS_SCOPES,
    })

    const response = NextResponse.redirect(
      new URL(statePayload.returnTo || "/projects", BASE_URL)
    )
    response.cookies.delete("autodesk-oauth-state")
    return response
  } catch (error) {
    console.error("Autodesk OAuth callback error:", error)
    return NextResponse.redirect(new URL("/projects?error=autodesk_oauth_failed", BASE_URL))
  }
}
