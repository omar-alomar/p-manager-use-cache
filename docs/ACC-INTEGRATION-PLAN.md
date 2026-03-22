# Autodesk Construction Cloud Integration

## Context

The Mildenberg project management platform needs to integrate with Autodesk Construction Cloud (ACC) so the team can browse project files/DWGs, view version history, see file lock status, unlock files, and view drawings — all without leaving the app. This is a significant integration that introduces per-user external OAuth, token lifecycle management, and a new external API dependency.

The user has identified critical concerns around auth complexity (3-legged OAuth with 60-min access tokens, single-use refresh tokens, concurrent refresh races, 15-day re-auth cliff), ACC project linking, opaque rate limits, and the webhook complexity tradeoff. This plan addresses all of them.

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Auth model | 3-legged from day one | User explicitly wants this. No 2-legged shortcuts. |
| Token storage | PostgreSQL (DB) for refresh tokens, Redis for access tokens | Refresh tokens are long-lived and must survive Redis flushes. Access tokens are short-lived cache. |
| Refresh race condition | Redis distributed lock (SETNX) | Prevents double-redeeming single-use refresh tokens. |
| 15-day cliff | Graceful null-return, reconnect prompt in file browser | `getValidAccessToken()` returns null when expired. File browser shows "Reconnect" prompt. No separate banner — user discovers re-auth need when interacting with the feature. |
| Real-time updates | Poll on page load with Redis cache (5-min TTL) | Webhooks are per-user, per-project, require token rotation handling. Polling is simpler and sufficient for an internal team. |
| SVF2 translation | Lazy (on first view) | Proactive translation wastes Flex tokens on files nobody views. Lazy triggers translation only when a user actually opens the viewer. |
| Version history | Timeline only, no diff | Autodesk has no diff API. Building DWG diff tooling is out of scope. Show version list with per-version "View" action. |
| SDK vs raw fetch | Raw `fetch()` | Matches the PropertyLookup pattern, avoids SDK version churn, lighter dependency footprint. |
| ACC project mapping | One-to-many (one app project can link to multiple ACC projects across multiple hubs) | Projects can span phases, disciplines, or accounts. Future-proofed. PropertyLookup will eventually follow the same pattern. |
| Linking flow | Three-tier: admin bulk-link + auto-suggest on creation + manual per-project | 50+ projects need bulk tooling for initial rollout. Auto-suggest catches new projects. Manual per-project as fallback. |
| Linker hub flow | Hub selection first, then project selection within hub | Users can access multiple ACC accounts (hubs). Must select hub before browsing projects. |
| Multi-link file browser | Tabbed view — one tab per linked ACC project | Clean separation. Each tab shows its own file tree. [+ Link] button adds more tabs. |
| Viewer UX | Full-screen overlay | Drawings need maximum screen real estate. Lightbox-style overlay with close button. |
| Link control location | Inside the file browser section | Self-contained — shows "Link an ACC project" prompt when unlinked, link status when linked. |

---

## New Environment Variables

```
APS_CLIENT_ID        # From Autodesk app registration
APS_CLIENT_SECRET    # From Autodesk app registration
```

Callback URL derived from existing `APP_URL` env var: `${APP_URL}/api/auth/callback/autodesk`

**Prerequisite:** APS app must be provisioned as a Custom Integration in the ACC Account Admin panel. Without this, all API calls 403 with no useful error. User will handle APS app registration and ACC provisioning before testing — we build the integration first.

---

## Schema Changes

**File:** `prisma/schema.prisma`

### New Models

```prisma
model AutodeskToken {
  id               Int      @id @default(autoincrement())
  userId           Int      @unique
  accessToken      String
  refreshToken     String
  expiresAt        DateTime    // Access token expiry (now + 60min)
  refreshExpiresAt DateTime    // Refresh token expiry (now + 15 days)
  scope            String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model AccProjectLink {
  id             Int      @id @default(autoincrement())
  projectId      Int              // NOT unique — one project can link to many ACC projects
  accHubId       String
  accHubName     String           // Display name for hub selection
  accProjectId   String
  accProjectName String
  linkedAt       DateTime @default(now())
  linkedByUserId Int?             // Nullable — survives user deletion (SetNull), same pattern as Comment.userId

  project  Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  linkedBy User?   @relation("AccLinkedBy", fields: [linkedByUserId], references: [id], onDelete: SetNull)

  @@unique([projectId, accProjectId])  // Prevent duplicate links to same ACC project
  @@index([projectId])                  // Fast lookup of all links for a project
  @@index([accProjectId])
}
```

### Relation Additions

```prisma
model User {
  // ... existing fields ...
  autodeskToken     AutodeskToken?
  accLinkedProjects AccProjectLink[] @relation("AccLinkedBy")
}

model Project {
  // ... existing fields ...
  accLinks AccProjectLink[]    // One-to-many: project can link to multiple ACC projects
}
```

`onDelete: Cascade` on `AutodeskToken` ensures tokens are cleaned up when users are deleted. `onDelete: SetNull` on `AccProjectLink.linkedBy` ensures project links survive user deletion (the `linkedByUserId` becomes null, same pattern as `Comment.userId`). Reassigned projects keep their ACC links intact.

**Future: PropertyAddress migration.** The `AccProjectLink` one-to-many pattern is designed to be reusable. When PropertyLookup needs multiple addresses per project, create a `PropertyAddress` model following the same shape (junction table, `@@unique([projectId, address])`, `@@index([projectId])`). Migrate `Project.propertyAddress` string field to the new table. Not in scope now but the pattern is established.

---

## Implementation — Layer by Layer

### 1. Auth Module

**New file: `src/auth/autodesk.ts`**

Follows the lazy singleton pattern from `src/auth/msal.ts`. Pure HTTP calls to Autodesk, no storage logic.

- `getAutodeskAuthUrl(state: string): string` — Builds authorization URL with scopes `data:read data:write data:create account:read viewables:read`
- `exchangeAutodeskCode(code: string)` — POST `/authentication/v2/token` with `grant_type=authorization_code`, client credentials in `Authorization: Basic` header (base64 of clientId:clientSecret)
- `refreshAutodeskToken(refreshToken: string)` — POST `/authentication/v2/token` with `grant_type=refresh_token`. Returns new access token AND new single-use refresh token.
- `getAutodeskRedirectUri(): string` — `${APP_URL}/api/auth/callback/autodesk`

### 2. Token Manager (Distributed Lock)

**New file: `src/auth/autodeskTokenManager.ts`**

The critical piece that solves the concurrent refresh race condition. Sits between auth module and DB.

**`getValidAccessToken(userId: number): Promise<string | null>`**

Flow:
1. Check Redis cache first: `acc:token:{userId}` — if valid, return immediately
2. If cache miss, read `AutodeskToken` from DB
3. If no token row → return `null` (user not connected)
4. If `refreshExpiresAt < now` → delete token row, return `null` (15-day cliff hit, must re-auth)
5. If `expiresAt` is >5min from now → cache in Redis with remaining TTL, return it
6. If expired/expiring → acquire Redis lock `acc:refresh-lock:{userId}` via `SET key "1" PX 5000 NX`
   - If lock acquired: refresh token, update DB row (new access + refresh token + expiry dates), cache in Redis, release lock, return new access token
   - If lock NOT acquired: wait 1 second, re-read DB (the lock holder should have refreshed by now), return the fresh token
   - If refresh fails (Autodesk returned error): delete token row (refresh token is now burned), release lock, return `null`

Redis keys (all prefixed with `{env}:` to prevent prod/staging collisions, matching session key pattern):
- `{env}:acc:token:{userId}` — cached access token with TTL matching remaining validity
- `{env}:acc:refresh-lock:{userId}` — distributed lock, 5-second auto-expire (prevents deadlocks)

### 3. OAuth Routes

**New file: `src/app/api/auth/autodesk/route.ts`** (GET — initiate)

Pattern: identical to `/api/auth/microsoft/route.ts`
1. Require existing session (user must be logged in — this is "connect Autodesk", not "login via Autodesk")
2. Generate CSRF state via `crypto.randomBytes(16).toString("hex")`
3. Store state + return URL in `autodesk-oauth-state` httpOnly cookie (10-min maxAge)
4. Redirect to `getAutodeskAuthUrl(state)`

**New file: `src/app/api/auth/callback/autodesk/route.ts`** (GET — callback)

Pattern: follows `/api/auth/callback/microsoft/route.ts`
1. Validate CSRF state against cookie
2. Extract `code` from query params
3. Call `exchangeAutodeskCode(code)` → get access/refresh tokens
4. Get current user from session (`getCurrentUser()`)
5. Upsert `AutodeskToken` for user (access token, refresh token, expiry timestamps, scopes)
6. Delete CSRF cookie
7. Redirect to the return URL stored in the state cookie (e.g., `/projects/5`)

Key difference from Microsoft OAuth: Microsoft is for login, Autodesk is for linking. If no session exists, redirect to `/login?error=auth_required`.

**New file: `src/app/api/auth/autodesk/disconnect/route.ts`** (POST)

Delete `AutodeskToken` for current user. Redirect back.

### 4. ACC API Client

**New file: `src/services/autodeskApi.ts`**

Thin wrapper over Autodesk Data Management API. All functions take `userId` as first param (for token lookup via `getValidAccessToken`).

**Core fetch helper:**
```
accFetch(userId, path, options?) → Response | null
```
- Gets valid access token via `getValidAccessToken(userId)`
- If null → return `null` (caller surfaces "connect Autodesk" prompt)
- Fetch with 15-second timeout (AbortController, same pattern as `fetchSafe` in property-lookup)
- On 429: read `Retry-After` header. If <=5 seconds, wait and retry once. If >5 seconds or still 429 after retry, return the response immediately (caller shows "Rate limited, try again shortly"). Never block a server-side request for more than 5 seconds waiting on a retry.
- On 403: could mean permission issue OR app not provisioned. Return response for caller to handle.
- **`b.` prefix handling**: Each public function (not the generic `accFetch`) is responsible for prepending `b.` to the correct IDs. Only hub IDs and project IDs get the prefix when passed to Data Management API path segments. Folder IDs, item IDs, and version IDs are returned by the API pre-formatted and must NOT be prefixed. ACC-specific APIs (Issues, Sheets — future) use raw GUIDs without prefix.

**Public functions:**
- `listHubs(userId)` — GET `/project/v1/hubs`
- `listProjects(userId, hubId)` — GET `/project/v1/hubs/b.{hubId}/projects`
- `listTopFolders(userId, hubId, projectId)` — GET `/project/v1/hubs/b.{hubId}/projects/b.{projectId}/topFolders`
- `listFolderContents(userId, projectId, folderId)` — GET `/data/v1/projects/b.{projectId}/folders/{folderId}/contents`
- `getItemDetails(userId, projectId, itemId)` — GET `/data/v1/projects/b.{projectId}/items/{itemId}`
- `listItemVersions(userId, projectId, itemId)` — GET `/data/v1/projects/b.{projectId}/items/{itemId}/versions`
- `unlockFile(userId, projectId, itemId)` — PATCH `/data/v1/projects/b.{projectId}/items/{itemId}` with `{ reserved: false }`
- `submitTranslation(userId, urn)` — POST `/modelderivative/v2/designdata/job`
- `getTranslationStatus(userId, urn)` — GET `/modelderivative/v2/designdata/{urn}/manifest`

### 5. Database Layer

**New file: `src/db/autodesk.ts`**

- `getAccProjectLinks(projectId)` — returns all links for a project, cached with `"use cache"` + `cacheTag("acc:links:projectId={id}")`
- `linkAccProject(data)` — create `AccProjectLink` (unique constraint prevents duplicates), invalidate cache tags
- `unlinkAccProject(linkId)` — delete specific link by ID, invalidate cache
- `unlinkAllAccProjects(projectId)` — delete all links for a project, invalidate cache
- `upsertAutodeskToken(data)` — upsert `AutodeskToken`
- `deleteAutodeskToken(userId)` — delete token row
- `getUserAutodeskStatus(userId)` — return connection status + `refreshExpiresAt` (used by file browser reconnect prompt and `/api/acc/status`)
- `getAllAccProjectLinks()` — for admin bulk-link page (list all existing links)
- `bulkLinkAccProjects(links[])` — batch upsert for admin bulk-link

### 6. Server Actions

**New file: `src/actions/autodesk.ts`**

- `linkAccProjectAction(projectId, accHubId, accHubName, accProjectId, accProjectName)` — maintenance check → get current user → call `linkAccProject()` → `revalidatePath`
- `unlinkAccProjectAction(linkId)` — maintenance check → call `unlinkAccProject()` → `revalidatePath`
- `bulkLinkAccProjectsAction(links[])` — admin-only, maintenance check → call `bulkLinkAccProjects()` → revalidate

### 7. Internal API Routes

These are called by client components (same pattern as `/api/property-lookup`).

| Route | Method | Purpose |
|---|---|---|
| `/api/acc/status` | GET | User's Autodesk connection status (connected, daysUntilExpiry) |
| `/api/acc/hubs` | GET | List ACC hubs the user has access to (for linking UI step 1) |
| `/api/acc/projects` | GET | List ACC projects within a hub. Param: `hubId`. (for linking UI step 2) |
| `/api/acc/files` | GET | List files in a folder. Params: `accProjectId` (required — which linked ACC project), `folderId?` (omit for top folders). Redis-cached 5min. |
| `/api/acc/versions` | GET | Version history for an item. Params: `projectId`, `itemId` |
| `/api/acc/unlock` | POST | Unlock a file. Body: `{ projectId, itemId }` |
| `/api/acc/translate` | POST | Start SVF2 translation. Body: `{ urn }`. Checks Redis cache first — if URN already translated, returns cached viewable URN immediately (no Flex token cost). |
| `/api/acc/translate/status` | GET | Check translation progress. Param: `urn`. On success, caches the viewable URN in Redis (`{env}:acc:translated:{urn}`, 7-day TTL) so repeat views are instant. |
| `/api/acc/viewer-token` | GET | Short-lived token for the Viewer JS component |

**Caching strategy for `/api/acc/files`:**
- Redis key: `{env}:acc:files:{accProjectId}:{folderId}:{userId}` (per-user because permissions differ, env-prefixed to prevent collisions)
- TTL: 5 minutes
- "Refresh" button on UI busts the cache by passing `?refresh=1`
- On cache hit, return cached data immediately
- On cache miss, fetch from Autodesk, cache, return

### 8. Components

**`src/components/AccProjectLinker.tsx`** (client)
- Drawer (slide-over, same pattern as create/edit drawers)
- If user not connected: shows "Connect your Autodesk account" button → redirects to `/api/auth/autodesk?returnTo=...`
- If connected: **two-step hub-first flow**:
  1. **Step 1 — Select hub**: Fetches hubs from `/api/acc/hubs`. If user has one hub, auto-selects it and skips to step 2.
  2. **Step 2 — Select project**: Fetches projects from `/api/acc/projects?hubId=...`. Searchable list sorted by fuzzy name similarity to the app project title (best guesses at top). Since names are mixed, show match confidence but don't auto-select.
- On select: calls `linkAccProjectAction()` with hub ID, hub name, project ID, project name
- Can be opened repeatedly to link additional ACC projects to the same app project
- Already-linked ACC projects are shown with a checkmark and disabled in the list

**`src/components/admin/AccBulkLinker.tsx`** (client)
- Admin panel page for initial rollout of 50+ projects
- Two-column table: app projects (left) ↔ ACC project dropdown (right)
- Each row shows the app project name + a dropdown of ACC projects sorted by fuzzy name similarity
- Rows with high-confidence matches are pre-highlighted (but NOT auto-selected — admin confirms)
- "Link Selected" button to bulk-save all selected mappings
- Filter: show unlinked only / all
- Calls `linkAccProjectAction()` per row in parallel

**Auto-link on project creation** (modify existing)
- In the project create/edit form (`src/components/ProjectHeroActions.tsx` or project creation flow), add an optional "Link ACC Project" button
- Only shown if the current user is connected to Autodesk
- Opens the same `AccProjectLinker` drawer (hub-first flow) — reuses the full two-step flow rather than a flat dropdown, since the dropdown approach can't handle multiple hubs
- Optional — can skip and link later from the file browser section

**`src/components/AccFileBrowser.tsx`** (client)
- Main integration component on project detail page
- Follows PropertyLookup pattern: collapsible section, auto-loads if project has ACC links
- **Tabbed view**: one tab per linked ACC project. Tab label = ACC project name. [+ Link] button opens AccProjectLinker to add more links. Each tab has its own independent folder navigation state.
- When no links exist: shows empty state with "Link an ACC project to browse files and drawings." prompt + [Link ACC Project] button
- When single link: no tab bar, just the file browser directly
- Breadcrumb navigation for folder hierarchy (top folders → subfolders) — independent per tab
- File list rows: icon, name, size, modified date, lock badge, actions (view, versions)
- Folder rows: click to navigate into
- **Permission-gated folders**: if Autodesk returns 403 for a folder, show "You don't have access to this folder" — not an error, just an empty state with explanation
- **Broken link handling**: if ACC project returns 404, show "This ACC project is no longer accessible. [Unlink]"
- Refresh button to bust Redis cache (per active tab)
- Each tab has an [x] or [Unlink] option (e.g., in a context menu or hover action)

**`src/components/AccFileVersions.tsx`** (client)
- Drawer showing version timeline for a file
- Each row: version number, date, author, file size
- "View" button on each version triggers the viewer for that specific version URN
- Current (tip) version highlighted

**`src/components/AccViewer.tsx`** (client)
- Loads Autodesk Viewer JS/CSS from CDN dynamically (useEffect + script injection)
- **Full-screen overlay** (lightbox-style): takes over viewport via `createPortal` to document.body. Close button in top-right corner. Escape key to close. Body scroll locked while open.
- File name + version info shown in a slim header bar within the overlay
- Translation flow: POST translate → poll status every 3s → show progress bar → init `Autodesk.Viewing.GuiViewer3D` on complete
- Gets token from `/api/acc/viewer-token`
- Handles translation errors gracefully ("File could not be prepared for viewing")

**`src/components/AccLockBadge.tsx`** (client)
- Inline badge on file rows
- Locked: lock icon + "Locked by {name}" + [Unlock] button
- Unlocked: nothing (clean default state)
- Unlock calls POST `/api/acc/unlock`, shows loading state, refreshes file list on success

### 9. CSS

**New file: `src/app/styles/acc.css`**

Add `@import "./acc.css";` to `src/app/styles/styles.css`.

Class naming follows `property.css` convention:
`.acc-browser`, `.acc-browser-header`, `.acc-breadcrumbs`, `.acc-file-list`, `.acc-file-item`, `.acc-lock-badge`, `.acc-version-list`, `.acc-viewer-container`, `.acc-connect-banner`, `.acc-project-picker`

### 10. Project Detail Page Integration

**File:** `src/app/projects/[projectId]/page.tsx`

Add a new `AccFileBrowserSection` server component (like `PropertyLookupSection` on line 523):

```typescript
async function AccFileBrowserSection({ projectId }: { projectId: string }) {
  const project = await getProject(projectId)
  if (!project) return null
  const accLinks = await getAccProjectLinks(project.id)
  return (
    <AccFileBrowser
      projectId={project.id}
      accLinks={accLinks.map(link => ({
        id: link.id,
        accHubId: link.accHubId,
        accHubName: link.accHubName,
        accProjectId: link.accProjectId,
        accProjectName: link.accProjectName,
      }))}
    />
  )
}
```

Placed between PropertyLookup and Comments sections (line ~151), wrapped in Suspense.

### 11. REST API v1 (Mobile)

Add when mobile needs ACC features. Routes follow existing `src/app/api/v1/` patterns:

| Route | Method | Purpose |
|---|---|---|
| `/api/v1/acc/status` | GET | Connection status |
| `/api/v1/projects/:id/acc/files` | GET | List files |
| `/api/v1/projects/:id/acc/files/:itemId/versions` | GET | Version history |
| `/api/v1/projects/:id/acc/files/:itemId/unlock` | POST | Unlock file |

These call the same `autodeskApi.ts` functions, just with REST API auth (`requireAuth` + Bearer token).

---

## Implementation Sequence

### Phase 1: Auth Foundation
1. Prisma schema changes → `npx prisma db push`
2. `src/auth/autodesk.ts` — OAuth URL builder, code exchange, token refresh
3. `src/auth/autodeskTokenManager.ts` — distributed lock, `getValidAccessToken()`
4. `src/db/autodesk.ts` — token + link CRUD
5. OAuth routes: `/api/auth/autodesk`, `/api/auth/callback/autodesk`, `/api/auth/autodesk/disconnect`
6. `/api/acc/status` route
7. **Test:** Connect Autodesk account, verify tokens stored in DB, verify access token cached in Redis, force-expire access token and verify refresh works, simulate concurrent refresh and verify lock prevents double-redeem

### Phase 2: Project Linking
8. `src/actions/autodesk.ts` — link/unlink server actions
9. `/api/acc/hubs` route — list ACC hubs (linker step 1)
10. `/api/acc/projects` route — list ACC projects within a hub (linker step 2)
11. `AccProjectLinker.tsx` component (hub-first flow, fuzzy name-matching sort)
12. Integrate linker into file browser section on project detail page
13. `AccBulkLinker.tsx` admin component + admin page route
14. Add optional "Link ACC Project" button to project create/edit flow (opens same AccProjectLinker drawer)
15. **Test:** Link/unlink ACC project, verify persistence, verify cache invalidation, test bulk link from admin panel, test link from project creation flow

### Phase 3: File Browser
16. `src/services/autodeskApi.ts` — full API client
17. `/api/acc/files` route with Redis caching
18. `AccFileBrowser.tsx` component (tabbed view)
19. `AccLockBadge.tsx` component
20. `src/app/styles/acc.css` + import
21. Integrate into project detail page
22. **Test:** Browse folders, navigate hierarchy, test tabs with multiple linked ACC projects, verify permission-gated folders show graceful empty state, verify broken links show re-link prompt, verify cache works (second load is instant), verify refresh button busts cache

### Phase 4: Versions + Locking
23. `/api/acc/versions` route
24. `AccFileVersions.tsx` component
25. `/api/acc/unlock` route
26. **Test:** View version timeline, unlock a locked file, verify lock badge updates

### Phase 5: DWG Viewer
27. `/api/acc/translate` + `/api/acc/translate/status` routes (with translation URN caching)
28. `/api/acc/viewer-token` route
29. `AccViewer.tsx` component (CDN loader, translation polling, full-screen overlay, viewer init)
30. **Test:** Click "View" on a DWG, verify translation starts, verify progress feedback, verify viewer renders after translation completes, close and reopen same file → verify instant load from cached URN

### Phase 6: Polish
31. Update `CLAUDE.md` with new models, routes, env vars, components

---

## Risk Register

| Risk | Mitigation |
|---|---|
| App not provisioned in ACC → silent 403 | Document provisioning step prominently. `/api/acc/status` should detect 403 and surface "Ask your ACC admin to add this app" message. |
| Refresh token double-redeemed → broken session | Redis SETNX lock with 5s auto-expire. Retry-after-wait pattern for lock losers. |
| 15-day inactivity → silent auth failure | `getValidAccessToken()` returns null gracefully. File browser shows "Reconnect" prompt when user interacts with the feature. |
| Rate limits hit (opaque thresholds) | Single retry with `Retry-After` header. 5-min Redis cache reduces API call volume. UI shows "Rate limited, try again shortly." Current approach is fine for a small team. When scaling to larger teams, add request throttling (concurrency limiter in `accFetch`) and/or increase cache TTLs. |
| ACC project deleted or access revoked | File browser detects 404/403, shows "This ACC project is no longer accessible. [Unlink]" with option to re-link. |
| Translation costs (Flex tokens) | Lazy translation only. Consider confirmation dialog: "Prepare this file for viewing?" on first view. Monitor usage via Autodesk dashboard. |
| Token stored in DB unencrypted | Acceptable for internal team app. If security requirements tighten, encrypt with `SESSION_SECRET` via AES-256-GCM. |
| Stale link metadata (hub/project names renamed in ACC) | `accHubName` and `accProjectName` are denormalized. If renamed in ACC, stored names go stale. Acceptable for internal app. Can add a "refresh metadata" action later if it becomes a problem. |
| Viewer token exposes full scopes to client JS | `/api/acc/viewer-token` returns the user's access token (includes `data:write`). The Autodesk Viewer only needs `viewables:read`, but 3-legged auth can't mint narrower tokens. Acceptable for internal team app — the token is scoped to the authenticated user's permissions anyway. |

---

## Files Summary

### New Files
| File | Purpose |
|---|---|
| `src/auth/autodesk.ts` | OAuth URL builder, code exchange, token refresh (pure HTTP) |
| `src/auth/autodeskTokenManager.ts` | Distributed lock + `getValidAccessToken()` |
| `src/db/autodesk.ts` | Prisma queries for tokens + links |
| `src/actions/autodesk.ts` | Server actions for link/unlink |
| `src/services/autodeskApi.ts` | ACC Data Management API client |
| `src/app/api/auth/autodesk/route.ts` | OAuth initiation |
| `src/app/api/auth/callback/autodesk/route.ts` | OAuth callback |
| `src/app/api/auth/autodesk/disconnect/route.ts` | Disconnect Autodesk |
| `src/app/api/acc/status/route.ts` | Connection status |
| `src/app/api/acc/hubs/route.ts` | List ACC hubs for linker step 1 |
| `src/app/api/acc/projects/route.ts` | List ACC projects within a hub for linker step 2 |
| `src/app/api/acc/files/route.ts` | File browser data |
| `src/app/api/acc/versions/route.ts` | Version history |
| `src/app/api/acc/unlock/route.ts` | Unlock file |
| `src/app/api/acc/translate/route.ts` | Start SVF2 translation |
| `src/app/api/acc/translate/status/route.ts` | Translation progress |
| `src/app/api/acc/viewer-token/route.ts` | Viewer access token |
| `src/components/AccProjectLinker.tsx` | ACC project linking drawer (with fuzzy name matching) |
| `src/components/admin/AccBulkLinker.tsx` | Admin bulk-link page for initial rollout |
| `src/app/admin/acc-linking/page.tsx` | Admin page route for bulk linker |
| `src/components/AccFileBrowser.tsx` | File browser + folder navigation |
| `src/components/AccFileVersions.tsx` | Version timeline drawer |
| `src/components/AccViewer.tsx` | Embedded Autodesk Viewer |
| `src/components/AccLockBadge.tsx` | Lock status badge + unlock |
| `src/app/styles/acc.css` | All ACC-related styles |

### Modified Files
| File | Change |
|---|---|
| `prisma/schema.prisma` | Add AutodeskToken, AccProjectLink models + relations |
| `src/app/projects/[projectId]/page.tsx` | Add AccFileBrowserSection between PropertyLookup and Comments |
| `src/app/styles/styles.css` | Add `@import "./acc.css"` |
| `src/components/ProjectHeroActions.tsx` | Add optional ACC project link dropdown to create/edit flow |
| `src/app/admin/page.tsx` | Add link to ACC bulk-linking page |
| `CLAUDE.md` | Document new models, routes, env vars, components |

---

## Verification

1. **Auth flow:** Connect Autodesk → verify token stored in DB → wait 60+ min → make API call → verify silent refresh → verify Redis lock prevents concurrent refresh
2. **15-day cliff:** Manually set `refreshExpiresAt` to past → verify token row deleted → verify file browser shows "Reconnect" prompt → reconnect → verify new tokens stored
3. **Project linking:** Link ACC project → reload page → verify file browser auto-loads → unlink → verify clean removal
4. **File browsing:** Navigate folders → verify breadcrumbs → hit a permission-gated folder → verify graceful empty state → verify Redis cache (second load instant) → click Refresh → verify fresh data
5. **Versions:** Open versions for a file → verify timeline displays → click "View" on an old version → verify it opens the correct version
6. **Locking:** Find a locked file → verify lock badge shows → click Unlock → verify badge clears
7. **Viewer:** Click "View" on a DWG → verify "Preparing..." state → verify viewer renders → close and reopen → verify instant load (cached URN)
8. **Broken link:** Revoke app access in ACC → reload project page → verify "no longer accessible" message with unlink option
9. **Rate limits:** Rapidly refresh file listings → verify 429 handling (retry + user-facing message)
10. **Build:** `npm run build` succeeds with no type errors (Prisma types regenerated)
