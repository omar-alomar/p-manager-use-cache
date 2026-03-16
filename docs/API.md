# REST API v1 Reference

Base URL: `/api/v1`

REST API for mobile clients. All requests must include `Content-Type: application/json` for request bodies. All responses return `Content-Type: application/json`.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Response Format](#response-format)
3. [Object Schemas](#object-schemas)
4. [Auth Endpoints](#auth-endpoints)
5. [Projects](#projects)
6. [Tasks](#tasks)
7. [Clients](#clients)
8. [Users](#users)
9. [Comments](#comments)
10. [Milestones](#milestones)
11. [Notifications](#notifications)
12. [Admin](#admin)

---

## Authentication

All endpoints except `POST /auth/login` require authentication via one of:

1. **Bearer token** (mobile): `Authorization: Bearer <token>`
2. **Session cookie** (browser): Sent automatically

### Token lifecycle

- Tokens are session IDs stored in Redis with **3-month expiry**.
- **Version-bump invalidation:** When the server's `APP_VERSION` changes, all non-admin tokens become invalid. The mobile app will receive a `401` and must re-authenticate.
- **Admin tokens** survive version bumps — they use a different Redis key prefix.
- There are **no refresh tokens**. When a session expires or is invalidated, the user must log in again with credentials.
- An expired or invalid token returns:

```json
// 401
{ "error": { "message": "Authentication required" } }
```

### Token storage

The token is a 64-character hex string. On iOS, store it in Keychain. On Android, use EncryptedSharedPreferences. Never store in plain SharedPreferences or UserDefaults.

---

## Response Format

### Success (single item or action)

```json
{ "data": <payload> }
```

### Success (paginated list)

List endpoints return results in pages instead of returning everything at once. This keeps response payloads small — important for mobile clients on cellular connections.

**How it works:** Send `page` and `limit` as query params to control which slice of results you get back. For example, `GET /tasks?page=1&limit=20` returns the first 20 tasks. `GET /tasks?page=2&limit=20` returns tasks 21–40. If you don't send these params, you get page 1 with 20 items by default.

**Typical mobile flow:**
1. Initial load: `GET /tasks?page=1&limit=20` → render first 20 tasks
2. User scrolls to bottom → check `hasMore`, if `true` call `GET /tasks?page=2&limit=20`
3. Append results, repeat until `hasMore` is `false`

**Response shape:**

```json
{
  "data": {
    "items": [ ... ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

| Field | Type | Description |
|---|---|---|
| `items` | array | The results for this page |
| `total` | int | Total matching records across all pages (use for "showing X of Y" UI) |
| `page` | int | Which page this is (1-indexed) |
| `limit` | int | How many items per page |
| `hasMore` | boolean | `true` if there are more pages after this one — use to trigger "load more" / infinite scroll |

**Query params** (available on all list endpoints):

| Param | Type | Default | Max | Description |
|---|---|---|---|---|
| `page` | int | 1 | — | Which page to return (1 = first page) |
| `limit` | int | 20 | 100 | How many items per page. Max 100 to prevent oversized responses |

**Paginated endpoints:** `GET /projects`, `GET /tasks`, `GET /clients`, `GET /users`, `GET /comments`, `GET /admin/users`.

Status `200` for reads/updates, `201` for creates, `204` (empty body) for deletes and logout.

### Error

```json
{
  "error": {
    "message": "Human-readable description",
    "details": {
      "title": "Required",
      "userId": "Required"
    }
  }
}
```

`details` is only present on `400` validation errors. Each key is the field path (e.g. `"milestones.0.date"`), each value is the validation message.

### Status Codes

| Code | Meaning | When |
|---|---|---|
| `200` | OK | Successful read or update |
| `201` | Created | Successful create |
| `204` | No Content | Successful delete or logout (empty body) |
| `400` | Bad Request | Validation failed, invalid JSON, or business logic error |
| `401` | Unauthorized | Missing, expired, or invalid token |
| `403` | Forbidden | Valid token but insufficient role (non-admin hitting admin endpoint) |
| `404` | Not Found | Entity does not exist |
| `503` | Service Unavailable | Maintenance mode active (non-admin users on mutation endpoints) |

### Maintenance mode

When active, all mutation endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) return `503` for non-admin users. `GET` endpoints still work. Admin users bypass maintenance entirely.

---

## Object Schemas

These are the JSON shapes returned in `data`. All `DateTime` fields are ISO 8601 strings with timezone: `"2026-03-16T14:30:00.000Z"`. Date-only fields (milestone dates) are midnight UTC: `"2026-06-01T00:00:00.000Z"`.

### User

```jsonc
{
  "id": 1,                              // int
  "email": "jane@example.com",          // string
  "name": "Jane Doe",                   // string
  "role": "user",                       // "user" | "admin"
  "createdAt": "2025-01-15T10:00:00.000Z",  // ISO 8601
  "lastSeenVersion": "1.1.1",           // string | null
  // password and salt are NEVER returned
  // Included when fetched via list endpoints:
  "projects": [Project],                // Project[] (without nested includes)
  "tasks": [Task]                       // Task[] (without nested includes)
}
```

### Project

```jsonc
{
  "id": 1,                              // int
  "title": "Office Renovation",         // string
  "clientId": 3,                        // int | null
  "body": "Project description...",     // string
  "userId": 2,                          // int (project manager)
  "archived": false,                    // boolean
  "milestone": "2026-06-01T00:00:00.000Z",  // ISO 8601 | null (legacy single milestone)
  "mbaNumber": "MBA-2026-001",          // string (default "")
  "coFileNumbers": "CO-123, CO-456",    // string (default "")
  "dldReviewer": "John Smith",          // string (default "")
  "createdAt": "2025-06-01T10:00:00.000Z",  // ISO 8601
  // Included relations (on detail/list endpoints):
  "clientRef": Client | null,           // Client object or null if no client
  "milestones": [Milestone],            // Milestone[], ordered by date asc
  "tasks": [                            // Only open (incomplete) tasks on list endpoint
    { "id": 1, "title": "...", "urgency": "HIGH" }
  ]
}
```

### Task

```jsonc
{
  "id": 1,                              // int
  "title": "Review blueprints",         // string
  "completed": false,                   // boolean
  "completedAt": null,                  // ISO 8601 | null
  "urgency": "HIGH",                    // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null
  "userId": 3,                          // int (assigned to)
  "assignedById": 2,                    // int | null (who assigned it)
  "projectId": 1,                       // int | null (0 treated as null in some contexts)
  "createdAt": "2025-07-01T10:00:00.000Z",  // ISO 8601
  "updatedAt": "2025-07-15T10:00:00.000Z",  // ISO 8601
  // Included relations:
  "Project": Project | null,            // Project object (without nested tasks/milestones)
  "User": User,                         // Assigned user (id, email, name, role)
  "AssignedBy": User | null             // Assigner (id, email, name, role) — null if self-assigned
}
```

> **Note:** Tasks completed for more than 30 days are automatically archived by the system. There is no API filter for archived tasks. Just use "completedAt" to implement auto-archive.

### Client

```jsonc
{
  "id": 1,                              // int
  "name": "Alice Johnson",              // string
  "companyName": "Acme Corp",           // string | null
  "email": "alice@acme.com",            // string
  "phone": "+1234567890",               // string | null
  "address": "123 Main St",             // string | null
  "createdAt": "2025-03-01T10:00:00.000Z",  // ISO 8601
  "updatedAt": "2025-03-15T10:00:00.000Z",  // ISO 8601
  // Included relations:
  "projects": [                         // Project[] with user relation
    {
      ...Project,
      "user": User                      // Project manager
    }
  ]
}
```

### Milestone

```jsonc
{
  "id": 1,                              // int
  "date": "2026-06-01T00:00:00.000Z",   // ISO 8601 (date-only, midnight UTC)
  "item": "Phase 1 review",             // string
  "completed": false,                   // boolean
  "apfo": false,                        // boolean (APFO flag)
  "projectId": 1,                       // int
  "createdAt": "2025-06-01T10:00:00.000Z"  // ISO 8601
}
```

### Comment

```jsonc
{
  "id": 1,                              // int
  "email": "jane@example.com",          // string (author email)
  "body": "Looks good, @John Smith please review",  // string (raw text with @mentions)
  "projectId": 1,                       // int | null
  "taskId": null,                       // int | null
  "userId": 2,                          // int (author)
  "createdAt": "2025-08-01T10:00:00.000Z",  // ISO 8601
  // Included relation:
  "user": {
    "id": 2,
    "name": "Jane Doe",
    "role": "user"
  }
}
```

### RedisNotification

Notifications from `GET /api/v1/notifications` come from the Redis real-time store. They have a **different shape** from the Prisma `Notification` model:

```jsonc
{
  "id": "notif_1710590400000_a1b2c3d4e",  // string (generated ID)
  "type": "task_assigned",               // "task_assigned" | "task_completed" | "mention"
  "title": "New Task Assignment",        // string (display title)
  "message": "You have been assigned a new task: \"Review blueprints\"",  // string
  "taskId": 1,                           // int | undefined
  "taskTitle": "Review blueprints",      // string | undefined
  "projectId": 1,                        // int | undefined
  "projectTitle": "Office Renovation",   // string | undefined
  "commentId": null,                     // int | undefined (only for mentions)
  "assignedUserId": 3,                   // int (who this notification is for)
  "assignedUserName": "Bob Wilson",      // string
  "assignerUserId": 2,                   // int | undefined
  "assignerUserName": "Jane Doe",        // string | undefined
  "timestamp": "2025-07-01T10:00:00.000Z",  // ISO 8601
  "read": false                          // boolean
}
```

### DbNotification

The unread count from `GET /api/v1/notifications/count` uses the Prisma `Notification` model (stored in PostgreSQL, different from Redis notifications). The count endpoint returns just `{ "count": number }`.

---

## Auth Endpoints

### POST /auth/login

Authenticate and receive a session token.

**Request:**
```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "data": {
    "token": "a1b2c3...64hexchars",
    "user": {
      "id": 1,
      "email": "jane@example.com",
      "name": "Jane Doe",
      "role": "user",
      "lastSeenVersion": "1.1.1",
      "needsVersionAck": false
    }
  }
}
```

**Errors:**
```json
// 401 — wrong email or password (intentionally vague)
{ "error": { "message": "Invalid email or password" } }

// 400 — malformed request
{ "error": { "message": "Invalid credentials" } }
```

### POST /auth/logout

Destroys the session in Redis and clears the cookie.

**Response:** `204 No Content` (empty body)

### GET /auth/me

Returns the current authenticated user's profile.

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "email": "jane@example.com",
    "name": "Jane Doe",
    "role": "user",
    "lastSeenVersion": "1.1.1",
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### PATCH /auth/me

Update the current user's display name.

**Request:**
```json
{ "name": "Jane Smith" }
```

**Response (200):** Same shape as `GET /auth/me` with updated values.

**Errors:**
```json
// 400
{ "error": { "message": "Invalid profile data" } }
```

### PUT /auth/password

Change the current user's password.

**Request:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

`newPassword` must be >= 8 characters.

**Response (200):**
```json
{ "data": { "message": "Password updated successfully" } }
```

**Errors:**
```json
// 400 — wrong current password
{ "error": { "message": "Current password is incorrect" } }

// 400 — new password too short
{ "error": { "message": "Invalid password data. New password must be at least 8 characters." } }
```

### GET /auth/version

Check if the user has seen the current app version.

**Response (200):**
```json
{
  "data": {
    "currentVersion": "1.1.1",
    "lastSeenVersion": "1.1.0",
    "needsAck": true
  }
}
```

Use `needsAck` to decide whether to show a "what's new" screen.

### POST /auth/version

Mark the current version as seen. Call this after the user dismisses the changelog/what's new screen.

**Response (200):**
```json
{ "data": { "lastSeenVersion": "1.1.1" } }
```

---

## Projects

### GET /projects

List all projects.

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `query` | string | — | Search title and body (substring match) |
| `userId` | int | — | Filter by project manager ID |
| `includeArchived` | `"true"` | `false` | Include archived projects |
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 100) |

**Sort order:** Default Prisma ordering (by ID ascending). No client-controlled sorting.

**Response (200):**
```json
{
  "data": {
    "items": [
      {
        "id": 1,
        "title": "Office Renovation",
        "clientId": 3,
        "body": "Full renovation of floor 2...",
        "userId": 2,
        "archived": false,
        "milestone": "2026-06-01T00:00:00.000Z",
        "mbaNumber": "MBA-2026-001",
        "coFileNumbers": "",
        "dldReviewer": "",
        "createdAt": "2025-06-01T10:00:00.000Z",
        "clientRef": {
          "id": 3,
          "name": "Acme Corp",
          "companyName": "Acme Corp",
          "email": "contact@acme.com",
          "phone": null,
          "address": null,
          "createdAt": "2025-01-01T10:00:00.000Z",
          "updatedAt": "2025-01-01T10:00:00.000Z"
        },
        "milestones": [
          {
            "id": 1,
            "date": "2026-04-15T00:00:00.000Z",
            "item": "Phase 1 review",
            "completed": false,
            "apfo": false,
            "projectId": 1,
            "createdAt": "2025-06-01T10:00:00.000Z"
          }
        ],
        "tasks": [
          { "id": 5, "title": "Review blueprints", "urgency": "HIGH" }
        ]
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

> The `tasks` array on list responses contains only **open (incomplete) tasks** with a subset of fields (`id`, `title`, `urgency`). For full task data, use the Tasks endpoints.

### POST /projects

Create a new project.

**Request:**
```json
{
  "title": "Office Renovation",
  "clientId": 3,
  "body": "Full renovation of floor 2...",
  "userId": 2,
  "milestone": "2026-06-01",
  "mbaNumber": "MBA-2026-001",
  "coFileNumbers": "",
  "dldReviewer": "",
  "milestones": [
    { "date": "2026-04-15", "item": "Phase 1 review", "apfo": false }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | Min 1 char |
| `clientId` | int | yes | Must reference existing client |
| `body` | string | yes | Min 1 char |
| `userId` | int | yes | Project manager. Must reference existing user |
| `milestone` | string \| null | no | ISO date string or null. Legacy single-date milestone |
| `mbaNumber` | string | no | Defaults to `""` |
| `coFileNumbers` | string | no | Defaults to `""` |
| `dldReviewer` | string | no | Defaults to `""` |
| `milestones` | array | no | Array of `{ date: string, item: string, apfo?: boolean }` |

Date strings in the request body are converted to `Date` objects server-side. Accepts any format `new Date()` can parse: `"2026-06-01"`, `"2026-06-01T00:00:00.000Z"`, etc.

**Response (201):** `{ "data": Project }` (without nested includes — just the created record).

**Errors:**
```json
// 400 — validation
{
  "error": {
    "message": "Validation failed",
    "details": {
      "title": "Required",
      "clientId": "Required",
      "body": "Required",
      "userId": "Required"
    }
  }
}
```

### GET /projects/:projectId

Get a single project with client and milestones.

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "title": "Office Renovation",
    "clientId": 3,
    "body": "...",
    "userId": 2,
    "archived": false,
    "milestone": "2026-06-01T00:00:00.000Z",
    "mbaNumber": "MBA-2026-001",
    "coFileNumbers": "",
    "dldReviewer": "",
    "createdAt": "2025-06-01T10:00:00.000Z",
    "clientRef": { ... },
    "milestones": [ ... ]
  }
}
```

> Detail endpoint does **not** include `tasks`. Fetch tasks separately via `GET /tasks?projectId=1`.

**Errors:** `404` if project does not exist.

### PUT /projects/:projectId

Full replacement update. Same body shape as create. **Milestones are replaced** — all existing milestones are deleted and the provided array is created fresh.

**Response (200):** `{ "data": Project }`

**Errors:** `404` if not found, `400` if validation fails.

### DELETE /projects/:projectId

**Response:** `204 No Content`

**Errors:** `404` if not found.

### PATCH /projects/:projectId/field

Update a single text field on a project (used for inline editing).

**Request:**
```json
{ "field": "body", "value": "Updated project description" }
```

| Allowed `field` values | Type |
|---|---|
| `body` | string |
| `mbaNumber` | string |
| `coFileNumbers` | string |
| `dldReviewer` | string |

**Response (200):** `{ "data": Project }` (full project object).

**Errors:**
```json
// 400 — invalid field name
{ "error": { "message": "Invalid field. Allowed: body, mbaNumber, coFileNumbers, dldReviewer" } }
```

### PUT /projects/:projectId/archive

Archive or unarchive a project.

**Request:**
```json
{ "archived": true }
```

**Response (200):** `{ "data": Project }`

**Errors:**
```json
// 400
{ "error": { "message": "archived must be a boolean" } }
```

### POST /projects/:projectId/milestones

Add a single milestone to a project.

**Request:**
```json
{
  "date": "2026-05-01",
  "item": "Milestone description",
  "apfo": false
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `date` | string | yes | ISO date string |
| `item` | string | yes | Min 1 char, trimmed |
| `apfo` | boolean | no | Defaults to `false` |

**Response (201):** `{ "data": Milestone }`

---

## Tasks

### GET /tasks

List tasks. Returns all tasks by default, or filtered by user/project.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `userId` | int | Tasks assigned to this user |
| `projectId` | int | Tasks in this project |
| `page` | int | Page number (default 1) |
| `limit` | int | Items per page (default 20, max 100) |

If both `userId` and `projectId` are provided, `userId` takes precedence. If neither, returns all tasks.

**Sort order:** `createdAt` descending (newest first).

**Response (200):**
```json
{
  "data": {
    "items": [
      {
        "id": 1,
        "title": "Review blueprints",
        "completed": false,
        "completedAt": null,
        "urgency": "HIGH",
        "userId": 3,
        "assignedById": 2,
        "projectId": 1,
        "createdAt": "2025-07-01T10:00:00.000Z",
        "updatedAt": "2025-07-15T10:00:00.000Z",
        "Project": { ... },
        "User": { ... },
        "AssignedBy": { ... }
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

> **Relation key casing:** Task relations use PascalCase (`Project`, `User`, `AssignedBy`) because they match Prisma relation names. This differs from other endpoints that use camelCase.

### POST /tasks

Create a task. The authenticated user is automatically recorded as the assigner (`assignedById`).

**Request:**
```json
{
  "title": "Review blueprints",
  "userId": 3,
  "urgency": "HIGH",
  "completed": false,
  "projectId": 1
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | Min 1 char |
| `userId` | int | yes | Who the task is assigned to |
| `urgency` | string | no | `"LOW"`, `"MEDIUM"` (default), `"HIGH"`, `"CRITICAL"` |
| `completed` | boolean | no | Defaults to `false` |
| `projectId` | int | no | Associated project. Omit or `null` for standalone tasks |

**Side effects:** If `userId` differs from the authenticated user, a `task_assigned` real-time notification is sent to the assignee.

**Response (201):**
```json
{
  "data": {
    "id": 42,
    "title": "Review blueprints",
    "completed": false,
    "completedAt": null,
    "urgency": "HIGH",
    "userId": 3,
    "assignedById": 2,
    "projectId": 1,
    "createdAt": "2025-07-01T10:00:00.000Z",
    "updatedAt": "2025-07-01T10:00:00.000Z"
  }
}
```

> Create response returns the flat task object (no relations). Fetch `GET /tasks/:id` for the full object with relations.

### GET /tasks/:taskId

**Response (200):** Full task with `Project`, `User`, and `AssignedBy` relations (same shape as list items).

**Errors:** `404`

### PUT /tasks/:taskId

Full replacement update. Same body shape as create.

`completedAt` is automatically set to `now()` if `completed: true`, or `null` if `completed: false`.

**Response (200):** `{ "data": Task }` (flat, no relations).

### DELETE /tasks/:taskId

**Response:** `204 No Content`

### PATCH /tasks/:taskId/complete

Toggle task completion status. This is the preferred endpoint for marking tasks done (vs. full PUT).

**Request:**
```json
{ "completed": true }
```

**Side effects:** When `completed: true` and the task was assigned by a different user, a `task_completed` real-time notification is sent to the assigner.

**Response (200):** `{ "data": Task }` (flat, no relations).

**Errors:**
```json
// 400
{ "error": { "message": "completed must be a boolean" } }
```

---

## Clients

### GET /clients

**Query params:**

| Param | Type | Description |
|---|---|---|
| `query` | string | Search name, email, phone, and address (substring match) |
| `page` | int | Page number (default 1) |
| `limit` | int | Items per page (default 20, max 100) |

**Sort order:** `name` ascending (alphabetical).

**Response (200):**
```json
{
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Alice Johnson",
        "companyName": "Acme Corp",
        "email": "alice@acme.com",
        "phone": "+1234567890",
        "address": "123 Main St",
        "createdAt": "2025-03-01T10:00:00.000Z",
        "updatedAt": "2025-03-15T10:00:00.000Z",
        "projects": [ ... ]
      }
    ],
    "total": 8,
    "page": 1,
    "limit": 20,
    "hasMore": false
  }
}
```

### POST /clients

**Request:**
```json
{
  "name": "Alice Johnson",
  "email": "alice@acme.com",
  "companyName": "Acme Corp",
  "phone": "+1234567890",
  "address": "123 Main St"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Min 1 char |
| `email` | string | yes | Must be valid email format |
| `companyName` | string | no | |
| `phone` | string | no | |
| `address` | string | no | |

**Response (201):** `{ "data": Client }` (flat, no `projects` relation).

### GET /clients/:clientId

Returns client with projects (including each project's milestones and manager user).

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "name": "Alice Johnson",
    "companyName": "Acme Corp",
    "email": "alice@acme.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "createdAt": "2025-03-01T10:00:00.000Z",
    "updatedAt": "2025-03-15T10:00:00.000Z",
    "projects": [
      {
        ...Project,
        "user": User,
        "milestones": [Milestone]
      }
    ]
  }
}
```

**Errors:** `404`

### PUT /clients/:clientId

Full replacement. Same body shape as create.

**Response (200):** `{ "data": Client }` (flat).

### DELETE /clients/:clientId

**Response:** `204 No Content`

### PATCH /clients/:clientId/field

Update a single field (inline editing).

**Request:**
```json
{ "field": "companyName", "value": "New Company Name" }
```

| Allowed `field` values | `value` type |
|---|---|
| `companyName` | string \| null |
| `address` | string \| null |

**Response (200):** `{ "data": Client }` (flat).

---

## Users

Users are read-only through the public API. User creation and management is admin-only (see [Admin](#admin)).

### GET /users

List all users. Sensitive fields (`password`, `salt`) are stripped.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `page` | int | Page number (default 1) |
| `limit` | int | Items per page (default 20, max 100) |

**Sort order:** `name` ascending (alphabetical).

**Response (200):**
```json
{
  "data": {
    "items": [
      {
        "id": 1,
        "email": "jane@example.com",
        "name": "Jane Doe",
        "role": "user",
        "createdAt": "2025-01-15T10:00:00.000Z",
        "lastSeenVersion": "1.1.1",
        "projects": [ ... ],
        "tasks": [ ... ]
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20,
    "hasMore": false
  }
}
```

> The `projects` and `tasks` arrays contain full objects (all scalar fields) but without further nested relations.

### GET /users/:userId

Single user with same shape as list items (no password/salt).

**Errors:** `404`

---

## Comments

### GET /comments

List comments for a project or task. **One query param is required.**

**Query params:**

| Param | Type | Description |
|---|---|---|
| `projectId` | int | Comments on this project |
| `taskId` | int | Comments on this task |
| `page` | int | Page number (default 1) |
| `limit` | int | Items per page (default 20, max 100) |

**Sort order:** `createdAt` descending (newest first).

**Response (200):**
```json
{
  "data": {
    "items": [
      {
        "id": 1,
        "email": "jane@example.com",
        "body": "Looks good, @John Smith please review the timeline",
        "projectId": 1,
        "taskId": null,
        "userId": 2,
        "createdAt": "2025-08-01T10:00:00.000Z",
        "user": {
          "id": 2,
          "name": "Jane Doe",
          "role": "user"
        }
      }
    ],
    "total": 12,
    "page": 1,
    "limit": 20,
    "hasMore": false
  }
}
```

**Errors:**
```json
// 400 — missing query param
{ "error": { "message": "Either projectId or taskId query param is required" } }
```

### POST /comments

Create a comment. `@mentions` (format: `@FirstName LastName`) are automatically parsed and generate real-time notifications for mentioned users.

**Request:**
```json
{
  "body": "Looks good, @John Smith please review",
  "projectId": 1
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `body` | string | yes | Min 1 char. `@FirstName LastName` triggers mention notifications |
| `projectId` | int | conditional | Required if no `taskId` |
| `taskId` | int | conditional | Required if no `projectId` |

The authenticated user's email is automatically attached to the comment record. You do not need to send `email` or `userId`.

**Side effects:** For each `@mention`, a `Mention` record is created in the DB and a real-time notification is sent via Redis Pub/Sub (unless the mentioned user is the comment author).

**Response (201):**
```json
{
  "data": {
    "id": 10,
    "email": "jane@example.com",
    "body": "Looks good, @John Smith please review",
    "projectId": 1,
    "taskId": null,
    "userId": 2,
    "createdAt": "2025-08-01T10:00:00.000Z"
  }
}
```

> Create response does not include the `user` relation. Refetch the comment list if you need it.

### DELETE /comments/:commentId

Only the comment author or an admin can delete.

**Response:** `204 No Content`

**Errors:** `403` if not the author and not admin, `404` if not found.

---

## Milestones

Milestones belong to projects. Create milestones via `POST /projects/:id/milestones`. These endpoints are for updating and deleting individual milestones.

### PUT /milestones/:milestoneId

Partial update — only include the fields you want to change.

**Request:**
```json
{
  "date": "2026-06-15",
  "item": "Updated description",
  "apfo": true
}
```

All fields are optional. Only provided fields are updated.

**Response (200):** `{ "data": Milestone }`

**Errors:** `404`

### DELETE /milestones/:milestoneId

**Response:** `204 No Content`

**Errors:** `404`

### PATCH /milestones/:milestoneId/complete

Toggle milestone completion.

**Request:**
```json
{ "completed": true }
```

**Response (200):** `{ "data": Milestone }`

---

## Notifications

There are two notification systems with different storage:

1. **Redis notifications** (`GET /notifications`) — real-time store, up to 100 per user, used for the notification feed
2. **DB notifications** (`GET /notifications/count`) — PostgreSQL `Notification` model, used for unread count and mention tracking

### GET /notifications

Fetch notifications from the Redis real-time store.

**Query params:**

| Param | Type | Default | Max |
|---|---|---|---|
| `limit` | int | 50 | 100 |

**Response (200):**
```json
{
  "data": [
    {
      "id": "notif_1710590400000_a1b2c3d4e",
      "type": "task_assigned",
      "title": "New Task Assignment",
      "message": "You have been assigned a new task: \"Review blueprints\" in project \"Office Renovation\"",
      "taskId": 1,
      "taskTitle": "Review blueprints",
      "projectId": 1,
      "projectTitle": "Office Renovation",
      "assignedUserId": 3,
      "assignedUserName": "Bob Wilson",
      "assignerUserId": 2,
      "assignerUserName": "Jane Doe",
      "timestamp": "2025-07-01T10:00:00.000Z",
      "read": false
    }
  ]
}
```

### GET /notifications/count

Unread count from the PostgreSQL `Notification` model (mention-based notifications).

**Response (200):**
```json
{ "data": { "count": 5 } }
```

### POST /notifications/read-all

Mark all notifications as read. Clears both the DB notifications and the Redis real-time store for the current user.

**Response (200):**
```json
{ "data": { "message": "All notifications marked as read" } }
```

### POST /notifications/:notificationId/read

Mark a single notification as read. The `notificationId` can be either:
- A DB notification ID (integer, as string in the URL) — marks read in PostgreSQL
- A Redis notification ID (string like `notif_...`) — removes from Redis store

**Response (200):**
```json
{ "data": { "message": "Notification marked as read" } }
```

---

## Admin

All admin endpoints require `role: "admin"`. Non-admin users receive `403 Forbidden`.

### GET /admin/stats

System-wide statistics.

**Response (200):**
```json
{
  "data": {
    "totalUsers": 10,
    "totalProjects": 25,
    "totalTasks": 150,
    "totalClients": 8,
    "completedTasks": 90,
    "pendingTasks": 60,
    "adminUsers": 2,
    "regularUsers": 8
  }
}
```

### GET /admin/users

List all users (admin view). Same response shape as `GET /users` — no password/salt. Supports `page` and `limit` query params.

### POST /admin/users

Create a new user account. **This is the only way to create users** — there is no public signup.

**Request:**
```json
{
  "name": "New User",
  "email": "new@example.com",
  "password": "password123",
  "role": "user"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Min 1 char |
| `email` | string | yes | Must be valid email, must be unique |
| `password` | string | yes | Min 8 chars. Server hashes it — never stored in plaintext |
| `role` | string | no | `"user"` (default) or `"admin"` |

**Response (201):** `{ "data": User }` (no password/salt).

**Errors:**
```json
// 400 — duplicate email
{ "error": { "message": "User with this email already exists" } }
```

### DELETE /admin/users/:userId

Delete a user. Cannot delete yourself.

**Response:** `204 No Content`

**Errors:**
```json
// 400 — self-deletion
{ "error": { "message": "Cannot delete your own account" } }

// 400 — not found
{ "error": { "message": "User with id 99 not found" } }
```

### PUT /admin/users/:userId/role

**Request:**
```json
{ "role": "admin" }
```

Values: `"user"` or `"admin"`.

**Response (200):** `{ "data": User }` (no password/salt).

### PUT /admin/users/:userId/email

**Request:**
```json
{ "email": "newemail@example.com" }
```

**Response (200):** `{ "data": User }` (no password/salt).

### PUT /admin/users/:userId/password

Reset a user's password (admin override — no current password required).

**Request:**
```json
{ "password": "newpassword123" }
```

Min 8 characters. Server hashes it.

**Response (200):**
```json
{ "data": { "message": "Password updated" } }
```

### PUT /admin/users/:userId/version

Set or reset a user's `lastSeenVersion`. Set to `null` to force them to see the changelog on next login.

**Request:**
```json
{ "version": "1.1.1" }
```

Or to reset:
```json
{ "version": null }
```

**Response (200):**
```json
{ "data": { "id": 1, "lastSeenVersion": "1.1.1" } }
```

### DELETE /admin/projects/:projectId

Hard-delete a project and all its tasks, milestones, and comments (cascade).

**Response:** `204 No Content`

**Errors:** `404`

### DELETE /admin/tasks/:taskId

**Response:** `204 No Content`

**Errors:** `404`

### DELETE /admin/clients/:clientId

Deleting a client sets `clientId` to `null` on associated projects (cascade: SetNull).

**Response:** `204 No Content`

**Errors:** `404`

### GET /admin/maintenance

Check maintenance mode status.

**Response (200):**
```json
{ "data": { "enabled": false } }
```

### PUT /admin/maintenance

Toggle maintenance mode. Takes effect immediately — no restart needed.

**Request:**
```json
{ "enabled": true }
```

**Response (200):**
```json
{ "data": { "enabled": true } }
```
