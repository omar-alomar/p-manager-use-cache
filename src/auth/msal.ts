// msal.ts — Microsoft OAuth configuration
//
// Uses MSAL (Microsoft Authentication Library) for Azure AD OAuth.
// Lazy singleton pattern — same approach as the Redis client in src/redis/redis.ts.
//
// OAuth flow:
// 1. GET /api/auth/microsoft — builds auth URL via getAuthCodeUrl(), redirects user to Microsoft login
// 2. User authenticates with Microsoft, Microsoft redirects back to our callback
// 3. GET /api/auth/callback/microsoft — exchanges the authorization code for tokens via acquireTokenByCode()
// 4. Extract email from token claims, match to existing user in DB, create session
//
// Required env vars: AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID, APP_URL
// The tenant-specific authority URL restricts login to the organization's Azure AD tenant.

import { ConfidentialClientApplication } from "@azure/msal-node"

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET!,
  },
}

let msalInstance: ConfidentialClientApplication | null = null

export function getMsalClient(): ConfidentialClientApplication {
  if (!msalInstance) {
    msalInstance = new ConfidentialClientApplication(msalConfig)
  }
  return msalInstance
}

// Standard OIDC scopes + User.Read for Microsoft Graph profile access
export const OAUTH_SCOPES = ["openid", "profile", "email", "User.Read"]

// Build redirect URI from APP_URL — must match what's registered in Azure AD
export function getRedirectUri(): string {
  const base = process.env.APP_URL || "http://localhost:3000"
  return `${base}/api/auth/callback/microsoft`
}
