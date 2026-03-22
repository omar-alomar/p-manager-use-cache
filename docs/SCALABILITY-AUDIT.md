# Scalability Audit — Mildenberg Project Platform

**Date:** 2026-03-21
**Context:** App currently serves a small internal team. This audit identifies what works now but will cause serious problems when scaling to larger teams.

---

## Priority Summary

| # | Issue | Risk Level | Breaks At |
|---|---|---|---|
| 1 | API pagination fetches all rows, slices in memory | CRITICAL | ~5K rows |
| 2 | Missing database indexes on foreign keys | CRITICAL | ~10K rows |
| 3 | Unbounded `include` in queries (tasks, milestones) | CRITICAL | ~500 projects |
| 4 | SSE creates one Redis connection per user | HIGH | ~500 concurrent |
| 5 | Cache invalidation too coarse (`projects:all`) | HIGH | ~100 active editors |
| 6 | Task creation `MAX(id)` contention | MEDIUM | ~1K concurrent writes |
| 7 | Notification removal O(n) Redis calls | MEDIUM | ~1K notifications |
| 8 | Double Redis lookup per auth check | MEDIUM | ~1K req/sec |
| 9 | Notifications not durable (Redis only, no DB) | MEDIUM | Any Redis failure |
| 10 | Session key volume | LOW | ~10K DAU |
| 11 | No auth result caching | LOW | ~10K req/sec |

---

## Critical

### 1. API Pagination — Full-Table Fetch Then Slice

**Where:** `src/app/api/v1/_lib/pagination.ts`, all REST API list endpoints

**Problem:** Every list endpoint fetches the entire result set from DB, then slices in JavaScript.

```
GET /api/v1/tasks?page=100&limit=20
  -> Fetches ALL tasks for user (could be 10K rows)
  -> Slices items 1980-2000 in memory
  -> Returns those 20
```

With 100 concurrent users paginating = 100 full-table fetches in parallel.

**Affected routes:** `/api/v1/projects`, `/api/v1/tasks`, `/api/v1/clients`, `/api/v1/users`, `/api/v1/admin/users`

**Fix:** Move pagination to DB layer using Prisma `skip` and `take`. Change DB functions to accept pagination params. API routes pass `{ skip: (page-1)*limit, take: limit }` to DB functions.

---

### 2. Missing Database Indexes

**Where:** `prisma/schema.prisma`

**Problem:** Only these indexes exist: `User_email_key` (unique), `Mention_commentId_userId_key` (unique). Common query patterns do full table scans.

**Missing indexes (add all):**
```prisma
model Task {
  @@index([userId])
  @@index([projectId])
  @@index([completed, userId])
  @@index([createdAt])
}

model Project {
  @@index([userId])
  @@index([clientId])
  @@index([archived, userId])
}

model Comment {
  @@index([projectId])
  @@index([taskId])
}

model Milestone {
  @@index([projectId])
}

model Notification {
  @@index([userId, read])
}
```

**Fix:** Add indexes to schema, run `npx prisma db push`. Zero application code changes.

---

### 3. Unbounded Includes in Queries

**Where:** `src/db/projects.ts`, `src/db/clients.ts`, `src/db/tasks.ts`

**Problem:** Queries eagerly include all related records with no limits:
- `getProjects()` includes ALL uncompleted tasks + ALL milestones per project
- `getClients()` includes ALL projects per client, each with their user
- `getTasks()` includes full `User`, `AssignedBy`, and `Project` per task

With 500 projects x 10 tasks each = 5,000 task rows in a single query response.

**Fix:**
- Use `select` instead of `include` for list queries (return only needed fields)
- Add `take` limits on included relations where full sets aren't needed
- Split into separate queries where the UI doesn't need nested data

---

## High

### 4. SSE Creates One Redis Connection Per User

**Where:** `src/app/api/notifications/stream/route.ts`

**Problem:** Each SSE connection calls `redis.duplicate()`, creating a dedicated Redis connection. 500 concurrent users = 500 connections. Default Redis max is 10,000.

**Fix:** Implement a shared subscriber that multiplexes notifications. One Redis connection subscribes to a pattern (`notifications:*`), then routes messages to the correct SSE stream in memory.

---

### 5. Cache Invalidation Too Coarse

**Where:** `src/db/projects.ts`, `src/db/clients.ts` — `revalidateTag()` calls

**Problem:** Editing ANY project invalidates `projects:all`, busting the cache for every user viewing the project list. Creating a project also invalidates `clients:all`. With frequent edits, the cache is permanently cold.

**Fix:** Finer-grained cache tags. Use `projects:page=1:limit=20` or `projects:userId=5` instead of `projects:all`. Only invalidate the specific segments that changed.

---

## Medium

### 6. Task Creation `MAX(id)` Pattern

**Where:** `src/db/tasks.ts` — `createTask()`

**Problem:** Raw SQL computes `MAX(id)` on every insert. Under high concurrent writes, multiple transactions may contend on the same max value.

**Fix:** Fix the underlying PostgreSQL sequence issue properly (`ALTER SEQUENCE ... RESTART WITH ...`), then revert to `prisma.task.create()`.

---

### 7. Notification Removal is O(n) Redis Calls

**Where:** `src/services/notificationService.ts` — `removeUserNotification()`

**Problem:** Removing one notification: LRANGE all 100 → filter in JS → DEL list → LPUSH 99 items back (101 Redis calls).

**Fix:** Use `LREM` (single Redis call) to remove by value.

---

### 8. Double Redis Lookup Per Auth Check

**Where:** `src/auth/session.ts` — `getUserSessionById()`

**Problem:** Every request checks two Redis keys (admin prefix first, then versioned prefix). 1K req/sec = 2K Redis GETs.

**Fix:** Store the role in the key name or use a single-key lookup strategy. Or add a short-lived (5-10s) in-memory LRU cache for session lookups.

---

### 9. Notifications Not Durable

**Where:** `src/services/notificationService.ts`

**Problem:** Notifications are stored in Redis lists only (capped at 100). The `Notification` Prisma model exists but isn't used for storage. If Redis is flushed, all unread notifications are lost.

**Fix:** Write notifications to the database (the `Notification` table already exists in the schema). Use Redis for real-time delivery only, DB for persistence and history.

---

## Low

### 10. Session Key Volume

**Where:** `src/auth/session.ts`

**Problem:** 3-month TTL + high DAU = tens of thousands of session keys accumulating in Redis. Not a memory problem yet (~few MB), but should be monitored.

---

### 11. No Auth Result Caching

**Where:** `src/auth/session.ts`, `src/app/api/v1/_lib/auth.ts`

**Problem:** Each request re-validates the session from Redis. A short-lived local cache (5-10s LRU) could reduce Redis auth load by 90%.

---

## When to Address

**Before scaling past ~50 users:** Fix #1 (pagination), #2 (indexes), #3 (unbounded includes)
**Before scaling past ~500 concurrent:** Fix #4 (SSE connections), #5 (cache invalidation)
**Before scaling past ~5K daily active:** Fix #6-9 (medium priority items)
**Before scaling past ~50K daily active:** Fix #10-11 (low priority items)

Indexes (#2) are the cheapest fix with the highest impact — zero code changes, just a schema update.
