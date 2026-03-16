# Mildenberg Project Platform — Mobile App User Story Reference

> **Purpose:** Comprehensive, platform-agnostic reference for a mobile development team building a native app based on the Mildenberg web platform.
> **Source version:** α 1.1.1
> **Date:** 2026-03-16
> **Total user stories:** 130

---

## How to Read This Document

**Priority tiers:**
- **P0 — Core:** Must-have for MVP. The app is non-functional without these.
- **P1 — Important:** Expected by users. Should ship in v1 or fast-follow.
- **P2 — Enhancement:** Nice-to-have. Can be deferred to v2+.

**Story format:** Each story describes *what the user wants* and *why*, with acceptance criteria focused on observable behavior — not web-specific implementation. The mobile team should determine native patterns (e.g., bottom sheets vs. full-screen forms, gestures, transitions).

---

## Table of Contents

1. [Screen Inventory & Navigation Map](#1-screen-inventory--navigation-map)
2. [Role Permissions Matrix](#2-role-permissions-matrix)
3. [Authentication & Account Management](#3-authentication--account-management)
4. [Projects](#4-projects)
5. [Tasks](#5-tasks)
6. [My Tasks (Personal Task View)](#6-my-tasks-personal-task-view)
7. [Team Dashboard](#7-team-dashboard)
8. [Clients](#8-clients)
9. [Users / Team Directory](#9-users--team-directory)
10. [Milestones](#10-milestones)
11. [Comments & @Mentions](#11-comments--mentions)
12. [Notifications](#12-notifications)
13. [Version Tracking & Changelog](#13-version-tracking--changelog)
14. [Admin Panel](#14-admin-panel)
15. [Navigation & General UX](#15-navigation--general-ux)
16. [Mobile-Specific Requirements](#16-mobile-specific-requirements)
17. [Data Model Reference](#17-data-model-reference)
18. [API Contract Reference](#18-api-contract-reference)

---

## 1. Screen Inventory & Navigation Map

> Every screen the mobile app needs to build, which stories it implements, and where users can navigate from it.

### 1.1 Unauthenticated Screens

| Screen | Purpose | Stories | Navigates To |
|---|---|---|---|
| **Login** | Email/password login + Microsoft OAuth button | AUTH-03, AUTH-04, AUTH-05 | Projects List (or Changelog) |

### 1.2 Primary Screens (Tab Bar)

These are the top-level destinations accessible from the main navigation.

| Screen | Purpose | Stories | Navigates To |
|---|---|---|---|
| **Projects List** | Browse, search, filter, sort all projects | PROJ-01 – PROJ-11 | Project Detail, Project Create, Client Detail |
| **My Tasks** | Personal task view grouped by status | MYTASK-01 – MYTASK-03, TASK-03 – TASK-05 | Task Detail, Task Edit |
| **Dashboard** | Team KPIs, workload board, milestones, activity | DASH-01 – DASH-07 | Project Detail, Task Detail, User Profile, Quick Add Task |
| **Clients List** | Browse, search, sort all clients | CLIENT-01 – CLIENT-04 | Client Detail, Client Create |
| **Team Directory** | Grid of team member cards | USER-01 | User Profile |

### 1.3 Detail Screens

| Screen | Purpose | Stories | Navigates To |
|---|---|---|---|
| **Project Detail** | Full project view: info, milestones, tasks, comments | PROJ-17 – PROJ-21, MILE-01 – MILE-05, COMMENT-01 – COMMENT-03 | Project Edit, Task Detail, User Profile, Milestone Edit |
| **Task Detail** | Full task view: info, metadata, comments | TASK-06 – TASK-09, COMMENT-01 – COMMENT-03 | Task Edit, Project Detail, User Profile |
| **Client Detail** | Client info, projects, stats | CLIENT-09 | Client Edit, Project Detail |
| **User Profile** | Team member info, their projects and tasks | USER-02 | Project Detail, Task Detail |

### 1.4 Create / Edit Screens

| Screen | Purpose | Stories | Navigates To (on save) |
|---|---|---|---|
| **Project Create** | New project form with milestones | PROJ-12 – PROJ-14 | Projects List |
| **Project Edit** | Edit existing project | PROJ-15 | Project Detail |
| **Task Create (Full)** | Full task creation form | TASK-01 | Task Detail |
| **Task Edit** | Edit existing task | TASK-08 | Task Detail |
| **Client Create** | New client form | CLIENT-05 | Clients List |
| **Client Edit** | Edit existing client | CLIENT-06 | Client Detail or Clients List |

### 1.5 Overlay / Sheet Screens

These are presented as bottom sheets, modals, or slide-overs — not full-screen pushes.

| Screen | Purpose | Stories | Context |
|---|---|---|---|
| **Quick Add Task** | Lightweight task creation | TASK-02 | FAB or contextual "+" button. Pre-fills user/project from context. |
| **Notification Center** | Notification list with unread state | NOTIF-02 – NOTIF-07 | Opened from notification bell in nav. |
| **Milestone Add/Edit** | Add or edit a milestone | MILE-01, MILE-04 | From Project Detail. |
| **Inline Client Create** | Create client without leaving project form | PROJ-14 | From Project Create/Edit client picker. |
| **@Mention Autocomplete** | User suggestions while typing comment | MENTION-01, MENTION-02 | Inline within comment input on Project/Task Detail. |

### 1.6 Utility Screens

| Screen | Purpose | Stories |
|---|---|---|
| **Profile** | View/edit own name, change password | AUTH-09 – AUTH-11 |
| **Changelog** | Version history with feature highlights | VER-01 – VER-04 |
| **Maintenance** | Static "system unavailable" notice | ADMIN-13 |

### 1.7 Admin Screens (Admin role only)

| Screen | Purpose | Stories |
|---|---|---|
| **Admin Dashboard** | System stats + management sections | ADMIN-01, ADMIN-02 |
| **Admin User Management** | User table: create, edit, delete, role toggle | ADMIN-03 – ADMIN-06 |
| **Admin Entity Management** | Project/task/client tables with admin actions | ADMIN-07 – ADMIN-10 |
| **Maintenance Toggle** | Enable/disable maintenance mode | ADMIN-11, ADMIN-12 |

### 1.8 Navigation Flow Diagram

```
                    ┌─────────────┐
                    │   Launch     │
                    └──────┬──────┘
                           │
                  Authenticated?
                   ╱              ╲
                 No               Yes
                 ╱                  ╲
          ┌─────┴─────┐    Version seen?
          │   Login    │     ╱        ╲
          └─────┬─────┘   No         Yes
                │         ╱            ╲
                │    ┌────┴────┐  ┌─────┴──────┐
                └───►│Changelog│  │Projects List│
                     └────┬────┘  └─────┬──────┘
                          │             │
                          └──────┬──────┘
                                 │
                    ┌────────────┼────────────────┐
                    │            │                 │
              ┌─────┴─────┐ ┌───┴────┐    ┌──────┴───────┐
              │ Tab Bar    │ │ FAB    │    │ Notification │
              │ Navigation │ │ Button │    │ Bell         │
              └─────┬─────┘ └───┬────┘    └──────┬───────┘
                    │           │                 │
     ┌──────┬──────┼──────┬────┘           ┌─────┴──────┐
     │      │      │      │                │ Notification│
     ▼      ▼      ▼      ▼               │ Center      │
  Projects My    Dash-  Clients            └─────┬──────┘
  List    Tasks  board  List                     │
     │      │      │      │                      ▼
     ▼      ▼      ▼      ▼               Task/Project
  Project  Task  User   Client             Detail
  Detail  Detail Profile Detail
     │      │              │
     ▼      ▼              ▼
  Project  Task          Client
  Edit    Edit           Edit
```

**Total screens: ~24** (11 primary/detail, 6 create/edit, 5 overlays, 2 utility)

---

## 2. Role Permissions Matrix

> Two roles exist: **User** (default) and **Admin**. This table is the single source of truth for what each role can do.

### 2.1 Core Permissions

| Action | User | Admin | Notes |
|---|---|---|---|
| **View** projects, tasks, clients, team | Yes | Yes | |
| **Create** projects | Yes | Yes | |
| **Edit** own projects | Yes | Yes | |
| **Edit** any project | Yes | Yes | All users can edit all projects |
| **Delete** own projects | Yes | Yes | |
| **Archive/unarchive** projects | Yes | Yes | |
| **Create** tasks | Yes | Yes | |
| **Edit** any task | Yes | Yes | All users can edit all tasks |
| **Delete** any task | Yes | Yes | |
| **Toggle** task completion | Yes | Yes | |
| **Create** clients | Yes | Yes | |
| **Edit** clients | Yes | Yes | |
| **Delete** clients | Yes | Yes | |
| **Add** milestones | Yes | Yes | |
| **Edit/delete** milestones | Yes | Yes | |
| **Add** comments | Yes | Yes | |
| **Delete** own comments | Yes | Yes | |
| **Delete** any comment | No | **Yes** | Admin moderation |
| **View** own profile | Yes | Yes | |
| **Edit** own profile (name, password) | Yes | Yes | |
| **Receive** notifications | Yes | Yes | |

### 2.2 Admin-Only Permissions

| Action | User | Admin | Notes |
|---|---|---|---|
| **Access** admin panel | No | **Yes** | Non-admins cannot see or reach admin screens |
| **View** system stats | No | **Yes** | User/project/task/client counts |
| **Create** users | No | **Yes** | Name, email, password, role |
| **Edit** any user's email | No | **Yes** | |
| **Reset** any user's password | No | **Yes** | |
| **Change** any user's role | No | **Yes** | Toggle user ↔ admin |
| **Set** any user's lastSeenVersion | No | **Yes** | Controls version banner/redirect |
| **Delete** users | No | **Yes** | |
| **Delete** any project/task/client (admin panel) | No | **Yes** | Separate from normal delete — bypasses maintenance checks |
| **Toggle** maintenance mode | No | **Yes** | |
| **Use app** during maintenance mode | No | **Yes** | Admins bypass maintenance screen |

### 2.3 Maintenance Mode Behavior

| Action | User (maintenance ON) | Admin (maintenance ON) |
|---|---|---|
| View/read data | **Blocked** — sees maintenance screen | Normal access |
| Create/edit/delete anything | **Blocked** | Normal access |
| Log in | **Blocked** | Normal access |
| Log out | Allowed | Allowed |

### 2.4 Session Behavior by Role

| Behavior | User | Admin |
|---|---|---|
| Session duration | 3 months | 3 months |
| Invalidated on app version bump | **Yes** — forced re-login | **No** — survives version bumps |
| Can be created via OAuth | Yes (if email matches) | Yes (if email matches) |

---

## 3. Authentication & Account Management

### 3.1 User Provisioning

> **There is no public signup.** All accounts are created by admins. Users log in with credentials provided by their admin, or via Microsoft OAuth if their email matches an existing account.

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| AUTH-01 | P0 | As an admin, I want to create user accounts so that new team members can access the platform. | Admin creates user with name, email, password (min 8 chars), and optional role. See [Admin — User Management](#14-admin-panel). |
| AUTH-02 | P1 | As a user, I want to be taken to the changelog on first login so that I learn what the platform offers. | First login (no `lastSeenVersion`) redirects to changelog screen. |

### 3.2 Login

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| AUTH-03 | P0 | As a user, I want to log in with my email and password so that I can access my work. | On success, session created. Redirect to projects list (if version seen) or changelog (if new version). On failure, show generic "Unable to log you in" (don't reveal if email exists). |
| AUTH-04 | P0 | As a user, I want to sign in with my Microsoft corporate account as an alternative to email/password. | "Sign in with Microsoft" button initiates OAuth flow. Microsoft email matched case-insensitively to existing account. If no match, show "No account found" error. If multiple Microsoft accounts, user can choose which one. |
| AUTH-05 | P0 | As a user, I want to be routed to the right screen after login based on whether I've seen the latest version. | If `lastSeenVersion` matches current app version → projects list. Otherwise → changelog. |

### 3.3 Session & Logout

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| AUTH-06 | P0 | As a user, I want my session to persist so that I don't have to log in every time I open the app. | Session lasts up to 3 months. |
| AUTH-07 | P0 | As a user, I want to log out so that I can end my session. | Logout accessible from navigation/profile. Session destroyed server-side. User returned to login screen. |
| AUTH-08 | P1 | As a regular user, I expect to be logged out after a major app version update so that I re-authenticate on significant changes. | Version bump invalidates regular user sessions. Admin sessions survive version bumps. |

### 3.4 Profile Management

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| AUTH-09 | P1 | As a user, I want to view my profile showing my name, email (read-only), and role (read-only). | Profile screen with account details. |
| AUTH-10 | P1 | As a user, I want to update my display name. | Name field editable. Saves to server. Reflected across the app. |
| AUTH-11 | P1 | As a user, I want to change my password by providing my current and new password. | Current password verified first. New password min 8 chars. |

---

## 4. Projects

### 4.1 Project List

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| PROJ-01 | P0 | As a user, I want to see a list of all active projects so that I can get an overview of current work. | List shows: project name, client name, project manager (avatar + name), nearest milestone (color-coded by urgency), active task count, MBA #. My projects appear first by default. |
| PROJ-02 | P0 | As a user, I want to search projects so that I can find any project quickly. | Search matches across: title, client name, company name, description, manager name, MBA #, Co File #. |
| PROJ-03 | P1 | As a user, I want to filter projects by project manager so that I can see a specific person's workload. | Manager filter (dropdown/picker). Shows "Showing X of Y projects" count. |
| PROJ-04 | P1 | As a user, I want to sort projects by name, MBA #, manager, milestone date, or task count. | Sort options accessible from list header. Persists within session. |
| PROJ-05 | P1 | As a user, I want to toggle between active and archived projects so that I can access old projects when needed. | Toggle/tab control. Archived projects visually distinguished. |
| PROJ-06 | P1 | As a user, I want to reset all filters and sorting at once so that I can return to the default view. | Single reset action clears search, filter, sort, and archive toggle. |

### 4.2 Project List — Inline Quick Info

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| PROJ-07 | P1 | As a user, I want to see milestone dates color-coded by urgency in the project list so that I can spot approaching deadlines. | Red: ≤14 days. Amber: ≤30 days. Green: >30 days. APFO badge shown on flagged milestones. |
| PROJ-08 | P1 | As a user, I want to tap the task count on a project row to see a quick preview of its active tasks. | Preview shows task titles. Tapping a task navigates to task detail. |
| PROJ-09 | P2 | As a user, I want to edit MBA #, Co File #'s, and Overview directly from the project list without opening the project. | Tap field to edit. Save on confirm. Visual feedback during save. |

### 4.3 Project Archiving

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| PROJ-10 | P1 | As a user, I want to archive a project so that it's removed from my active list without being deleted. | Archive action (swipe, long-press, or menu — mobile team decides gesture). Confirmation before archiving. Smooth removal from list. |
| PROJ-11 | P1 | As a user, I want to unarchive a project so that I can restore it to active status. | Available from archived projects view. |

### 4.4 Create Project

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| PROJ-12 | P0 | As a user, I want to create a new project so that I can track new work. | Required fields: title, client (searchable picker), project manager (searchable picker), description. Optional fields: MBA Number, Co File #'s, DLD Reviewer. |
| PROJ-13 | P0 | As a user, I want to add milestones during project creation so that key dates are tracked from the start. | Add/remove multiple milestones. Each has: date (required), description (required), APFO flag (optional checkbox). Date input visually indicates urgency. |
| PROJ-14 | P1 | As a user, I want to create a new client inline during project creation without losing my form progress. | "Add New Client" opens a sub-form/sheet. After saving, new client appears selected in the client picker. |

### 4.5 Edit & Delete Project

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| PROJ-15 | P0 | As a user, I want to edit all fields of an existing project. | Full edit form pre-populated with current data. Same fields as creation. Navigate back to project detail on save. |
| PROJ-16 | P1 | As a user, I want to delete a project permanently. | Confirmation required. Navigates to project list after deletion. |

### 4.6 Project Detail

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| PROJ-17 | P0 | As a user, I want to view a project's full details so that I understand its status. | Shows: title, client, manager (with avatar), archived status, description. Task progress summary (total / completed / active with visual indicator). |
| PROJ-18 | P0 | As a user, I want to see the project's milestones on the detail screen. | Milestone list showing: date, description, completion status, APFO badge, urgency color. Tap to toggle completion. |
| PROJ-19 | P0 | As a user, I want to see the project's tasks on the detail screen. | Task list showing: title, assignee, urgency badge, completion status. Tap to navigate to task detail. Toggle completion inline. |
| PROJ-20 | P0 | As a user, I want to see and add comments on the project detail screen. | Comment thread below milestones/tasks. See [Comments & @Mentions](#11-comments--mentions) for full spec. |
| PROJ-21 | P1 | As a user, I want to edit the project description inline on the detail screen. | Tap description to edit. Save/cancel actions. |

---

## 5. Tasks

### 5.1 Task Creation

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| TASK-01 | P0 | As a user, I want to create a task so that work items are tracked. | Required: title, assigned user (searchable picker). Optional: project (searchable picker), urgency (Low/Medium/High/Critical, default Medium). "Assigned By" automatically set to current user. |
| TASK-02 | P0 | As a user, I want a quick way to create a task from anywhere in the app. | Persistent "add task" button accessible from any screen (FAB or tab bar action). Opens a lightweight creation form. Optionally pre-fills user/project based on context (e.g., from a team column or project detail). Closes and refreshes list on success. |

### 5.2 Task List & Display

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| TASK-03 | P0 | As a user, I want each task to clearly show its key info at a glance. | Each task row shows: completion indicator, title (visually distinct when completed), urgency badge, assignee, project link, and assigned-by info. |
| TASK-04 | P0 | As a user, I want to toggle a task's completion status quickly. | Tap checkbox/toggle. Visual feedback during save (spinner or animation). Completed tasks record a timestamp. |
| TASK-05 | P0 | As a user, I want to search, filter, and sort my task list. | Search: title, project name, assignee. Filter by: status (All/In Progress/Completed with counts), urgency (All/Low/Medium/High/Critical), project. Sort by: created date, title, urgency. Reset all filters with one action. |

### 5.3 Task Detail

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| TASK-06 | P0 | As a user, I want a task detail screen showing all task info. | Shows: title, status, urgency (color-coded icon), assignee (tappable → profile), assigned by, project (tappable → project detail), created date, completed date (if applicable). |
| TASK-07 | P0 | As a user, I want to see and add comments on the task detail screen. | Comment thread below task details. See [Comments & @Mentions](#11-comments--mentions). |
| TASK-08 | P0 | As a user, I want to edit a task from its detail screen. | Full edit: title, project, assignee, urgency, completed status. Navigate back to detail on save. |
| TASK-09 | P1 | As a user, I want to delete a task. | Confirmation required. Navigates to task list after deletion. |

### 5.4 Task Inline Editing

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| TASK-10 | P1 | As a user, I want to edit a task's details from the list without navigating to the detail screen. | Edit mode on the list item: modify title, reassign user, change project, change urgency. Changes save immediately on selection. |

### 5.5 Task Archiving

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| TASK-11 | P1 | As a user, I want tasks completed for more than 30 days to be archived automatically so that old tasks don't clutter my view. | Archived tasks hidden from default views. |
| TASK-12 | P1 | As a user, I want to toggle an archive view to see old completed tasks. | Toggle/tab shows archived tasks in a separate list. Clear visual indicator that archive view is active. |

### 5.6 Task Notifications

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| TASK-13 | P0 | As a user, I want to be notified when someone assigns a task to me. | Real-time notification received. Not triggered if I assign to myself. |
| TASK-14 | P0 | As a user, I want to be notified when someone completes a task I'm associated with. | Real-time notification on status change (incomplete → complete). Not triggered for own actions. |

---

## 6. My Tasks (Personal Task View)

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| MYTASK-01 | P0 | As a user, I want a personal task screen showing my tasks grouped by status so that I have a focused view of my own work. | Three sections: **In Progress** (my uncompleted tasks), **Completed** (my completed tasks), **Assigned to Others** (tasks I assigned to others, in-progress only). Sections collapsible. |
| MYTASK-02 | P0 | As a user, I want to search, filter, and sort within My Tasks. | Same filter capabilities as the global task list: search, urgency, project, sort. |
| MYTASK-03 | P1 | As a user, I want to toggle archive view in My Tasks to see all my old completed tasks. | Archive toggle replaces grouped view with a single flat list of archived tasks. |

---

## 7. Team Dashboard

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| DASH-01 | P0 | As a user, I want to see team KPIs at a glance so that I understand overall workload. | Three KPI cards: **Active Tasks** (total count), **Urgent Tasks** (Critical + High count), **Completion Rate** (percentage). Tapping Active Tasks scrolls/navigates to team board with no filters. Tapping Urgent Tasks filters to Critical + High. |
| DASH-02 | P0 | As a user, I want to see a team board showing each member's tasks so that I can see workload distribution. | One section/column per team member, sorted by busiest first. Each shows: user avatar, name, active task count, workload indicator (green ≤3, yellow ≤6, red >6 tasks). Task cards within each section show project name. |
| DASH-03 | P1 | As a user, I want to quickly assign a task to a team member from the dashboard. | "Add task" action per team member. Opens quick-add form pre-filled with that user. |
| DASH-04 | P1 | As a user, I want to see upcoming milestones across all projects so that I can track deadlines. | Milestone list: project name, milestone description, days remaining (or "Overdue"). Color-coded by urgency. APFO badge where applicable. Tapping navigates to the project. |
| DASH-05 | P1 | As a user, I want to see recent activity across the team. | Last 20 updated tasks: title, status, project, assignee, assigned by, relative time (e.g., "5m ago"). |
| DASH-06 | P1 | As a user, I want to filter the dashboard's task board. | Search (title, project, user). Urgency toggles (multi-select pill buttons). "Show completed" toggle. Reset all filters. |
| DASH-07 | P2 | As a user, I want to see which team members are idle (no active tasks). | "Available: [names]" shown at bottom of team board when applicable. |

---

## 8. Clients

### 8.1 Client List

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| CLIENT-01 | P0 | As a user, I want to see a list of all clients so that I can manage client information. | Shows: name, company, email (tappable to compose email), phone (tappable to dial), project count, address. |
| CLIENT-02 | P0 | As a user, I want to search clients by name, company, email, phone, or address. | Real-time filtering. |
| CLIENT-03 | P1 | As a user, I want to sort the client list by name, company, email, project count, or address. | Sort persists within session. |
| CLIENT-04 | P1 | As a user, I want to tap a client's project count to see their projects. | Shows project names with managers. Tapping a project navigates to it. |

### 8.2 Client CRUD

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| CLIENT-05 | P0 | As a user, I want to create a new client. | Required: name, email (valid format). Optional: company name, phone, address. Navigates to client list on success. |
| CLIENT-06 | P1 | As a user, I want to edit a client's details. | Full edit form. All fields editable. Navigates back to where user came from on save. |
| CLIENT-07 | P1 | As a user, I want to edit company name and address directly from the client list. | Inline edit with save/cancel. |
| CLIENT-08 | P1 | As a user, I want to delete a client. | Confirmation required. Navigates to client list. |

### 8.3 Client Detail

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| CLIENT-09 | P0 | As a user, I want a client detail screen showing full info and their projects. | Shows: name, company, email (tappable), phone (tappable), address, created date. Stats: active project count, archived project count. Project list below with active/archived toggle. Tapping a project navigates to it. |

---

## 9. Users / Team Directory

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| USER-01 | P1 | As a user, I want to browse a team directory so that I can find colleagues. | Grid/list of team members: avatar (initials, consistent color per person), name, email, admin badge if applicable, project count, task count, first 3 projects (with "+X more"), join date. Tapping navigates to profile. |
| USER-02 | P1 | As a user, I want to view a team member's profile showing their work. | Shows: avatar, name, role badge, email. Stats: active projects, completed tasks, active tasks. Sections: projects (active/archived toggle), tasks grouped by project. Items are tappable to navigate. |

---

## 10. Milestones

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| MILE-01 | P0 | As a user, I want to add milestones to a project with a date, description, and optional APFO flag. | Form validates: date required, description required. APFO is an optional boolean flag. |
| MILE-02 | P0 | As a user, I want milestones displayed with urgency color-coding so that I can spot approaching deadlines. | Red: ≤14 days. Amber: ≤30 days. Green: >30 days. Completed milestones visually struck through. APFO badge shown where applicable. Old completed milestones (>7 days past) filtered out. |
| MILE-03 | P0 | As a user, I want to toggle a milestone's completion status by tapping it. | Visual feedback during save. Optimistic update. |
| MILE-04 | P1 | As a user, I want to edit a milestone's date, description, and APFO flag. | Edit form pre-populated with current values. |
| MILE-05 | P1 | As a user, I want to delete a milestone. | Confirmation required. |

---

## 11. Comments & @Mentions

### 11.1 Comments

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| COMMENT-01 | P0 | As a user, I want to add comments on projects and tasks so that I can discuss work with my team. | Comment form on project detail and task detail screens. Body: 1–1000 characters. Success/error feedback after posting. |
| COMMENT-02 | P0 | As a user, I want to see all comments in chronological order with author info. | Each comment shows: author avatar (color-coded initials), author name, date, body text. |
| COMMENT-03 | P1 | As a user, I want to delete my own comments. | Delete action with confirmation. Admins can delete any comment. |

### 11.2 @Mentions

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| MENTION-01 | P0 | As a user, I want to type `@` in a comment to see a list of team members I can mention. | Autocomplete appears on `@` input. Filters as user types. Shows avatar, name, and email per suggestion. |
| MENTION-02 | P0 | As a user, I want to select a mention from the autocomplete to insert it. | Tap/select inserts `@FirstName LastName`. Dismissible without selecting. |
| MENTION-03 | P0 | As a user, I want @mentioned names in comments to be tappable links to that user's profile. | Mentions rendered as distinct, tappable inline elements. |
| MENTION-04 | P0 | As a user, I want to receive a notification when someone @mentions me. | Notification includes: commenter name, project/task title. See [Notifications](#12-notifications). |

---

## 12. Notifications

### 12.1 Receiving Notifications

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| NOTIF-01 | P0 | As a user, I want to receive real-time notifications for: task assignments, task completions, and @mentions. | Three types: `task_assigned`, `task_completed`, `mention`. Never triggered by user's own actions. |
| NOTIF-02 | P0 | As a user, I want to see an unread notification count badge in the app navigation. | Badge shows count. Refreshes periodically (every ~30 seconds) and on real-time events. |
| NOTIF-03 | P0 | As a user, I want to open a notification center listing all my notifications. | Each notification shows: unread indicator, message text, type-specific color/icon, relative time. |
| NOTIF-04 | P0 | As a user, I want to tap a notification to navigate to the related task or project. | Tapping marks notification as read and navigates to context. |

### 12.2 Managing Notifications

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| NOTIF-05 | P1 | As a user, I want to mark a single notification as read. | Read status synced to server. |
| NOTIF-06 | P1 | As a user, I want to mark all notifications as read at once. | "Mark all read" action in notification center. |
| NOTIF-07 | P1 | As a user, I want to clear all notifications. | "Clear all" action in notification center. |

### 12.3 Notification Storage

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| NOTIF-08 | P0 | As a user, I want up to 100 notifications stored server-side so that I have a history of recent events. | Server caps at 100 per user. |
| NOTIF-09 | P1 | As a user, I want a connection status indicator so that I know if real-time updates are working. | Shows "Connected" / "Disconnected" in notification center. |

---

## 13. Version Tracking & Changelog

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| VER-01 | P1 | As a user, I want to see a banner when there's a new app version I haven't reviewed yet. | Banner shown until dismissed or changelog viewed. |
| VER-02 | P1 | As a user, I want to be taken to the changelog on first login after a version update. | Redirect if `lastSeenVersion !== currentVersion`. |
| VER-03 | P1 | As a user, I want the changelog screen to show version history with feature highlights. | Reverse chronological list. Viewing the screen marks version as "seen" (banner/redirect stop). |
| VER-04 | P2 | As a user, I want to see the current app version in the navigation area. | Display version string (e.g., "α 1.1"). |

---

## 14. Admin Panel

### 14.1 Access & Overview

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| ADMIN-01 | P0 | As an admin, I want an admin section accessible only to admin-role users. | Non-admins cannot see or access admin screens. |
| ADMIN-02 | P1 | As an admin, I want to see system stats: total users, projects, tasks, clients, completed tasks, pending tasks, admin count, regular user count. | Dashboard-style overview at top of admin section. |

### 14.2 User Management

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| ADMIN-03 | P0 | As an admin, I want to view all users with their email, role, project/task counts, version seen, and created date. | Scrollable user list with all fields. |
| ADMIN-04 | P0 | As an admin, I want to create a new user with name, email, password (min 8 chars), and optional role. | Form with validation. New user appears in list. |
| ADMIN-05 | P1 | As an admin, I want to edit a user's email, reset their password, toggle their role (user/admin), and set their last-seen version. | Each field independently editable. |
| ADMIN-06 | P1 | As an admin, I want to delete a user. | Confirmation required. |

### 14.3 Entity Management

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| ADMIN-07 | P1 | As an admin, I want to view and manage all projects (edit, delete, archive). | Project management list with actions. |
| ADMIN-08 | P1 | As an admin, I want to view and manage all tasks (edit, delete, toggle completion). | Task management list with actions. |
| ADMIN-09 | P1 | As an admin, I want to view and manage all clients (edit, delete). | Client management list with actions. |
| ADMIN-10 | P1 | As an admin, I want to delete any comment. | Admin override: delete button visible on all comments, not just own. |

### 14.4 Maintenance Mode

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| ADMIN-11 | P1 | As an admin, I want to toggle maintenance mode on/off. | Toggle takes effect immediately (no restart). |
| ADMIN-12 | P0 | As an admin, I want maintenance mode to block all write operations for non-admin users while keeping the app accessible to me. | Non-admin users see a maintenance screen. Admins can use the app normally. |
| ADMIN-13 | P0 | As a non-admin user, I want to see a clear maintenance notice when the system is in maintenance mode. | Static screen explaining temporary unavailability. |

---

## 15. Navigation & General UX

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| NAV-01 | P0 | As a logged-in user, I want primary navigation to: Projects, Clients, Tasks (My Tasks), Dashboard, and Team. | Tab bar or equivalent navigation. All destinations accessible from any screen. |
| NAV-02 | P0 | As an admin, I want an Admin entry point in the navigation. | Visible only to admin-role users. |
| NAV-03 | P0 | As a user, I want the current screen clearly indicated in the navigation so that I know where I am. | Active tab/link visually distinguished. |
| NAV-04 | P0 | As a user, I want the notification bell accessible from the navigation. | Badge with unread count always visible. |
| NAV-05 | P0 | As an unauthenticated user, I want to see only the login screen. | Minimal screen with login form and Microsoft OAuth. Root/launch screen redirects to login if not authenticated. No public signup. |
| NAV-06 | P1 | As a user, I want consistent avatar colors per team member across the app. | Hash-based color assignment (8 colors). Same name always maps to same color. |
| NAV-07 | P1 | As a user, I want loading indicators while data is being fetched. | Skeleton placeholders or spinners during data load. Inline save indicators during mutations. |
| NAV-08 | P1 | As a user, I want helpful empty states when there's no data. | Descriptive message (e.g., "No tasks yet") with optional action (e.g., "Create one"). |
| NAV-09 | P1 | As a user, I want all dates displayed in a consistent, readable format. | Absolute dates: "Mar 16, 2026" style. Recent timestamps: relative ("5m ago", "2h ago"). All in UTC. |
| NAV-10 | P1 | As a user, I want urgency levels to be visually distinct throughout the app. | Each level (Low/Medium/High/Critical) has a unique color and icon/emoji. Priority order: Critical > High > Medium > Low. |

---

## 16. Mobile-Specific Requirements

> These stories have no web equivalent. They address native mobile expectations.

### 16.1 Push Notifications

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| MOB-01 | P0 | As a user, I want to receive push notifications on my phone for task assignments, completions, and @mentions so that I'm informed even when the app isn't open. | Push replaces/complements the web's SSE. Same three notification types. Same self-action suppression rules. Tapping a push opens the relevant task/project in the app. |
| MOB-02 | P1 | As a user, I want to control my push notification preferences (e.g., mute certain types). | Settings screen for toggling: task_assigned, task_completed, mention notifications. |
| MOB-03 | P2 | As a user, I want push notifications to show a preview with the notification message. | Rich notification with title (type) and body (message text). |

### 16.2 Offline & Connectivity

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| MOB-04 | P1 | As a user, I want to view previously loaded data when I lose connectivity so that the app isn't blank. | Cached project list, task list, and client list available offline. Clear indicator when offline ("No connection — showing cached data"). |
| MOB-05 | P1 | As a user, I want the app to recover gracefully when connectivity returns. | Auto-refresh stale data. Retry failed mutations. No manual reload needed. |
| MOB-06 | P2 | As a user, I want to toggle task completion and add comments while offline, with changes syncing when I'm back online. | Optimistic local state. Queued mutations. Conflict resolution: server wins on conflict. |

### 16.3 Biometric Authentication

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| MOB-07 | P1 | As a user, I want to unlock the app with Face ID or fingerprint after initial login so that I can get in faster. | Biometric prompt on app open (if session valid). Falls back to email/password if biometric fails or isn't available. |
| MOB-08 | P2 | As a user, I want to enable/disable biometric login from my profile settings. | Toggle in profile/settings screen. |

### 16.4 Deep Linking

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| MOB-09 | P1 | As a user, I want to tap a link to a project or task (e.g., from a push notification, email, or shared link) and land directly on the right screen in the app. | Supports: `/projects/[id]`, `/tasks/[id]`, `/clients/[id]`, `/users/[id]`. Falls back to login if not authenticated. |

### 16.5 Native Interactions

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| MOB-10 | P1 | As a user, I want to pull-to-refresh on any list screen to reload data. | Pull gesture triggers data refresh. Spinner shown during reload. |
| MOB-11 | P1 | As a user, I want tappable phone numbers to open the dialer and tappable emails to open the mail app. | Client email → mail compose. Client phone → dialer. Uses OS-level `tel:` and `mailto:` schemes. |
| MOB-12 | P2 | As a user, I want to share a project or task via the native share sheet so that I can send links to colleagues. | Share action generates a deep link. Uses OS share sheet. |
| MOB-13 | P2 | As a user, I want haptic feedback on key interactions (completing a task, archiving a project). | Subtle haptic on completion toggle and archive gesture. |

### 16.6 App Lifecycle

| ID | Priority | User Story | Acceptance Criteria |
|---|---|---|---|
| MOB-14 | P1 | As a user, I want the app to preserve my scroll position and navigation state when I switch away and come back. | State restored on app foreground. No unnecessary data reload if data is fresh. |
| MOB-15 | P2 | As a user, I want the app to show a splash screen on cold start and transition smoothly to content. | Branded splash screen. Transition to last-known screen or login. |

---

## 17. Data Model Reference

> All entities and their fields. Use this to design your local models and API contracts.

### User
| Field | Type | Required | Notes |
|---|---|---|---|
| id | Int | Auto | Primary key, auto-increment |
| email | String | Yes | Unique |
| name | String | Yes | Display name |
| password | String | No | Nullable (OAuth users have no password) |
| salt | String | No | Nullable (OAuth users) |
| role | Enum | Yes | `"user"` or `"admin"` |
| createdAt | DateTime | Auto | |
| lastSeenVersion | String | No | Tracks which app version user has seen |

### Project
| Field | Type | Required | Notes |
|---|---|---|---|
| id | Int | Auto | Primary key |
| title | String | Yes | |
| clientId | Int | No | FK → Client |
| body | String | Yes | Description / overview |
| userId | Int | Yes | FK → User (project manager) |
| archived | Boolean | Yes | Default: false |
| milestone | DateTime | No | Legacy single milestone field |
| mbaNumber | String | Yes | Default: "" |
| coFileNumbers | String | Yes | Comma-separated. Default: "" |
| dldReviewer | String | Yes | Default: "" |
| createdAt | DateTime | Auto | |

### Task
| Field | Type | Required | Notes |
|---|---|---|---|
| id | Int | Auto | Primary key |
| title | String | Yes | |
| completed | Boolean | Yes | Default: false |
| completedAt | DateTime | No | Set on completion, cleared on un-completion |
| urgency | Enum | Yes | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. Default: MEDIUM |
| userId | Int | Yes | FK → User (assigned to) |
| assignedById | Int | No | FK → User (who assigned it) |
| projectId | Int | No | FK → Project. Default: 0 |
| createdAt | DateTime | Auto | |
| updatedAt | DateTime | Auto | Auto-updated on change |

### Client
| Field | Type | Required | Notes |
|---|---|---|---|
| id | Int | Auto | Primary key |
| name | String | Yes | |
| companyName | String | No | |
| email | String | Yes | |
| phone | String | No | |
| address | String | No | |
| createdAt | DateTime | Auto | |
| updatedAt | DateTime | Auto | |

### Milestone
| Field | Type | Required | Notes |
|---|---|---|---|
| id | Int | Auto | Primary key |
| date | DateTime | Yes | Deadline |
| item | String | Yes | Description |
| completed | Boolean | Yes | Default: false |
| apfo | Boolean | Yes | Default: false |
| projectId | Int | Yes | FK → Project |
| createdAt | DateTime | Auto | |

### Comment
| Field | Type | Required | Notes |
|---|---|---|---|
| id | Int | Auto | Primary key |
| email | String | Yes | Author's email |
| body | String | Yes | 1–1000 characters |
| projectId | Int | No | FK → Project (null if task comment) |
| taskId | Int | No | FK → Task (null if project comment) |
| userId | Int | Yes | FK → User (author) |
| createdAt | DateTime | Auto | |

### Mention
| Field | Type | Required | Notes |
|---|---|---|---|
| id | Int | Auto | Primary key |
| commentId | Int | Yes | FK → Comment |
| userId | Int | Yes | FK → User (mentioned user) |
| createdAt | DateTime | Auto | |
| | | | Unique constraint: (commentId, userId) |

### Notification
| Field | Type | Required | Notes |
|---|---|---|---|
| id | Int | Auto | Primary key |
| mentionId | Int | Yes | FK → Mention |
| userId | Int | Yes | FK → User (recipient) |
| type | String | Yes | `"mention"`, `"task_assigned"`, `"task_completed"` |
| message | String | Yes | Human-readable text |
| read | Boolean | Yes | Default: false |
| createdAt | DateTime | Auto | |

### Relationships
```
User 1──* Project       (manager)
User 1──* Task          (assigned to)
User 1──* Task          (assigned by)
User 1──* Comment       (author)
User 1──* Mention       (mentioned user)
User 1──* Notification  (recipient)
Client 1──* Project
Project 1──* Task
Project 1──* Milestone
Project 1──* Comment
Task 1──* Comment
Comment 1──* Mention
Mention 1──* Notification
```

---

## 18. API Contract Reference

> **Status: IMPLEMENTED.** All REST endpoints are live under `/api/v1/`. Full reference with request/response examples: [`docs/API.md`](docs/API.md).

### Web-only Endpoints (unchanged)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/auth/microsoft` | Initiate Microsoft OAuth (redirect) |
| GET | `/api/auth/callback/microsoft` | OAuth callback (redirect) |
| GET | `/api/notifications/stream?userId={id}` | SSE real-time notifications |
| GET | `/api/notifications/user/{userId}` | Fetch stored notifications |
| DELETE | `/api/notifications/user/{userId}?notificationId={id}` | Delete notification(s) |
| POST | `/api/notifications/demo` | Trigger demo notification |
| GET | `/api/users/by-name?name={name}` | Resolve username → user |

### REST API v1 — `/api/v1/`

**Authentication:** All endpoints (except login) require `Authorization: Bearer <token>` header or session cookie. The login endpoint returns the token in the response body.

**Response format:** `{ "data": <payload> }` on success, `{ "error": { "message": "...", "details": { ... } } }` on error.

**Pagination:** List endpoints return results in pages (20 items per page by default) instead of everything at once. Use `?page=1&limit=20` query params. Response includes `items` (the page of results), `total` (total count across all pages), `page`, `limit`, and `hasMore` (boolean — `true` if more pages exist, use for infinite scroll). See `docs/API.md` for full details.

**Status codes:** 200 (ok), 201 (created), 204 (no content), 400 (bad input), 401 (no auth), 403 (not admin), 404 (not found), 503 (maintenance).

#### Auth
| Operation | Method | Endpoint | Notes |
|---|---|---|---|
| Sign in | POST | `/api/v1/auth/login` | Returns `{ token, user }` — store token for Bearer auth |
| Log out | POST | `/api/v1/auth/logout` | Destroys session (204) |
| Get current user | GET | `/api/v1/auth/me` | Returns user profile |
| Update profile | PATCH | `/api/v1/auth/me` | Body: `{ name }` |
| Change password | PUT | `/api/v1/auth/password` | Body: `{ currentPassword, newPassword }` |
| Version check | GET | `/api/v1/auth/version` | Returns `{ currentVersion, lastSeenVersion, needsAck }` |
| Mark version seen | POST | `/api/v1/auth/version` | Sets `lastSeenVersion = APP_VERSION` |

#### Projects
| Operation | Method | Endpoint | Notes |
|---|---|---|---|
| List projects | GET | `/api/v1/projects` | Query: `?query=&userId=&includeArchived=true` |
| Create project | POST | `/api/v1/projects` | Full body with milestones array |
| Get project | GET | `/api/v1/projects/{id}` | Includes clientRef, milestones |
| Update project | PUT | `/api/v1/projects/{id}` | Full replacement including milestones |
| Delete project | DELETE | `/api/v1/projects/{id}` | 204 |
| Update field | PATCH | `/api/v1/projects/{id}/field` | Body: `{ field, value }` — body/mbaNumber/coFileNumbers/dldReviewer |
| Archive toggle | PUT | `/api/v1/projects/{id}/archive` | Body: `{ archived: true\|false }` |
| Add milestone | POST | `/api/v1/projects/{id}/milestones` | Body: `{ date, item, apfo }` |

#### Tasks
| Operation | Method | Endpoint | Notes |
|---|---|---|---|
| List tasks | GET | `/api/v1/tasks` | Query: `?userId=&projectId=` |
| Create task | POST | `/api/v1/tasks` | Sends `task_assigned` notification |
| Get task | GET | `/api/v1/tasks/{id}` | Includes User, Project, AssignedBy |
| Update task | PUT | `/api/v1/tasks/{id}` | Full replacement |
| Delete task | DELETE | `/api/v1/tasks/{id}` | 204 |
| Toggle completion | PATCH | `/api/v1/tasks/{id}/complete` | Body: `{ completed }` — sends `task_completed` notification |

#### Clients
| Operation | Method | Endpoint | Notes |
|---|---|---|---|
| List clients | GET | `/api/v1/clients` | Query: `?query=` |
| Create client | POST | `/api/v1/clients` | Body: `{ name, email, companyName?, phone?, address? }` |
| Get client | GET | `/api/v1/clients/{id}` | Includes projects |
| Update client | PUT | `/api/v1/clients/{id}` | Full replacement |
| Delete client | DELETE | `/api/v1/clients/{id}` | 204 |
| Update field | PATCH | `/api/v1/clients/{id}/field` | Body: `{ field, value }` — companyName/address |

#### Users
| Operation | Method | Endpoint | Notes |
|---|---|---|---|
| List users | GET | `/api/v1/users` | Strips password/salt |
| Get user | GET | `/api/v1/users/{id}` | Strips password/salt |

#### Comments
| Operation | Method | Endpoint | Notes |
|---|---|---|---|
| List comments | GET | `/api/v1/comments` | Query: `?projectId=` or `?taskId=` (one required) |
| Create comment | POST | `/api/v1/comments` | Body: `{ body, projectId?, taskId? }` — auto-parses @mentions |
| Delete comment | DELETE | `/api/v1/comments/{id}` | Author or admin only (403 otherwise) |

#### Milestones
| Operation | Method | Endpoint | Notes |
|---|---|---|---|
| Update milestone | PUT | `/api/v1/milestones/{id}` | Body: `{ date?, item?, apfo? }` — all optional |
| Delete milestone | DELETE | `/api/v1/milestones/{id}` | 204 |
| Toggle completion | PATCH | `/api/v1/milestones/{id}/complete` | Body: `{ completed }` |

#### Notifications
| Operation | Method | Endpoint | Notes |
|---|---|---|---|
| List notifications | GET | `/api/v1/notifications` | Query: `?limit=` (default 50, max 100) |
| Unread count | GET | `/api/v1/notifications/count` | Returns `{ count }` |
| Mark all read | POST | `/api/v1/notifications/read-all` | Clears DB + Redis |
| Mark single read | POST | `/api/v1/notifications/{id}/read` | |

#### Admin (requires `role: "admin"`)
| Operation | Method | Endpoint | Notes |
|---|---|---|---|
| System stats | GET | `/api/v1/admin/stats` | User/project/task/client counts |
| List users | GET | `/api/v1/admin/users` | Same as /users but admin-gated |
| Create user | POST | `/api/v1/admin/users` | Body: `{ name, email, password, role? }` |
| Delete user | DELETE | `/api/v1/admin/users/{id}` | Cannot delete self |
| Update role | PUT | `/api/v1/admin/users/{id}/role` | Body: `{ role }` |
| Update email | PUT | `/api/v1/admin/users/{id}/email` | Body: `{ email }` |
| Reset password | PUT | `/api/v1/admin/users/{id}/password` | Body: `{ password }` — server hashes |
| Update version | PUT | `/api/v1/admin/users/{id}/version` | Body: `{ version }` — null to reset |
| Delete project | DELETE | `/api/v1/admin/projects/{id}` | 204 |
| Delete task | DELETE | `/api/v1/admin/tasks/{id}` | 204 |
| Delete client | DELETE | `/api/v1/admin/clients/{id}` | 204 |
| Get maintenance | GET | `/api/v1/admin/maintenance` | Returns `{ enabled }` |
| Set maintenance | PUT | `/api/v1/admin/maintenance` | Body: `{ enabled }` |

---

## Summary

| Domain | Stories | P0 | P1 | P2 |
|---|---|---|---|---|
| Authentication & Account | 11 | 6 | 5 | 0 |
| Projects | 21 | 9 | 11 | 1 |
| Tasks | 14 | 10 | 4 | 0 |
| My Tasks | 3 | 2 | 1 | 0 |
| Dashboard | 7 | 2 | 4 | 1 |
| Clients | 9 | 4 | 5 | 0 |
| Users / Team | 2 | 0 | 2 | 0 |
| Milestones | 5 | 3 | 2 | 0 |
| Comments & Mentions | 7 | 6 | 1 | 0 |
| Notifications | 9 | 5 | 4 | 0 |
| Version & Changelog | 4 | 0 | 3 | 1 |
| Admin | 13 | 5 | 8 | 0 |
| Navigation & General UX | 10 | 5 | 5 | 0 |
| Mobile-Specific | 15 | 1 | 8 | 6 |
| **Total** | **130** | **58** | **63** | **9** |

### Suggested Build Phases

**Phase 1 — MVP (58 stories, P0):**
Auth (login, OAuth, session — no public signup, admin creates users), project CRUD + detail + milestones, task CRUD + completion + notifications, my tasks view, dashboard KPIs + team board, client list + detail, comments + @mentions, notification center, admin access + user CRUD + maintenance mode, core navigation.

**Phase 2 — Full Feature Parity (63 stories, P1):**
Filtering/sorting across all lists, inline editing, archiving, profile management, team directory, push notification preferences, offline cached views, biometric auth, deep linking, pull-to-refresh, admin entity management, version tracking, dashboard advanced features.

**Phase 3 — Polish (9 stories, P2):**
Offline mutations with sync, native share sheet, haptic feedback, splash screen, idle team members notice, rich push previews, inline editing from project list.
