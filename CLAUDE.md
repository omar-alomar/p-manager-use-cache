# Mildenberg Project Platform — Claude Instructions

## Project Overview
Internal project management platform for the Mildenberg team. Tracks projects, tasks, clients, milestones, and team collaboration. Current version: **α 1.1** (tracked via `src/constants/version.ts`).

## Tech Stack
- **Framework**: Next.js 15 (canary `15.2.0-canary.56`), React 19, TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Cache/Sessions**: Redis (ioredis)
- **Validation**: Zod
- **Styling**: Plain CSS split into modular files under `src/app/styles/` — no Tailwind, no CSS Modules

## Project Structure
```
src/
├── actions/       # Next.js server actions ("use server") — all mutations go here
├── app/           # Next.js App Router pages and API routes
│   ├── styles/    # Modular CSS files (see Design System section)
│   ├── changelog/ # Version changelog page
│   └── dashboard/ # Team workload dashboard
├── auth/          # Session management, password hashing, currentUser helper
├── components/    # React components (admin/, auth/, navigation/ subdirs)
├── constants/     # Shared constants — urgency.ts, version.ts (APP_VERSION)
├── contexts/      # React contexts (NotificationContext, TaskFilterContext)
├── db/            # Database query functions (projects, tasks, users, etc.)
├── hooks/         # Custom React hooks — useSessionSort, useNotifications
├── redis/         # Redis singleton (src/redis/redis.ts)
├── schemas/       # Zod validation schemas (taskSchema, projectSchema, milestoneSchema + parsers)
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
| `fab.css` | Floating action button |
| `admin.css` | Admin panel |
| `auth.css` | Login/signup pages |
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

## Key Conventions

### Data Flow Pattern
1. **DB layer** (`src/db/`) — raw Prisma queries, tagged with `"use cache"` + `cacheTag()`
2. **Server actions** (`src/actions/`) — validate input, call DB layer, call `revalidatePath()` or `revalidateTag()`
3. **Components** — call server actions; never call DB layer directly from client components

### Caching
- DB read functions use Next.js `"use cache"` directive with `cacheTag()` for granular invalidation
- Cache tags follow the pattern: `projects:all`, `projects:id=<id>`, `projects:userId=<id>`, `clients:all`, etc.
- After mutations, call `revalidateTag()` (in DB layer) **and** `revalidatePath()` (in server actions) to bust both
- DB **read** functions include a `wait(500)` artificial delay (for loading state UX) — imported from `src/utils/wait.ts`. Mutation functions do NOT wait.

### Task Creation — Raw SQL Workaround
`createTask()` in `src/db/tasks.ts` uses raw SQL (`prisma.$queryRaw`) instead of `prisma.task.create()`. This bypasses a PostgreSQL sequence bug where the auto-increment sequence falls behind the actual max ID. Do not change this back to `prisma.task.create()`.

### Session Auth
- Sessions stored in Redis with 3-month expiry
- Cookie names and Redis key prefixes are environment-specific to prevent prod/staging collisions:
  - Production: `prod-session-id` cookie, `prod:session` Redis prefix, DB 0
  - Staging: `staging-session-id` cookie, `staging:session` Redis prefix, DB 1
  - Development: `dev-session-id` cookie, `dev:session` Redis prefix, DB 2
- Redis key prefix includes `APP_VERSION` — sessions are automatically invalidated on version bumps
- Redis is optional — auth gracefully degrades if Redis is unavailable (session still set via cookie)

### Version Tracking
- `APP_VERSION` exported from `src/constants/version.ts` (currently `"1.1"`)
- `User.lastSeenVersion` field tracks which version each user has seen
- On login, `getPostLoginRedirect()` checks if user has seen the current version; if not, redirects to `/changelog`
- `markVersionSeen()` updates the user's `lastSeenVersion` after viewing changelog
- `VersionBanner` component in layout shows update notification until dismissed
- `clearInvalidSession()` handles stale sessions after version bumps

### Real-time Notifications
- `NotificationService` (`src/services/notificationService.ts`) publishes via Redis Pub/Sub
- SSE endpoint at `/api/notifications/stream?userId=<id>` subscribes to `notifications:<userId>` channel
- Notifications are also stored in a Redis list `notifications:user:<userId>` (capped at 100)
- Three notification types: `task_assigned`, `task_completed`, `mention`
- Never notify a user about their own actions (assigner === assignee checks exist)

### @Mentions
- Parsed from comment bodies using `src/utils/mentions.ts`
- `parseMentions()` + `extractMentionedUsernames()` → `createMentions()` → `sendMentionNotification()`
- Stored in `Mention` and `Notification` DB models as well as Redis for real-time delivery
- `MentionedUser` component resolves @mentions to profile links via `/api/users/by-name` endpoint

## Environment Variables
```
DATABASE_URL        # PostgreSQL connection string (Prisma)
DIRECT_URL          # PostgreSQL direct URL (Prisma for migrations)
REDIS_URL           # Full Redis URL (preferred) — e.g. redis://:pass@host:6379/0
REDIS_HOST          # Fallback if no REDIS_URL
REDIS_PORT          # Fallback if no REDIS_URL
REDIS_PASSWORD      # Fallback if no REDIS_URL
SESSION_SECRET      # Session signing key
COOKIE_DOMAIN       # Optional: scope cookies to subdomain in prod/staging
SKIP_REDIS=1        # Set to skip Redis (e.g. in CI)
```

## Database Models Summary
| Model | Notable fields |
|---|---|
| `User` | id, email, name, password, salt, role (user\|admin), lastSeenVersion |
| `Project` | title, clientId, body, userId (manager), archived, milestone, mbaNumber, coFileNumbers, dldReviewer |
| `Task` | title, completed, urgency (LOW\|MEDIUM\|HIGH\|CRITICAL), userId, assignedById, projectId |
| `Client` | name, companyName, email, phone, address |
| `Milestone` | date, item, completed, projectId |
| `Comment` | body, userId, projectId?, taskId?, email |
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
| Route | Method | Purpose |
|---|---|---|
| `/api/notifications/stream` | GET | SSE endpoint for real-time notifications (`?userId=<id>`) |
| `/api/notifications/user/[userId]` | GET | Fetch stored notifications for a user |
| `/api/notifications/demo` | POST | Demo notification trigger |
| `/api/users/by-name` | GET | Resolve username to user ID (used by `MentionedUser` component) |
| `/api/test-notifications` | POST | Test notification endpoint |

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
| `/admin` | System stats + manage users/projects/tasks/clients |
| `/changelog` | Version changelog with feature highlights |
| `/login`, `/signup`, `/profile` | Auth and profile pages |

## Maintenance Mode
- Toggle via Redis key `maintenance:enabled` — no restart or redeploy needed
- **Admin UI**: Toggle switch at the top of `/admin` page (`MaintenanceToggle` component)
- **CLI**: `maintenance.sh on|off|status` script in project root; uses `REDIS_CMD` env var to target the right Redis container
- **How it works**: Root layout (`src/app/layout.tsx`) calls `isMaintenanceMode()` on every request. If enabled, non-admin users see a static maintenance page. Admins bypass it and can still access the full site.
- **Redis functions**: `src/redis/maintenance.ts` — `isMaintenanceMode()` / `setMaintenanceMode(enabled)`
- **Server actions**: `getMaintenanceStatusAction()` and `toggleMaintenanceAction(enabled)` in `src/actions/admin.ts`
- **Deploy workflow**: `./maintenance.sh on` → deploy → `./maintenance.sh off`

## Known Issues / Quirks
- `docker-compose.yml` does not exist here — deployment config lives in a separate folder (`stack` for prod, `stg-stack` for staging)
- `@azure/msal-node` is installed for future Azure AD auth (not yet implemented)
- The `wait(500)` calls in DB functions are intentional artificial delays for loading UX
- Zod v4 is used — `required_error` param no longer exists; use `error:` instead (e.g. `z.number({ error: "Required" })`)
- `EnchantedText` component (`src/components/EnchantedText.tsx`) is a decorative Minecraft enchanting table-style terminal effect used on the changelog page — purely cosmetic, uses Unicode glyphs (SGA, Elder Futhark, Katakana)
