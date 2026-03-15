// session.ts
//
// Redis-backed session management with environment isolation.
//
// How it works:
// - On login, a random 64-char session ID is generated and stored as an httpOnly cookie.
// - The session payload ({id, role}) is stored in Redis with a 3-month TTL.
// - Each environment (prod/staging/dev) uses its own cookie name and Redis key prefix
//   so they never collide, even on the same domain or Redis instance.
//
// Version-based invalidation:
// - Regular user sessions include APP_VERSION in the Redis key prefix
//   (e.g. "prod:session:v1.1.1:<id>"). Bumping the version = old keys no longer
//   match = users are effectively logged out and must re-authenticate.
// - Admin sessions use a version-less prefix (e.g. "prod:session:admin:<id>")
//   so they survive version bumps. Admins still see the changelog redirect
//   via the lastSeenVersion check, but they don't lose their session.
//
// Session lookup checks the admin prefix first, then the versioned prefix.
// Logout deletes from both prefixes since we don't know which one it's under.

import { z } from "zod";
import crypto from "crypto";
import { getRedis } from "../redis/redis";
import { APP_VERSION } from "@/constants/version";

export const userRoles = ["user", "admin"] as const;

const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 90; // 3 months

// Environment-specific cookie name to prevent collisions between prod/staging/dev
const getCookieSessionKey = () => {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') return 'prod-session-id';
  if (env.includes('staging')) return 'staging-session-id';
  return 'dev-session-id';
};

// Versioned Redis prefix for regular users — version bump invalidates their sessions
const getRedisKeyPrefix = () => {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') return `prod:session:v${APP_VERSION}`;
  if (env.includes('staging')) return `staging:session:v${APP_VERSION}`;
  return `dev:session:v${APP_VERSION}`;
};

// Version-less Redis prefix for admins — sessions persist across deploys
const getAdminRedisKeyPrefix = () => {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') return `prod:session:admin`;
  if (env.includes('staging')) return `staging:session:admin`;
  return `dev:session:admin`;
};

const COOKIE_SESSION_KEY = getCookieSessionKey();
const REDIS_KEY_PREFIX = getRedisKeyPrefix();
const ADMIN_REDIS_KEY_PREFIX = getAdminRedisKeyPrefix();

const sessionSchema = z.object({
  id: z.number(),
  role: z.enum(userRoles),
});
type UserSession = z.infer<typeof sessionSchema>;

export type Cookies = {
  set: (key: string, value: string, opts: { secure?: boolean; httpOnly?: boolean; sameSite?: "strict" | "lax"; expires?: number; path?: string; domain?: string }) => void;
  get: (key: string) => { name: string; value: string } | undefined;
  delete: (key: string) => void;
};

// Read session from cookie + Redis
export function getUserFromSession(cookies: Pick<Cookies, "get">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionId) return null;
  return getUserSessionById(sessionId);
}

// Update the session payload in Redis (e.g. after role change)
export async function updateUserSessionData(user: UserSession, cookies: Pick<Cookies, "get">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionId) return null;

  const r = getRedis();
  if (!r) return null;

  const prefix = user.role === "admin" ? ADMIN_REDIS_KEY_PREFIX : REDIS_KEY_PREFIX;
  try {
    await r.setex(`${prefix}:${sessionId}`, SESSION_EXPIRATION_SECONDS, JSON.stringify(sessionSchema.parse(user)));
  } catch (e) {
    console.error("Redis SETEX failed (updateUserSessionData)", e);
  }
}

// Create a new session on login — generates a random ID, stores in Redis, sets cookie
export async function createUserSession(user: UserSession, cookies: Pick<Cookies, "set">) {
  const sessionId = crypto.randomBytes(32).toString("hex");
  const jsonData = JSON.stringify(sessionSchema.parse(user));
  const prefix = user.role === "admin" ? ADMIN_REDIS_KEY_PREFIX : REDIS_KEY_PREFIX;

  const r = getRedis();
  if (r) {
    try {
      await r.setex(`${prefix}:${sessionId}`, SESSION_EXPIRATION_SECONDS, jsonData);
    } catch (e) {
      // DO NOT throw — auth should still succeed with just the cookie
      console.error("Redis SETEX failed (createUserSession)", e);
    }
  }

  setCookie(sessionId, cookies);
}

// Refresh the TTL on an existing session (called on active requests)
export async function updateUserSessionExpiration(cookies: Pick<Cookies, "get" | "set">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionId) return null;

  const user = await getUserSessionById(sessionId);
  if (!user) return;

  const prefix = user.role === "admin" ? ADMIN_REDIS_KEY_PREFIX : REDIS_KEY_PREFIX;
  const r = getRedis();
  if (r) {
    try {
      await r.setex(`${prefix}:${sessionId}`, SESSION_EXPIRATION_SECONDS, JSON.stringify(user));
    } catch (e) {
      console.error("Redis SETEX failed (refresh)", e);
    }
  }
  setCookie(sessionId, cookies);
}

// Destroy session on logout — deletes from both admin and versioned prefixes
export async function removeUserFromSession(cookies: Pick<Cookies, "get" | "delete">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionId) return null;

  const r = getRedis();
  if (r) {
    try {
      await r.del(`${ADMIN_REDIS_KEY_PREFIX}:${sessionId}`, `${REDIS_KEY_PREFIX}:${sessionId}`);
    } catch (e) {
      console.error("Redis DEL failed", e);
    }
  }
  cookies.delete(COOKIE_SESSION_KEY);
}

// Set the session cookie with env-specific domain scoping
function setCookie(sessionId: string, cookies: Pick<Cookies, "set">) {
  const getCookieDomain = () => {
    const env = process.env.NODE_ENV || 'development';
    if (env === 'production' || env.includes('staging')) {
      return process.env.COOKIE_DOMAIN || undefined;
    }
    return undefined;
  };

  cookies.set(COOKIE_SESSION_KEY, sessionId, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    domain: getCookieDomain(),
    expires: Date.now() + SESSION_EXPIRATION_SECONDS * 1000,
  });
}

// Look up a session by ID — checks admin prefix first, then versioned prefix
async function getUserSessionById(sessionId: string) {
  const r = getRedis();
  if (!r) return null;

  try {
    // Admin sessions (version-less) take priority
    const adminRaw = await r.get(`${ADMIN_REDIS_KEY_PREFIX}:${sessionId}`);
    if (adminRaw) {
      const parsed = JSON.parse(adminRaw);
      const { success, data } = sessionSchema.safeParse(parsed);
      if (success) return data;
    }

    // Fall back to versioned prefix (regular users)
    const raw = await r.get(`${REDIS_KEY_PREFIX}:${sessionId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const { success, data } = sessionSchema.safeParse(parsed);
    return success ? data : null;
  } catch (e) {
    console.error("Redis GET failed", e);
    return null;
  }
}
