# Mildenberg Project Platform

Internal project management platform for the Mildenberg team. Tracks projects, tasks, clients, milestones, and team collaboration.

**Current version:** α 1.1.2

## Tech Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Database:** PostgreSQL via Prisma ORM
- **Cache/Sessions:** Redis (ioredis)
- **Auth:** Session-based (email/password) + Microsoft OAuth (MSAL)
- **Validation:** Zod v4
- **Styling:** Plain CSS — modular files under `src/app/styles/`, no Tailwind, no CSS Modules
- **Deployment:** Docker (standalone output), separate stack repos for prod and staging

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance (optional — auth degrades gracefully without it)

### Setup

```bash
# Install dependencies
npm install

# Create .env (see Environment Variables section below)

# Generate Prisma client and apply schema
npx prisma generate
npx prisma db push

# Start dev server
npm run dev
```

### Creating the First Admin

**There is no public signup.** All user accounts are created by admins via the Admin panel (`/admin`).

To bootstrap the first admin account, use Prisma Studio:

```bash
npx prisma studio
```

Create a user record with `role: admin`. Set a password and salt using the app's hashing utilities, or use Microsoft OAuth (the account just needs to exist with the matching email).

After that, log in as admin and create all other user accounts from `/admin`.

## Authentication

Two login methods — both require a pre-existing account:

1. **Email/password** — credentials set by an admin when creating the account
2. **Microsoft OAuth** — matches Microsoft email (case-insensitive) to an existing account. No auto-provisioning.

### Sessions

- Stored in Redis with 3-month expiry
- Cookie names are environment-specific: `prod-session-id`, `staging-session-id`, `dev-session-id`
- Redis key prefixes are also environment-specific (prod/staging/dev use separate Redis DBs: 0/1/2)
- Regular user sessions are invalidated on app version bumps (forces re-login)
- Admin sessions survive version bumps so admins aren't locked out during deploys
- **Mobile/API auth:** The `/api/v1/auth/login` endpoint returns the session token in the response body. Mobile clients store it and send `Authorization: Bearer <token>` on all requests.

## Features

### Projects
- Project list with search, sort, filter by manager, archived toggle
- Inline editing: MBA #, Co File #'s, DLD Reviewer, Overview
- Milestone tracking with urgency color-coding (red ≤14d, amber ≤30d, green >30d)
- APFO flag on milestones
- Swipe-to-archive gesture on project rows
- Project detail with milestones, tasks, task progress ring, comments, property lookup
- **Property Lookup** — enter a Howard County address on any project page to pull owner, zoning, building data, deed refs, assessment, sales history, scanned drawings, floodplain, soils, and forest conservation easements from public APIs (SDAT, HC DataExplorer, HC GeoServer WFS). Last searched address is saved per project.

### Tasks
- CRUD with urgency levels (Low/Medium/High/Critical)
- Quick-add task via floating action button (contextual pre-fill from dashboard or project)
- Inline editing from list view
- Auto-archive after 30 days of completion
- "Assigned By" tracking on all tasks

### My Tasks
- Three resizable panels: In Progress / Completed / Assigned to Others
- Collapsible panels (click header), reset layout button, archive toggle
- Full search/filter/sort within personal view

### Team Dashboard
- KPI cards: active tasks, urgent count (Critical + High), completion rate
- Team board — one column per user, sorted by busiest first
- Workload indicator per user (green ≤3, yellow ≤6, red >6 tasks)
- Upcoming milestones across all projects
- Recent activity feed (last 20 updated tasks)
- Quick-add task per team member

### Clients
- Client list with search, sort, inline editing (company, address)
- Client detail with associated projects (active/archived toggle)
- Tappable email (mailto) and phone (tel) links

### Comments & @Mentions
- Comments on projects and tasks (1–1000 chars)
- @mention autocomplete with keyboard navigation
- Mentioned users receive real-time notifications
- Mentions render as clickable profile links

### Notifications
- Real-time via Server-Sent Events (SSE) + Redis Pub/Sub
- Three types: `task_assigned`, `task_completed`, `mention`
- Notification bell with unread count (polls every 30s)
- Notification center dropdown with mark-as-read, clear all
- Toast notifications (max 5 visible, auto-dismiss 5s)
- Self-action suppression (no notifications for your own actions)
- Server-side storage: up to 100 per user in Redis

### Admin Panel
- System stats (users, projects, tasks, clients, completion counts)
- User management: create, edit email/password/role/lastSeenVersion, delete
- Project/task/client management with admin-level actions
- Maintenance mode toggle

### Version Tracking
- Version banner appears on first login after an app update
- Changelog page at `/changelog` with release notes
- Per-user `lastSeenVersion` field — admin-editable
- Post-login redirect to changelog if version unseen

## Pages

| Route | Description |
|---|---|
| `/projects` | Project list — search, sort, filter, inline editing |
| `/projects/[id]` | Project detail — milestones, tasks, comments, inline fields, property lookup |
| `/projects/new` | Create project |
| `/projects/[id]/edit` | Edit project |
| `/dashboard` | Team workload — KPIs, task board, milestones, activity |
| `/tasks`, `/tasks/[id]` | Task list and detail |
| `/tasks/[id]/edit` | Edit task |
| `/my-tasks` | Personal tasks — resizable three-panel layout |
| `/clients`, `/clients/[id]` | Client list and detail |
| `/clients/new`, `/clients/[id]/edit` | Client create/edit |
| `/users`, `/users/[id]` | Team directory and user profiles |
| `/admin` | Admin — stats, management, maintenance toggle |
| `/changelog` | Version changelog |
| `/login` | Login (email/password + Microsoft OAuth) |
| `/profile` | Current user profile and password change |

## API Routes

### Web-only

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/microsoft` | GET | Initiate Microsoft OAuth flow |
| `/api/auth/callback/microsoft` | GET | OAuth callback — exchange code, create session |
| `/api/notifications/stream` | GET | SSE real-time notifications (`?userId=<id>`) |
| `/api/notifications/user/[userId]` | GET/DELETE | Fetch or delete stored notifications |
| `/api/notifications/demo` | POST | Demo notification trigger |
| `/api/users/by-name` | GET | Resolve username to user ID |
| `/api/property-lookup` | GET | Aggregate Howard County property data (`?address=<address>`) |

### REST API v1 (for mobile clients)

Full REST API at `/api/v1/` for mobile app consumption. Accepts `Authorization: Bearer <token>` or session cookie. List endpoints return paginated responses (`page` + `limit` query params, default 20 items per page).

| Group | Endpoints | Description |
|---|---|---|
| `/api/v1/auth/` | login, logout, me, password, version | Auth & profile |
| `/api/v1/projects/` | CRUD, field patch, archive, milestones | Project management |
| `/api/v1/tasks/` | CRUD, complete toggle | Tasks with notifications |
| `/api/v1/clients/` | CRUD, field patch | Client management |
| `/api/v1/users/` | list, detail | Team directory (read-only) |
| `/api/v1/comments/` | list, create, delete | Comments with @mention support |
| `/api/v1/milestones/` | update, delete, complete | Milestone management |
| `/api/v1/notifications/` | list, count, read, read-all | Notification management |
| `/api/v1/admin/` | stats, users, entity deletes, maintenance | Admin-only |

Full reference with request/response examples: [`docs/API.md`](docs/API.md)

## Scripts

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run fix-sequences    # Fix PostgreSQL ID sequences
npm run check-sequences  # Check sequence health
npx prisma studio        # Browse database
npx prisma db push       # Apply schema changes
npx prisma generate      # Regenerate Prisma client
```

## Project Structure

```
src/
├── actions/       # Server actions — all mutations ("use server")
├── app/           # App Router pages, API routes, styles
│   ├── api/       # REST endpoints (notifications, OAuth, users)
│   │   └── v1/   # REST API for mobile clients — see docs/API.md
│   └── styles/    # Modular CSS files (tokens, base, nav, forms, etc.)
├── auth/          # Session management, password hashing, MSAL config
├── components/    # React components (admin/, auth/, navigation/)
├── constants/     # Urgency levels, version tracking
├── contexts/      # NotificationContext, TaskFilterContext
├── db/            # Prisma query functions (cached with "use cache" + cacheTag)
├── hooks/         # useSessionSort, useNotifications
├── redis/         # Redis singleton, maintenance mode
├── schemas/       # Zod validation schemas
├── services/      # Notification service (Redis Pub/Sub)
├── types/         # Shared TypeScript types (TaskWithRelations, ActionResult)
└── utils/         # Date formatting, mentions, milestones, avatarColor, revalidate
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (pooled via pgbouncer) |
| `DIRECT_URL` | PostgreSQL direct URL (Prisma migrations, port 5432) |
| `REDIS_URL` | Full Redis URL (preferred) — e.g. `redis://:pass@host:6379/0` |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Fallback if no `REDIS_URL` |
| `SESSION_SECRET` | Session signing key |
| `COOKIE_DOMAIN` | Optional — scope cookies to subdomain in prod/staging |
| `APP_URL` | Base URL for OAuth redirects — e.g. `https://projects.mba-eng.com` |
| `AZURE_CLIENT_ID` | Microsoft OAuth — from Azure AD app registration |
| `AZURE_CLIENT_SECRET` | Microsoft OAuth — client secret (expires, max 24 months) |
| `AZURE_TENANT_ID` | Microsoft OAuth — Azure AD tenant ID |
| `SKIP_REDIS` | Set to `1` to skip Redis (e.g. in CI) |

## Deployment

Docker-based deployment with separate configs per environment:

| | Production | Staging |
|---|---|---|
| **Config** | `~/stack` | `~/stg-stack` |
| **Redis DB** | 0 | 1 |
| **Cookie** | `prod-session-id` | `staging-session-id` |

App source lives at `~/stg-projects-app` (this repo). Database hosted on Supabase. Redis runs as a Docker service alongside the app. Each environment has its own `.env`.

### Maintenance Mode

Toggle before deployments — no restart needed:

```bash
./maintenance.sh on       # Enable — non-admin users see maintenance page
./maintenance.sh off      # Disable — site goes live
./maintenance.sh status   # Check current state

# Target staging Redis
REDIS_CMD='docker exec stg-stack-redis-1 redis-cli' ./maintenance.sh on
```

Or toggle from the admin UI at `/admin`.

**Deploy workflow:** `./maintenance.sh on` → deploy → `./maintenance.sh off`
