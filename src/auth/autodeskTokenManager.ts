// autodeskTokenManager.ts — Distributed lock + token lifecycle management
//
// Solves the concurrent refresh race condition:
// If 2 requests hit the server simultaneously with an expired access token,
// both would try to redeem the same single-use refresh token. One would fail,
// permanently breaking that user's session.
//
// Solution: Redis SETNX lock before any refresh attempt. Lock losers wait
// briefly and re-read from DB (the lock holder should have refreshed by then).
//
// Access tokens are cached in Redis (short TTL matching remaining validity).
// Refresh tokens are stored in PostgreSQL (long-lived, must survive Redis flushes).

import { getRedis } from "@/redis/redis"
import { refreshAutodeskToken } from "./autodesk"
import prisma from "@/db/db"

const LOCK_TTL_MS = 5000 // 5-second lock auto-expire prevents deadlocks
const TOKEN_BUFFER_MS = 5 * 60 * 1000 // Refresh 5 minutes before expiry

function getEnvPrefix(): string {
  const env = process.env.NODE_ENV || "development"
  if (env === "production") return "prod"
  if (env.includes("staging")) return "staging"
  return "dev"
}

function tokenCacheKey(userId: number): string {
  return `${getEnvPrefix()}:acc:token:${userId}`
}

function refreshLockKey(userId: number): string {
  return `${getEnvPrefix()}:acc:refresh-lock:${userId}`
}

async function acquireLock(userId: number): Promise<boolean> {
  const r = getRedis()
  if (!r) return true // No Redis = skip locking (single-process fallback)
  const result = await r.set(refreshLockKey(userId), "1", "PX", LOCK_TTL_MS, "NX")
  return result === "OK"
}

async function releaseLock(userId: number): Promise<void> {
  const r = getRedis()
  if (!r) return
  await r.del(refreshLockKey(userId))
}

/**
 * Get a valid Autodesk access token for a user.
 *
 * Returns the token string, or null if the user needs to (re-)authenticate.
 * Handles token refresh transparently with distributed lock protection.
 */
export async function getValidAccessToken(userId: number): Promise<string | null> {
  // 1. Check Redis cache first
  const r = getRedis()
  if (r) {
    const cached = await r.get(tokenCacheKey(userId))
    if (cached) return cached
  }

  // 2. Read from DB
  const token = await prisma.autodeskToken.findUnique({ where: { userId } })
  if (!token) return null // User not connected

  // 3. Check 15-day refresh token cliff
  if (token.refreshExpiresAt < new Date()) {
    await prisma.autodeskToken.delete({ where: { userId } }).catch(() => {})
    return null // Must re-authenticate
  }

  // 4. If access token still valid (with buffer), cache and return
  const remainingMs = token.expiresAt.getTime() - Date.now()
  if (remainingMs > TOKEN_BUFFER_MS) {
    if (r) {
      const ttlSeconds = Math.floor((remainingMs - TOKEN_BUFFER_MS) / 1000)
      await r.setex(tokenCacheKey(userId), ttlSeconds, token.accessToken)
    }
    return token.accessToken
  }

  // 5. Access token expired/expiring — need to refresh with lock
  const locked = await acquireLock(userId)
  if (!locked) {
    // Another request is refreshing. Wait and re-read.
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const freshToken = await prisma.autodeskToken.findUnique({ where: { userId } })
    if (freshToken && freshToken.expiresAt.getTime() - TOKEN_BUFFER_MS > Date.now()) {
      return freshToken.accessToken
    }
    return null // Lock holder may have failed
  }

  try {
    // Re-read from DB (another request may have already refreshed)
    const currentToken = await prisma.autodeskToken.findUnique({ where: { userId } })
    if (!currentToken) return null
    if (currentToken.expiresAt.getTime() - TOKEN_BUFFER_MS > Date.now()) {
      return currentToken.accessToken // Already refreshed
    }

    // Actually refresh
    const result = await refreshAutodeskToken(currentToken.refreshToken)

    const now = new Date()
    const expiresAt = new Date(now.getTime() + result.expiresIn * 1000)
    const refreshExpiresAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) // 15 days

    await prisma.autodeskToken.update({
      where: { userId },
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt,
        refreshExpiresAt,
      },
    })

    // Cache the new access token
    if (r) {
      const ttlSeconds = Math.floor((result.expiresIn * 1000 - TOKEN_BUFFER_MS) / 1000)
      if (ttlSeconds > 0) {
        await r.setex(tokenCacheKey(userId), ttlSeconds, result.accessToken)
      }
    }

    return result.accessToken
  } catch (error) {
    console.error("Autodesk token refresh failed for user", userId, error)
    // Refresh token may be burned — delete the row so UI shows reconnect prompt
    await prisma.autodeskToken.delete({ where: { userId } }).catch(() => {})
    // Clear cache
    if (r) await r.del(tokenCacheKey(userId)).catch(() => {})
    return null
  } finally {
    await releaseLock(userId)
  }
}
