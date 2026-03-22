// autodesk.ts — Autodesk Platform Services OAuth configuration
//
// Pure HTTP calls to Autodesk. No storage logic.
// Follows the same pattern as src/auth/msal.ts — stateless auth helpers.
//
// OAuth flow:
// 1. GET /api/auth/autodesk — builds auth URL, redirects user to Autodesk login
// 2. User authenticates with Autodesk, Autodesk redirects back to our callback
// 3. GET /api/auth/callback/autodesk — exchanges code for tokens, stores in DB
//
// Key difference from Microsoft OAuth: this is "connect Autodesk" (user already logged in),
// not "login via Autodesk." Tokens are stored and refreshed, not discarded after email extraction.
//
// Required env vars: APS_CLIENT_ID, APS_CLIENT_SECRET, APP_URL

const APS_AUTH_BASE = "https://developer.api.autodesk.com/authentication/v2"
const APS_SCOPES = "data:read data:write data:create account:read viewables:read"

function getClientCredentials() {
  const clientId = process.env.APS_CLIENT_ID
  const clientSecret = process.env.APS_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("APS_CLIENT_ID and APS_CLIENT_SECRET must be set")
  }
  return { clientId, clientSecret }
}

export function getAutodeskRedirectUri(): string {
  const base = process.env.APP_URL || "http://localhost:3000"
  return `${base}/api/auth/callback/autodesk`
}

export function getAutodeskAuthUrl(state: string): string {
  const { clientId } = getClientCredentials()
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: getAutodeskRedirectUri(),
    scope: APS_SCOPES,
    state,
  })
  return `${APS_AUTH_BASE}/authorize?${params.toString()}`
}

export async function exchangeAutodeskCode(code: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
}> {
  const { clientId, clientSecret } = getClientCredentials()
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const res = await fetch(`${APS_AUTH_BASE}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getAutodeskRedirectUri(),
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error("Autodesk token exchange failed:", res.status, text)
    throw new Error(`Autodesk token exchange failed: ${res.status}`)
  }

  const data = await res.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  }
}

export async function refreshAutodeskToken(refreshToken: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
}> {
  const { clientId, clientSecret } = getClientCredentials()
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const res = await fetch(`${APS_AUTH_BASE}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error("Autodesk token refresh failed:", res.status, text)
    throw new Error(`Autodesk token refresh failed: ${res.status}`)
  }

  const data = await res.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  }
}
