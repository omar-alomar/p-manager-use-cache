// session.ts
import { z } from "zod";
import crypto from "crypto";
import { getRedis } from "../redis/redis";

export const userRoles = ["user", "admin"] as const;

const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7;

// Environment-specific cookie naming to prevent collisions between prod/staging
const getCookieSessionKey = () => {
  const env = process.env.NODE_ENV || 'development';
  // Handle custom environment names like 'staging' that aren't in NODE_ENV types
  if (env === 'production') return 'prod-session-id';
  if (env.includes('staging')) return 'staging-session-id';
  return 'dev-session-id';
};

// Environment-specific Redis key prefix to prevent collisions between prod/staging
const getRedisKeyPrefix = () => {
  const env = process.env.NODE_ENV || 'development';
  // Handle custom environment names like 'staging' that aren't in NODE_ENV types
  if (env === 'production') return 'prod:session';
  if (env.includes('staging')) return 'staging:session';
  return 'dev:session';
};

const COOKIE_SESSION_KEY = getCookieSessionKey();
const REDIS_KEY_PREFIX = getRedisKeyPrefix();

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

export function getUserFromSession(cookies: Pick<Cookies, "get">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionId) return null;
  return getUserSessionById(sessionId);
}

export async function updateUserSessionData(user: UserSession, cookies: Pick<Cookies, "get">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionId) return null;

  const r = getRedis();
  if (!r) return null;
  
  try {
    await r.setex(`${REDIS_KEY_PREFIX}:${sessionId}`, SESSION_EXPIRATION_SECONDS, JSON.stringify(sessionSchema.parse(user)));
  } catch (e) {
    console.error("Redis SETEX failed (updateUserSessionData)", e);
  }
}

export async function createUserSession(user: UserSession, cookies: Pick<Cookies, "set">) {
  const sessionId = crypto.randomBytes(32).toString("hex"); // 64 chars is plenty
  const jsonData = JSON.stringify(sessionSchema.parse(user));

  const r = getRedis();
  if (r) {
    try {
      await r.setex(`${REDIS_KEY_PREFIX}:${sessionId}`, SESSION_EXPIRATION_SECONDS, jsonData);
    } catch (e) {
      // DO NOT throw—auth should still succeed with just the cookie
      console.error("Redis SETEX failed (createUserSession)", e);
    }
  }

  setCookie(sessionId, cookies);
}

export async function updateUserSessionExpiration(cookies: Pick<Cookies, "get" | "set">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionId) return null;

  const user = await getUserSessionById(sessionId);
  if (!user) return;

  const r = getRedis();
  if (r) {
    try {
      await r.setex(`${REDIS_KEY_PREFIX}:${sessionId}`, SESSION_EXPIRATION_SECONDS, JSON.stringify(user));
    } catch (e) {
      console.error("Redis SETEX failed (refresh)", e);
    }
  }
  setCookie(sessionId, cookies);
}

export async function removeUserFromSession(cookies: Pick<Cookies, "get" | "delete">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionId) return null;

  const r = getRedis();
  if (r) {
    try {
      await r.del(`${REDIS_KEY_PREFIX}:${sessionId}`);
    } catch (e) {
      console.error("Redis DEL failed", e);
    }
  }
  cookies.delete(COOKIE_SESSION_KEY);
}

function setCookie(sessionId: string, cookies: Pick<Cookies, "set">) {
  // Get domain configuration for environment-specific cookie scoping
  const getCookieDomain = () => {
    const env = process.env.NODE_ENV || 'development';
    // In production/staging, scope cookies to the specific subdomain
    if (env === 'production' || env.includes('staging')) {
      // Use the current hostname to ensure subdomain-specific cookies
      return process.env.COOKIE_DOMAIN || undefined; // Let the browser handle domain scoping
    }
    return undefined; // No domain restriction in development
  };

  cookies.set(COOKIE_SESSION_KEY, sessionId, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    path: "/", // make sure it applies app-wide
    domain: getCookieDomain(), // Environment-specific domain scoping
    expires: Date.now() + SESSION_EXPIRATION_SECONDS * 1000,
  });
}

async function getUserSessionById(sessionId: string) {
  const r = getRedis();
  if (!r) return null;
  
  try {
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
