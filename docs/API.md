# API Documentation

## Overview

The Mildenberg Project Platform uses Next.js API routes for server-side functionality. All API endpoints are located in the `src/app/api/` directory and follow RESTful conventions.

## Authentication

All API endpoints (except login/signup) require authentication via session cookies.

### Session Management
- Sessions are stored in HTTP-only cookies
- Session data includes user ID and role
- Sessions expire after a configurable time period

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/login`
Authenticate a user and create a session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

#### POST `/api/auth/signup`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

#### POST `/api/auth/logout`
Logout the current user and clear session.

**Response:**
```json
{
  "success": true
}
```

### Project Endpoints

#### GET `/api/projects`
Get all projects for the current user.

**Query Parameters:**
- `search` (optional): Search term for filtering
- `manager` (optional): Filter by project manager ID
- `sort` (optional): Sort field (milestone, title, etc.)
- `order` (optional): Sort order (asc, desc)

**Response:**
```json
[
  {
    "id": 1,
    "title": "Project Alpha",
    "client": "Client Name",
    "clientId": 1,
    "body": "Project description",
    "milestone": "2024-12-31T00:00:00.000Z",
    "milestones": [
      {
        "id": 1,
        "date": "2024-12-31T00:00:00.000Z",
        "item": "Milestone description"
      }
    ],
    "mbaNumber": "MBA-001",
    "coFileNumbers": "CO-001, CO-002",
    "dldReviewer": "Reviewer Name",
    "userId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET `/api/projects/[id]`
Get a specific project by ID.

**Response:**
```json
{
  "id": 1,
  "title": "Project Alpha",
  "client": "Client Name",
  "clientId": 1,
  "body": "Project description",
  "milestone": "2024-12-31T00:00:00.000Z",
  "milestones": [...],
  "mbaNumber": "MBA-001",
  "coFileNumbers": "CO-001, CO-002",
  "dldReviewer": "Reviewer Name",
  "userId": 1,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### POST `/api/projects`
Create a new project.

**Request Body:**
```json
{
  "title": "New Project",
  "clientId": 1,
  "body": "Project description",
  "milestone": "2024-12-31T00:00:00.000Z",
  "mbaNumber": "MBA-002",
  "coFileNumbers": "CO-003",
  "dldReviewer": "Reviewer Name"
}
```

#### PUT `/api/projects/[id]`
Update an existing project.

**Request Body:**
```json
{
  "title": "Updated Project Title",
  "body": "Updated description",
  "mbaNumber": "MBA-002-UPDATED"
}
```

#### DELETE `/api/projects/[id]`
Delete a project (admin only).

### Task Endpoints

#### GET `/api/tasks`
Get all tasks.

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `projectId` (optional): Filter by project ID
- `completed` (optional): Filter by completion status

#### POST `/api/tasks`
Create a new task.

**Request Body:**
```json
{
  "title": "Task description",
  "userId": 1,
  "projectId": 1
}
```

#### PUT `/api/tasks/[id]`
Update a task.

**Request Body:**
```json
{
  "title": "Updated task",
  "completed": true
}
```

### Client Endpoints

#### GET `/api/clients`
Get all clients.

#### POST `/api/clients`
Create a new client.

**Request Body:**
```json
{
  "name": "Client Name",
  "companyName": "Company Inc.",
  "email": "client@company.com",
  "phone": "+1234567890",
  "address": "123 Main St, City, State"
}
```

### User Endpoints

#### GET `/api/users`
Get all users (admin only).

#### GET `/api/users/[id]`
Get user profile by ID.

### Admin Endpoints

#### GET `/api/admin/stats`
Get system statistics (admin only).

**Response:**
```json
{
  "totalUsers": 25,
  "totalProjects": 150,
  "totalTasks": 500,
  "totalClients": 30,
  "recentActivity": [...]
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

### Common Error Codes
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `INTERNAL_ERROR` - Server error

## Rate Limiting

API endpoints are protected by rate limiting to prevent abuse:
- 100 requests per minute per IP
- 1000 requests per hour per user

## Caching

Many API endpoints use Redis caching for improved performance:
- Project lists are cached for 5 minutes
- User data is cached for 10 minutes
- Admin statistics are cached for 1 hour

Cache keys follow the pattern: `{resource}:{identifier}:{version}`







