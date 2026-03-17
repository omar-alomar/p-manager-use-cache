# Mildenberg Project Platform — Claude Instructions

## Project Overview
Internal project management platform for the Mildenberg team. Tracks projects, tasks, clients, milestones, and team collaboration. Current version: **α 1.1.2** (tracked via `src/constants/version.ts`).

## Tech Stack
- **Framework**: Next.js 15 (canary `15.2.0-canary.56`), React 19, TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Cache/Sessions**: Redis (ioredis)
- **Auth**: Custom session-based + Microsoft OAuth (MSAL). No public signup — user accounts are created by admins only.
- **Validation**: Zod
- **Styling**: Plain CSS split into modular files under `src/app/styles/` — no Tailwind, no CSS Modules

## Project Structure
```
src/
├── actions/       # Next.js server actions ("use server") — all mutations go here
├── app/           # Next.js App Router pages and API routes
│   ├── api/       # API routes (notifications, auth/microsoft OAuth, users)
│   │   └── v1/   # REST API for mobile clients (see REST API section below)
│   ├── styles/    # Modular CSS files (see Design System section)
│   ├── changelog/ # Version changelog page
│   └── dashboard/ # Team workload dashboard
├── auth/          # Session management, password hashing, MSAL config, currentUser helper
├── components/    # React components (admin/, auth/, navigation/ subdirs)
├── constants/     # Shared constants — urgency.ts, version.ts (APP_VERSION, DISPLAY_VERSION)
├── contexts/      # React contexts (NotificationContext, TaskFilterContext)
├── db/            # Database query functions (projects, tasks, users, etc.)
├── hooks/         # Custom React hooks — useSessionSort, useNotifications
├── redis/         # Redis singleton (src/redis/redis.ts), maintenance mode
├── schemas/       # Zod validation schemas (taskSchema, projectSchema, milestoneSchema, clientSchema + parsers)
├── services/      # notificationService.ts
├── types/         # Shared TypeScript types — TaskWithRelations, ActionResult
└── utils/         # dateUtils, mentions, milestoneUtils, wait, revalidate, avatarColor
```

## Design System

### Color Palettes (`src/app/styles/tokens.css`)
Two brand color scales, plus zinc neutrals and semantic colors:

- **Indigo Primary** (`--primary-50` → `--primary-900`): Brand color for buttons, links, focus rings, badges, and interactive accents on **light surfaces**. Core value: `--primary-600: #4F46E5`.
- **Violet Accent** (`--violet-300` → `--violet-700`, including half-steps `--violet-350`, `--violet-450`): Companion purple for interactive states on **dark surfaces** (nav hover/active). More saturated purple than indigo. Core value: `--violet-500: #8B5CF6`.
- **Zinc Neutrals** (`--neutral-0` → `--neutral-900`): Warm grays for text, borders, surfaces.
- **Dark Surface** (`--dark-surface: #0C0A1D`): Deep indigo-tinted black for the nav bar.
- **Semantic Colors**: success (green), warning (amber), danger/error (red), urgency accents.

### CSS Architecture (`src/app/styles/`)
Styles are split into modular files imported via `styles.css`:
| File | Scope |
|---|---|
| `tokens.css` | Design tokens — all CSS custom properties |
| `base.css` | Reset, body, layout, container |
| `nav.css` | Top navigation bar (dark surface, violet accents) |
| `buttons.css` | Button variants |
| `badges.css` | Status/urgency badges |
| `cards.css` | Card components |
| `forms.css` | Form inputs, selects, client select, milestone fields |
| `modals.css` | Drawers (slide-over panels) and legacy modals |
| `hero.css` | Page hero sections, project details grid |
| `projects.css` | Project table, project-specific styles |
| `tasks.css` | Task lists, task items |
| `milestones.css` | Milestone chips and detail cards |
| `comments.css` | Comment list, comment form, mention autocomplete |
| `notifications.css` | Notification bell, center, toasts |
| `property.css` | Property lookup — search, result cards, drawings, environmental |
| `fab.css` | Floating action button |
| `admin.css` | Admin panel |
| `auth.css` | Login page, OAuth button |
| `profile.css` | User profile page |
| `skeleton.css` | Loading skeletons |
| `empty.css` | Empty state illustrations |
| `dashboard.css` | Team dashboard — KPI cards, filter bar, task sections |
| `changelog.css` | Changelog page and enchanted text effects |
| `utils.css` | Utility classes |

### UI Patterns
- **Drawers over modals**: All create/edit flows use slide-over drawers (`drawer-panel`, 580px, slides from right via `createPortal`). No modals. Nested drawers use `.drawer-nested` for z-index stacking.
- **Navigation**: Dark nav (`--dark-surface`) with white text. Hover turns `--violet-450`, active uses text underline in `--violet-500`. Active detection via `usePathname()`.
- **Inline editing**: Project detail fields use `InlineEditableField` for in-place edits.
- **Milestone color coding**: Date inputs shaded by urgency — `getMilestoneColorClass()` returns `milestone-urgent` (≤14 days), `milestone-warning` (≤30 days), `milestone-safe` (>30 days).
- **My Tasks resizable panels**: Three-column layout (`react-resizable-panels`) for In Progress / Completed / Assigned to others. Headers are color-tinted by category (warning/success/primary). Panels collapse when dragged below `MIN_SIZE` threshold or when the header is clicked (uses `panelRef.collapse()`/`expand()`). A reset icon in the filter bar restores default widths via `groupRef.setLayout()` and expands all collapsed panels. The `layoutDirty` flag tracks whether any panel has been resized.
- **Quick Add Task**: `QuickAddTaskModal` supports preset user/project for contextual task creation from dashboard, user detail, and client detail pages.
- **Team Dashboard**: KPI cards (active tasks, critical/high count, completion rate), filterable task list, upcoming milestones, and recent activity. Server component (`DashboardContent`) fetches data, client component (`DashboardClient`) handles interactivity.
- **Version Banner**: `VersionBanner` displays on first login after a version bump. Users are redirected to `/changelog` if they haven't seen the current version (`getPostLoginRedirect()`). Version is tracked per user via `lastSeenVersion` field.
- **Avatar Colors**: Hash-based consistent color assignment per user via `src/utils/avatarColor.ts` (8 color classes `avatar-color-0`–`avatar-color-7`).
- **Property Lookup**: Collapsible section on project detail pages. Searches Howard County property data by address, aggregating from three public APIs (MD Open Data SDAT, HC DataExplorer, HC GeoServer WFS) plus SDAT detail page scrape for authoritative owner/assessment data. Last searched address is saved to the project's `propertyAddress` field and auto-loaded on next visit. See `docs/PROPERTY-DATA-APIS.md` for API reference.

## Key Conventions

### Data Flow Pattern
1. **DB layer** (`src/db/`) — raw Prisma queries, tagged with `"use cache"` + `cacheTag()`
2. **Server actions** (`src/actions/`) — validate input, call DB layer, call `revalidatePath()` or `revalidateTag()`
3. **Components** — call server actions; never call DB layer directly from client components
4. **REST API** (`src/app/api/v1/`) — thin route handlers that validate input (Zod), call DB layer directly, return JSON. Used by mobile clients. See `docs/API.md` for full reference.

### Caching
- DB read functions use Next.js `"use cache"` directive with `cacheTag()` for granular invalidation
- Cache tags follow the pattern: `projects:all`, `projects:id=<id>`, `projects:userId=<id>`, `clients:all`, etc.
- After mutations, call `revalidateTag()` (in DB layer) **and** `revalidatePath()` (in server actions) to bust both
- DB **read** functions have no artificial delays. `src/utils/wait.ts` has been deleted.

### Task Creation — Raw SQL Workaround
`createTask()` in `src/db/tasks.ts` uses raw SQL (`prisma.$queryRaw`) instead of `prisma.task.create()`. This bypasses a PostgreSQL sequence bug where the auto-increment sequence falls behind the actual max ID. Do not change this back to `prisma.task.create()`.

### Authentication

#### User Provisioning
- **No public signup.** There is no `/signup` route. All user accounts are created by admins via the Admin panel (`/admin` → User Management → "New User").
- Microsoft OAuth also requires a pre-existing account — it matches the Microsoft email to an existing user, no auto-provisioning.
- The first admin account must be seeded directly in the database or created via Prisma Studio.

#### User Deletion & Reassignment
- **Users cannot be deleted without reassigning their assets.** Admins must select a target user to receive the deleted user's projects and tasks.
- Flow: Admin clicks delete → `UserDeleteDrawer` opens → shows impact (managed projects, project tasks, standalone uncompleted tasks) → admin selects reassignment target → confirm.
- **What gets reassigned:** All managed projects (with their tasks assigned to the deleted user), and all standalone uncompleted tasks.
- **What gets cascade-deleted:** Completed standalone tasks, mentions of the user, notifications for the user.
- **Comments are preserved:** `Comment.userId` is nullable with `onDelete: SetNull` — when a user is deleted, their comments remain with `userId = null` and display as "Deleted User" in the UI.
- DB functions: `getUserDeletionImpact()` and `deleteUserWithReassignment()` in `src/db/users.ts`. The reassignment + delete runs in a Prisma `$transaction`.
- REST API: `GET /api/v1/admin/users/:id` returns impact preview. `DELETE /api/v1/admin/users/:id?reassignTo=<userId>` performs the operation.

#### Session Auth (`src/auth/session.ts`)
- Sessions stored in Redis with 3-month expiry
- Session payload: `{ id: number, role: "user" | "admin" }`
- Cookie names are environment-specific to prevent prod/staging collisions:
  - Production: `prod-session-id` cookie
  - Staging: `staging-session-id` cookie
  - Development: `dev-session-id` cookie
- **Regular users**: Redis key prefix includes `APP_VERSION` (e.g. `prod:session:v1.1.2:<id>`) — version bump invalidates their sessions, forcing re-login
- **Admins**: Redis key prefix is version-less (e.g. `prod:session:admin:<id>`) — sessions survive version bumps so admins aren't locked out during deploys
- Session lookup checks the admin prefix first, then the versioned prefix
- Logout deletes from both prefixes
- Redis is optional — auth gracefully degrades if Redis is unavailable (session still set via cookie)
- **Bearer token support** (for mobile/REST API): The `/api/v1/` routes accept `Authorization: Bearer <sessionId>` as an alternative to cookies. The login endpoint returns the session token in the JSON response body. `getSessionByToken()` and `COOKIE_SESSION_KEY` are exported from `session.ts` for the API auth helper (`src/app/api/v1/_lib/auth.ts`). `createUserSession()` returns the session ID so callers can include it in API responses.

#### Microsoft OAuth (`src/auth/msal.ts`)
- Uses `@azure/msal-node` (`ConfidentialClientApplication`) for Azure AD OAuth
- Alternative to password login — both options available on the login page
- OAuth flow:
  1. `GET /api/auth/microsoft` — generates CSRF state cookie, redirects to Microsoft login
  2. Microsoft authenticates the user and redirects to `/api/auth/callback/microsoft`
  3. Callback exchanges the authorization code for tokens, extracts email from claims
  4. Email is matched (case-insensitive) to an existing user in the DB — no auto-provisioning
  5. Session is created via `createUserSession()` — identical to password login from this point
- If no matching user exists, redirects to `/login?error=no_account`
- All redirects in the callback use `APP_URL` env var as the base (not `request.url`) because inside Docker, `request.url` resolves to the container's internal address
- Each environment (prod/staging) needs its own Azure AD app registration with the correct redirect URI
- Azure client secret expires (max 24 months) — set a reminder to rotate

### Version Tracking
- `APP_VERSION` exported from `src/constants/version.ts` (currently `"1.1.2"`)
- `DISPLAY_VERSION` strips the patch number for display (e.g. `"1.1.2"` → `"1.1"`) — used in navbar and changelog badges
- `User.lastSeenVersion` field tracks which version each user has seen
- On login, `getPostLoginRedirect()` checks if user has seen the current version; if not, redirects to `/changelog`
- `markVersionSeen()` updates the user's `lastSeenVersion` after viewing changelog
- `VersionBanner` component in layout shows update notification until dismissed
- Admin panel shows and allows editing of each user's `lastSeenVersion`

### Real-time Notifications
- `NotificationService` (`src/services/notificationService.ts`) publishes via Redis Pub/Sub
- SSE endpoint at `/api/notifications/stream?userId=<id>` subscribes to `notifications:<userId>` channel
- Notifications are also stored in a Redis list `notifications:user:<userId>` (capped at 100)
- Four notification types: `task_assigned`, `task_completed`, `project_assigned`, `mention`
- Never notify a user about their own actions (assigner === assignee checks exist)

### @Mentions
- Parsed from comment bodies using `src/utils/mentions.ts`
- `parseMentions()` + `extractMentionedUsernames()` → `createMentions()` → `sendMentionNotification()`
- Stored in `Mention` and `Notification` DB models as well as Redis for real-time delivery
- `MentionedUser` component resolves @mentions to profile links via `/api/users/by-name` endpoint

## Environment Variables
```
DATABASE_URL          # PostgreSQL connection string (Prisma, pooled via pgbouncer)
DIRECT_URL            # PostgreSQL direct URL (Prisma for migrations, port 5432)
REDIS_URL             # Full Redis URL (preferred) — e.g. redis://:pass@host:6379/0
REDIS_HOST            # Fallback if no REDIS_URL
REDIS_PORT            # Fallback if no REDIS_URL
REDIS_PASSWORD        # Fallback if no REDIS_URL
SESSION_SECRET        # Session signing key
COOKIE_DOMAIN         # Optional: scope cookies to subdomain in prod/staging
APP_URL               # Base URL for OAuth redirects — e.g. https://projects.mba-eng.com
AZURE_CLIENT_ID       # Microsoft OAuth — from Azure AD app registration
AZURE_CLIENT_SECRET   # Microsoft OAuth — client secret (expires, max 24 months)
AZURE_TENANT_ID       # Microsoft OAuth — Azure AD tenant ID
SKIP_REDIS=1          # Set to skip Redis (e.g. in CI)
```

## Database Models Summary
| Model | Notable fields |
|---|---|
| `User` | id, email, name, password?, salt?, role (user\|admin), lastSeenVersion |
| `Project` | title, clientId, body, userId (manager), archived, milestone, mbaNumber, coFileNumbers, dldReviewer, propertyAddress |
| `Task` | title, completed, urgency (LOW\|MEDIUM\|HIGH\|CRITICAL), userId, assignedById, projectId, archived |
| `Client` | name, companyName, email, phone, address |
| `Milestone` | date, item, completed, projectId, apfo |
| `Comment` | body, userId? (nullable — null if author deleted), projectId?, taskId?, email |
| `Mention` | commentId, userId (unique per comment+user) |
| `Notification` | mentionId, userId, type, message, read |

## Scripts
```
npm run dev              # Start dev server
npm run build            # Production build
npm run fix-sequences    # Fix PostgreSQL ID sequences (scripts/fix-task-sequence.ts)
npm run check-sequences  # Check sequence health
npx prisma studio        # Browse DB
npx prisma db push       # Apply schema changes
npx prisma generate      # Regenerate Prisma client
```

## API Routes

### Web-only (used by Next.js frontend)
| Route | Method | Purpose |
|---|---|---|
| `/api/auth/microsoft` | GET | Initiate Microsoft OAuth flow — redirects to Microsoft login |
| `/api/auth/callback/microsoft` | GET | OAuth callback — exchanges code, creates session, redirects |
| `/api/notifications/stream` | GET | SSE endpoint for real-time notifications (`?userId=<id>`) |
| `/api/notifications/user/[userId]` | GET | Fetch stored notifications for a user |
| `/api/notifications/demo` | POST | Demo notification trigger |
| `/api/users/by-name` | GET | Resolve username to user ID (used by `MentionedUser` component) |
| `/api/property-lookup` | GET | Property data aggregator — queries SDAT, HC DataExplorer, HC GeoServer WFS, and scrapes SDAT detail page (`?address=<address>`) |

### REST API v1 (for mobile clients) — `src/app/api/v1/`
Full reference in `docs/API.md`. Summary of route groups:

| Group | Routes | Purpose |
|---|---|---|
| `/api/v1/auth/` | login, logout, me, password, version | Authentication & profile management |
| `/api/v1/projects/` | CRUD, field patch, archive, milestones | Project management |
| `/api/v1/tasks/` | CRUD, complete toggle | Task management with notifications |
| `/api/v1/clients/` | CRUD, field patch | Client management |
| `/api/v1/users/` | list, detail | User directory (read-only, no sensitive fields) |
| `/api/v1/comments/` | list, create, delete | Comments with @mention processing |
| `/api/v1/milestones/` | update, delete, complete toggle | Milestone management |
| `/api/v1/notifications/` | list, count, read, read-all | Notification management |
| `/api/v1/admin/` | stats, user CRUD, entity deletes, maintenance | Admin-only operations |

**Architecture:** Shared utilities in `src/app/api/v1/_lib/` — `auth.ts` (Bearer + cookie auth), `responses.ts` (consistent JSON format), `maintenance.ts` (503 guard), `pagination.ts` (API-level page slicing). All routes call existing `src/db/` functions directly — no duplicated business logic. List endpoints return paginated responses (`{ items, total, page, limit, hasMore }`) with default `page=1, limit=20` (max 100). Pagination is API-level only — DB functions and cache are untouched.

## App Pages
| Route | Description |
|---|---|
| `/projects` | Main project list with filtering, sorting, inline editing |
| `/projects/[projectId]` | Project detail with inline editable fields, milestones, comments |
| `/projects/new`, `/projects/[id]/edit` | Project create/edit forms |
| `/dashboard` | Team workload dashboard — KPIs, task list, milestones, activity |
| `/tasks`, `/tasks/[taskId]` | Task list and detail views |
| `/my-tasks` | Personal task view with resizable panels |
| `/clients`, `/clients/[clientId]` | Client list and detail |
| `/users`, `/users/[userId]` | User directory and profiles |
| `/admin` | System stats, user/project/task/client management, maintenance toggle |
| `/changelog` | Version changelog with feature highlights |
| `/login`, `/profile` | Auth and profile pages |

## Maintenance Mode
- Toggle via Redis key `maintenance:enabled` — no restart or redeploy needed
- **Admin UI**: Toggle switch at the top of `/admin` page (`MaintenanceToggle` component)
- **CLI**: `maintenance.sh on|off|status` script in project root; uses `REDIS_CMD` env var to target the right Redis container
  - Production: `./maintenance.sh off` (defaults to `docker exec stack-redis-1 redis-cli`)
  - Staging: `REDIS_CMD='docker exec stg-stack-redis-1 redis-cli' ./maintenance.sh off`
  - Redis requires auth: `docker exec stack-redis-1 redis-cli -a YOUR_PASSWORD DEL maintenance:enabled`
- **How it works**: Root layout (`src/app/layout.tsx`) calls `isMaintenanceMode()` on every request. If enabled, non-admin users see a static maintenance page. Admins bypass it and can still access the full site.
- **Deploy workflow**: `./maintenance.sh on` → deploy → `./maintenance.sh off`

## Deployment
- Docker-based deployment — config lives in separate folders:
  - Production: `~/stack` on the server
  - Staging: `~/stg-stack` on the server
- App source lives at `~/stg-projects-app` (this repo)
- Database hosted on Supabase (PostgreSQL)
- Redis runs as a Docker service alongside the app
- Each environment has its own `.env` with distinct DATABASE_URL, REDIS_URL, APP_URL, and Azure OAuth credentials

### REST API — Maintenance Checklist

The REST API (`src/app/api/v1/`) is a **third consumer** of the DB layer alongside server actions and components. When making changes, keep the following in mind:

#### Adding/removing a DB field
1. Prisma schema + `npx prisma db push`
2. `src/db/` — update query functions
3. `src/actions/` — update server actions (for web)
4. **`src/app/api/v1/`** — update the relevant route to accept/return the new field
5. `src/schemas/schemas.ts` — update Zod schema if the field needs validation (shared by web + API)
6. `docs/API.md` — document the new field
7. `USER_STORIES.md` section 19 — update the endpoint table if the contract changes

**The risk is forgetting step 4.** The web app and API can drift silently since there's no compile-time guarantee they stay in sync.

#### Sensitive fields
User routes manually strip `password` and `salt` via destructuring (`const { password, salt, ...sanitized } = user`). If you add a new sensitive field (e.g. 2FA secret), you must strip it in **every route** that returns user data — there is no centralized serializer:
- `GET /api/v1/users` and `GET /api/v1/users/:id`
- `GET /api/v1/admin/users` and `POST /api/v1/admin/users`
- `PUT /api/v1/admin/users/:id/role` and `PUT /api/v1/admin/users/:id/email`

#### API latency
DB read functions have no artificial delays. If you ever re-introduce delays in `src/db/`, be aware that API routes share the same DB functions and will inherit them.

#### Cache invalidation
API route mutations bust the cache via `revalidateTag()` (called inside `src/db/` functions). They do **not** call `revalidatePath()` — that only matters for server-rendered pages and is handled by server actions. This is intentional and correct.

#### No rate limiting
The REST API is a standard HTTP surface with no rate limiting. For now this is fine (internal team only), but add rate limiting at the reverse proxy (nginx) or middleware if the API is ever exposed more broadly.

#### Token lifecycle
- Bearer token = session ID. Same 3-month expiry, same version-invalidation for non-admins.
- Bumping `APP_VERSION` returns 401 for all mobile users — mobile app must handle this (re-login flow).
- No refresh tokens. Session expiry = user must re-enter credentials.
- Login returns token in plaintext JSON — mobile should store in secure storage (Keychain / EncryptedSharedPreferences).

#### Authorization checks are per-route
There's no centralized authorization middleware beyond `requireAuth()` / `requireAdmin()`. Resource-level checks (e.g. "only comment author or admin can delete") are inline in each route handler. When adding new mutation endpoints, add authorization checks explicitly.

### Property Lookup (`src/app/api/property-lookup/route.ts` + `src/components/PropertyLookup.tsx`)
Embedded in each project detail page. Searches Howard County property records by address.

**Data pipeline (3 phases, parallelized):**
1. **Phase 1** (parallel): MD Open Data SDAT API (property data) + HC DataExplorer `SearchAddresses` (State Plane coordinates)
2. **Phase 2** (parallel): SDAT detail page scrape (authoritative owner, mailing address, assessment, quality, renovation) + HC DataExplorer `QueryPropertyByTaxID` (plat number)
3. **Phase 3** (parallel): HC GeoServer WFS spatial queries (floodplain, soils, forest conservation easements, scanned drawings) + HC DataExplorer `QueryScannedDrawingsByNumber` (plat-based drawing search)

**Data accuracy strategy:**
- **Owner name & assessment values**: Scraped from the SDAT detail page HTML (`sdat.dat.maryland.gov`), NOT from the Open Data API or HC DataExplorer. The API can lag behind recent transfers by months; the SDAT page is authoritative.
- **Stable fields** (year built, sq ft, zoning, deed refs, sales history, etc.): From the SDAT Open Data API — validated to match the detail page across 14 properties.
- **Owner Occupancy**: The API returns single-letter codes (`H`=homeowner, `N`=non-owner, `D`=homeowner/estate). We display the SDAT page's "Principal Residence: YES/NO" instead — clearer and authoritative. The raw API code is not shown.
- **Quality/Grade**: The API returns a residential grading scale (e.g., "Average (4)") even for commercial properties. The SDAT page returns the actual quality code with a `C` prefix for commercial (e.g., "C4"). We combine both: `C4 — Average (4)` so the commercial distinction is visible.
- **Environmental data**: From HC GeoServer WFS spatial intersection queries using coordinates from HC DataExplorer.
- **Scanned drawings**: WFS `Scanned_Drawings_Public` spatial query + HC DataExplorer plat number search. PDF URLs from HC DataExplorer are HTML-encoded anchor tags that require decoding.

**Address parsing:** Strips city/state/zip after commas, removes suite/unit suffixes, strips street type suffixes (ST, DR, etc.), zero-pads street numbers to 5 digits for SDAT.

**Persistence:** Last searched address saved to `Project.propertyAddress` field. Auto-loads and auto-searches on page visit if saved address exists.

**HC Interactive Map link quirk:** The HC Interactive Map has a bug where `Lat` and `Long` URL params are internally swapped (`mylat` variable holds longitude). We pass longitude as `Lat` and latitude as `Long` to compensate.

**External API reference:** `docs/PROPERTY-DATA-APIS.md` — comprehensive field reference for all three APIs.

## Known Issues / Quirks
- `docker-compose.yml` does not exist here — deployment config lives in a separate folder (`stack` for prod, `stg-stack` for staging)
- `src/utils/wait.ts` has been deleted. DB read functions no longer have artificial delays (previously 500ms for loading skeleton UX)
- Zod v4 is used — `required_error` param no longer exists; use `error:` instead (e.g. `z.number({ error: "Required" })`)
- Zod v4 uses `.issues` not `.errors` on `ZodError` — the API routes use `parsed.error.issues`
- `EnchantedText` component (`src/components/EnchantedText.tsx`) is a decorative Minecraft enchanting table-style terminal effect used on the changelog page — purely cosmetic, uses Unicode glyphs (SGA, Elder Futhark, Katakana)
- Task archiving: tasks completed for more than 30 days are automatically archived
- Milestones can be flagged as APFOs via the `apfo` field
