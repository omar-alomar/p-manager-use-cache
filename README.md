# Mildenberg Project Platform

Internal project management platform for the Mildenberg team. Tracks projects, tasks, clients, milestones, and team collaboration.

**Version:** α 1.1

## Tech Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Database:** PostgreSQL via Prisma ORM
- **Cache / Sessions:** Redis (ioredis)
- **Validation:** Zod v4
- **Styling:** Plain CSS — modular files under `src/app/styles/`, no Tailwind, no CSS Modules
- **Deployment:** Docker (standalone output), separate stack repos for prod and staging

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis

### Setup

```bash
npm install
```

Create a `.env` file:

```
DATABASE_URL=postgresql://user:pass@localhost:5432/mildenberg
DIRECT_URL=postgresql://user:pass@localhost:5432/mildenberg
REDIS_URL=redis://localhost:6379/2
SESSION_SECRET=your-secret-here
```

Set up the database and start the dev server:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

### Scripts

```
npm run dev              # Dev server
npm run build            # Production build
npm run fix-sequences    # Fix PostgreSQL ID sequences
npm run check-sequences  # Check sequence health
npx prisma studio        # Browse DB
npx prisma db push       # Apply schema changes
npx prisma generate      # Regenerate Prisma client
```

## Project Structure

```
src/
├── actions/       # Server actions — all mutations
├── app/           # App Router pages, API routes, styles
├── auth/          # Session management, password hashing
├── components/    # React components (admin/, auth/, navigation/)
├── constants/     # Shared constants (version, urgency)
├── contexts/      # React contexts (notifications, task filters)
├── db/            # Database query functions (Prisma)
├── hooks/         # Custom hooks
├── redis/         # Redis singleton + maintenance mode
├── schemas/       # Zod validation schemas
├── services/      # Notification service
├── types/         # Shared TypeScript types
└── utils/         # Date utils, mentions, milestones, avatarColor
```

## Pages

| Route | Description |
|---|---|
| `/projects` | Project list — search, sort, filter, inline editing |
| `/projects/[id]` | Project detail — milestones, comments, inline fields |
| `/projects/new` | Create project |
| `/dashboard` | Team workload — KPIs, task list, milestones, activity |
| `/tasks` | All tasks |
| `/my-tasks` | Personal tasks — resizable three-panel layout |
| `/clients` | Client list |
| `/clients/[id]` | Client detail |
| `/users` | Team directory |
| `/users/[id]` | User profile |
| `/admin` | Admin — stats, user/project/task/client management, maintenance toggle |
| `/changelog` | Version changelog |
| `/login`, `/signup` | Auth |
| `/profile` | Current user profile |

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/notifications/stream` | GET | SSE real-time notifications |
| `/api/notifications/user/[userId]` | GET | Stored notifications |
| `/api/users/by-name` | GET | Resolve username to user ID |

## Key Features

**Projects & Tasks** — Create and manage projects with clients, milestones, urgency levels, and task assignments. Tasks support LOW/MEDIUM/HIGH/CRITICAL urgency. Inline editing on project detail pages.

**Real-time Notifications** — Redis Pub/Sub powers SSE-based notifications for task assignments, completions, and @mentions in comments.

**Team Dashboard** — KPI cards, filterable task lists, upcoming milestones, and recent activity across the team.

**Maintenance Mode** — Toggle via the admin UI or CLI (`./maintenance.sh on|off`). Uses a Redis key so no restart is needed. Admins bypass the maintenance page and can still access the full site.

**Session Auth** — Redis-backed sessions with environment-specific cookies and key prefixes (prod/staging/dev use separate Redis DBs). Sessions auto-invalidate on version bumps.

**Version Tracking** — Users see a version banner after updates and get redirected to the changelog on first login after a version bump.

## Maintenance Mode

Toggle the site into maintenance mode before deployments:

```bash
# From your stack server
./maintenance.sh on       # Enable — users see maintenance page
./maintenance.sh off      # Disable — site goes live
./maintenance.sh status   # Check current state

# Target a specific Redis container
REDIS_CMD='docker exec stg-stack-redis-1 redis-cli' ./maintenance.sh on
```

Or toggle from the admin UI at `/admin`.

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_URL` | PostgreSQL direct URL (Prisma migrations) |
| `REDIS_URL` | Full Redis URL (preferred) |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Fallback if no `REDIS_URL` |
| `SESSION_SECRET` | Session signing key |
| `COOKIE_DOMAIN` | Optional — scope cookies to subdomain |
| `SKIP_REDIS` | Set to `1` to skip Redis (CI builds) |

## Deployment

The app builds as a standalone Next.js output (`output: "standalone"` in `next.config.ts`). Docker deployment configs live in separate repos:

- **Production:** `stack` folder
- **Staging:** `stg-stack` folder

Both share the same Git remote as this repo. Redis DBs are isolated per environment (prod=0, staging=1, dev=2).
