// OAuth callback route
//
// Microsoft redirects here after the user authenticates. This route:
// 1. Validates the CSRF state token against the cookie set during initiation
// 2. Exchanges the authorization code for an access token via MSAL
// 3. Extracts the user's email from the token claims
// 4. Looks up the email in the DB — users must be pre-created by an admin
// 5. Creates a session using the same createUserSession() as password login
// 6. Redirects to /changelog (new version) or /projects (already seen)
//
// All redirects use APP_URL as the base instead of request.url, because
// inside Docker request.url resolves to the container's internal address (0.0.0.0:3000).
//
// Error codes passed to /login as query params:
//   no_account  — Microsoft email doesn't match any user in the DB
//   oauth_failed — generic OAuth error (user cancelled, token exchange failed, etc.)
//   no_email    — couldn't extract email from Microsoft's token claims

import { NextRequest, NextResponse } from "next/server"
import { getMsalClient, OAUTH_SCOPES, getRedirectUri } from "@/auth/msal"
import prisma from "@/db/db"
import { createUserSession } from "@/auth/session"
import { cookies } from "next/headers"
import { APP_VERSION } from "@/constants/version"

const BASE_URL = process.env.APP_URL || "http://localhost:3000"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const state = request.nextUrl.searchParams.get("state")
  const errorParam = request.nextUrl.searchParams.get("error")

  // Handle Microsoft-side errors (user cancelled, consent denied, etc.)
  if (errorParam) {
    const desc = request.nextUrl.searchParams.get("error_description") || "Authentication failed"
    console.error("Microsoft OAuth error:", errorParam, desc)
    return NextResponse.redirect(new URL("/login?error=oauth_failed", BASE_URL))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", BASE_URL))
  }

  // Validate CSRF state — must match the cookie set in /api/auth/microsoft
  const storedState = request.cookies.get("oauth-state")?.value
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", BASE_URL))
  }

  try {
    // Exchange authorization code for tokens
    const result = await getMsalClient().acquireTokenByCode({
      code,
      scopes: OAUTH_SCOPES,
      redirectUri: getRedirectUri(),
    })

    // Extract email — try multiple claim locations for compatibility
    const claims = result.idTokenClaims as Record<string, unknown> | undefined
    const email = (
      result.account?.username ||
      claims?.preferred_username ||
      claims?.email
    ) as string | undefined

    if (!email) {
      console.error("Microsoft OAuth: No email in token claims")
      return NextResponse.redirect(new URL("/login?error=no_email", BASE_URL))
    }

    // Match email to an existing user — no auto-provisioning, admin must pre-create users
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, role: true, lastSeenVersion: true },
    })

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=no_account", BASE_URL))
    }

    // Create session — identical to password login path
    const cookieStore = await cookies()
    await createUserSession({ id: user.id, role: user.role }, cookieStore)

    // Version redirect — same logic as getPostLoginRedirect() but inline
    // to avoid a cookie-read race condition in the same request cycle
    const redirectPath = (!user.lastSeenVersion || user.lastSeenVersion !== APP_VERSION)
      ? "/changelog"
      : "/projects"

    const response = NextResponse.redirect(new URL(redirectPath, BASE_URL))
    response.cookies.delete("oauth-state")
    return response
  } catch (error) {
    console.error("Microsoft OAuth callback error:", error)
    return NextResponse.redirect(new URL("/login?error=oauth_failed", BASE_URL))
  }
}
