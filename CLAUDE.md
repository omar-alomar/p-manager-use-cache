# Mildenberg Project Platform — Claude Instructions

## Project Overview
Internal project management platform for the Mildenberg team. Tracks projects, tasks, clients, milestones, and team collaboration.

## Tech Stack
- **Framework**: Next.js 15 (canary `15.2.0-canary.56`), React 19, TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Cache/Sessions**: Redis (ioredis)
- **Validation**: Zod
- **Styling**: Plain CSS (`src/app/styles.css`) — no Tailwind, no CSS Modules

## Project Structure
```
src/
├── actions/       # Next.js server actions ("use server") — all mutations go here
├── app/           # Next.js App Router pages and API routes
├── auth/          # Session management, password hashing, currentUser helper
├── components/    # React components (admin/, auth/, navigation/ subdirs)
├── constants/     # Shared constants — urgency.ts (URGENCY_OPTIONS, URGENCY_SELECT_OPTIONS, URGENCY_ORDER)
├── contexts/      # React contexts (NotificationContext, TaskFilterContext)
├── db/            # Database query functions (projects, tasks, users, etc.)
├── hooks/         # Custom React hooks — useSessionSort, useNotifications
├── redis/         # Redis singleton (src/redis/redis.ts)
├── schemas/       # Zod validation schemas (taskSchema, projectSchema, milestoneSchema + parsers)
├── services/      # notificationService.ts
├── types/         # Shared TypeScript types — TaskWithRelations, ActionResult
└── utils/         # dateUtils, mentions, milestoneUtils, wait, revalidate
```

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
- Redis is optional — auth gracefully degrades if Redis is unavailable (session still set via cookie)

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
| `User` | id, email, name, password, salt, role (user\|admin) |
| `Project` | title, clientId, body, userId (manager), archived, milestone, mbaNumber, coFileNumbers, dldReviewer |
| `Task` | title, completed, urgency (LOW\|MEDIUM\|HIGH\|CRITICAL), userId, assignedById, projectId |
| `Client` | name, companyName, email, phone, address |
| `Milestone` | date, item, completed, projectId |
| `Comment` | body, userId, projectId?, taskId? |
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

## Known Issues / Quirks
- `docker-compose.yml` does not exist here — deployment config lives in a separate folder
- `@azure/msal-node` is installed for future Azure AD auth (not yet implemented)
- The `wait(500)` calls in DB functions are intentional artificial delays for loading UX
- Zod v4 is used — `required_error` param no longer exists; use `error:` instead (e.g. `z.number({ error: "Required" })`)
