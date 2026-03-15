# Mildenberg Project Platform

Internal project management platform for the Mildenberg team. Tracks projects, tasks, clients, milestones, and team collaboration.

**Current version**: α 1.1

## Tech Stack

- **Framework**: Next.js 15, React 19, TypeScript
- **Database**: PostgreSQL via Prisma ORM (hosted on Supabase)
- **Cache/Sessions**: Redis (ioredis)
- **Auth**: Session-based (Redis) + Microsoft OAuth (Azure AD / MSAL)
- **Validation**: Zod
- **Styling**: Plain CSS (modular files under `src/app/styles/`)
- **Deployment**: Docker

## Features

- **Project management** — create, edit, archive projects with inline editing, milestones, and comments
- **Task tracking** — assign tasks with urgency levels (LOW/MEDIUM/HIGH/CRITICAL), track completion
- **Milestone tracking** — date-based milestones with urgency color coding and APFO flags
- **Client management** — track client details linked to projects
- **Team dashboard** — KPI cards, task overview, upcoming milestones, recent activity
- **My Tasks** — resizable three-panel layout for personal task management
- **Real-time notifications** — SSE-based notifications for task assignments, completions, and @mentions
- **@Mentions** — mention users in comments with autocomplete
- **Admin panel** — system stats, user/project/task/client management, maintenance mode toggle
- **Microsoft OAuth** — sign in with Microsoft as an alternative to password login
- **Version tracking** — changelog with version banner, automatic redirect on version bump
- **Task archiving** — tasks completed for 30+ days are automatically archived
- **Maintenance mode** — toggle via admin UI or CLI, non-admin users see a maintenance page

## Authentication

Two login methods available:

### Password Login
Traditional email/password authentication. Passwords are hashed with salt.

### Microsoft OAuth
"Sign in with Microsoft" button on the login page. Uses Azure AD OAuth (MSAL). Users must be pre-created by an admin — the OAuth callback matches the Microsoft email to an existing user. No auto-provisioning.

### Sessions
- Stored in Redis with 3-month expiry
- Environment-specific cookie names and Redis key prefixes (prod/staging/dev never collide)
- **Regular users**: sessions are invalidated on version bumps (forces re-login to see new features)
- **Admins**: sessions survive version bumps (version-less Redis key prefix)

## Environment Variables

```
# Database
DATABASE_URL          # PostgreSQL connection string (pooled via pgbouncer)
DIRECT_URL            # PostgreSQL direct URL (for migrations)

# Redis
REDIS_URL             # Full Redis URL — e.g. redis://:pass@host:6379/0
REDIS_PASSWORD        # Used if REDIS_URL not set

# Auth
SESSION_SECRET        # Session signing key
COOKIE_DOMAIN         # Optional: scope cookies to subdomain

# Microsoft OAuth
APP_URL               # Base URL — e.g. https://projects.mba-eng.com
AZURE_CLIENT_ID       # From Azure AD app registration
AZURE_CLIENT_SECRET   # Client secret (expires, max 24 months)
AZURE_TENANT_ID       # Azure AD tenant ID

# Optional
SKIP_REDIS=1          # Skip Redis (e.g. in CI)
```

## Project Structure

```
src/
├── actions/       # Server actions — all mutations
├── app/           # Next.js App Router pages and API routes
│   ├── api/       # API routes (auth/microsoft, notifications, users)
│   └── styles/    # Modular CSS files
├── auth/          # Session management, password hashing, MSAL config
├── components/    # React components (admin/, auth/, navigation/)
├── constants/     # version.ts, urgency.ts
├── contexts/      # NotificationContext, TaskFilterContext
├── db/            # Prisma query functions
├── hooks/         # Custom React hooks
├── redis/         # Redis singleton, maintenance mode
├── schemas/       # Zod validation schemas
├── services/      # Notification service
├── types/         # Shared TypeScript types
└── utils/         # Utilities (dates, mentions, avatarColor, etc.)
```

## Scripts

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run fix-sequences    # Fix PostgreSQL ID sequences
npm run check-sequences  # Check sequence health
npx prisma studio        # Browse DB
npx prisma db push       # Apply schema changes
npx prisma generate      # Regenerate Prisma client
```

## Deployment

Docker-based. Config lives in separate folders on the server:
- Production: `~/stack`
- Staging: `~/stg-stack`

Each environment has its own `.env`, Redis instance, Azure AD app registration, and Supabase database.

### Maintenance Mode

```bash
# Production
./maintenance.sh on      # Enable
./maintenance.sh off     # Disable
./maintenance.sh status  # Check

# Staging
REDIS_CMD='docker exec stg-stack-redis-1 redis-cli' ./maintenance.sh off

# If Redis requires auth
docker exec stack-redis-1 redis-cli -a YOUR_PASSWORD DEL maintenance:enabled
```

Admins can also toggle maintenance mode from the admin panel UI.

## Database Models

| Model | Purpose |
|---|---|
| `User` | Accounts, roles (user/admin), lastSeenVersion |
| `Project` | Projects with client, manager, milestones, archive status |
| `Task` | Tasks with urgency, assignment, completion, archiving |
| `Client` | Client contact info linked to projects |
| `Milestone` | Date-based milestones with APFO flag |
| `Comment` | Comments on projects and tasks |
| `Mention` | @mention records linked to comments |
| `Notification` | In-app notifications (task_assigned, task_completed, mention) |
