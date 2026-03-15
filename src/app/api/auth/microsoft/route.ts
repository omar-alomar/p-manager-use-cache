// OAuth initiation route
//
// Generates a CSRF state token, stores it in a short-lived httpOnly cookie,
// then redirects the user to Microsoft's login page.
// prompt: "select_account" lets users pick which Microsoft account to use.

import { NextResponse } from "next/server"
import { getMsalClient, OAUTH_SCOPES, getRedirectUri } from "@/auth/msal"
import crypto from "crypto"

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex")

  const authUrl = await getMsalClient().getAuthCodeUrl({
    scopes: OAUTH_SCOPES,
    redirectUri: getRedirectUri(),
    state,
    prompt: "select_account",
  })

  const response = NextResponse.redirect(authUrl)

  // Store state in a short-lived httpOnly cookie for CSRF validation on callback
  response.cookies.set("oauth-state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  })

  return response
}
