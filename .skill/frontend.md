# Frontend Architecture — FinCRM

## Overview

The frontend lives in `apps/web/` within the monorepo. It is a Next.js 16 application using React 19, Tailwind CSS v4, and TypeScript. The UI is a full Company Secretary CRM with landing page, authentication flows, and a multi-view dashboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/postcss`) |
| Animations | Motion (Framer Motion v13) |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Utilities | clsx, tailwind-merge, class-variance-authority |
| Package Manager | Yarn 4 (workspaces) |
| Build System | Turborepo |

## Directory Structure

```
apps/web/
  app/
    globals.css         # Tailwind v4 config, theme variables, Google Fonts
    layout.tsx          # Root layout with metadata
    page.tsx            # Main entry — routes between Landing/Auth/CRM
  components/
    ui-atoms.tsx        # StatusBadge, PriorityDot, Av (avatar), RoleBadge
    landing-page.tsx    # Marketing landing page
    auth-modal.tsx      # Login/Signup/CreateOrg/JoinOrg + PendingApprovalScreen
    crm-shell.tsx       # Main CRM layout (sidebar + header + view router)
    quick-add-modal.tsx # Task creation modal with Combobox
    notification-panel.tsx  # Notification dropdown
    role-assign-modal.tsx   # Member approval modal
    views/
      dashboard-view.tsx      # Stats cards, recent tasks, team workload
      tasks-view.tsx          # Task table with filters, status advancement
      clients-view.tsx        # Client list + detail panel
      team-view.tsx           # Employee cards with task stats
      reimbursements-view.tsx # Reimbursement table with approve/reject
      analytics-view.tsx      # Charts (area, bar, pie)
  lib/
    types.ts            # All TypeScript interfaces and type aliases
    utils.ts            # Helpers: cn(), formatters, RBAC, status configs
    data.ts             # Demo/seed data for all entities
  postcss.config.mjs    # PostCSS config for Tailwind v4
```

## Pages & Screens

### 1. Landing Page (`landing-page.tsx`)
- Fixed navbar with Sign In / Get Started
- Dark hero section with animated dashboard preview
- Feature cards (Task Pipeline, Client Registry, Team Operations, Reimbursements)
- RBAC explainer section with role descriptions
- CTA section + footer

### 2. Authentication (`auth-modal.tsx`)
- **Sign In**: Email/password with demo account quick-fill
- **Sign Up**: Choose between Create Org or Join Org
- **Create Organisation**: Registers user as Super Admin
- **Join Organisation**: Sends access request (goes to pending approval)
- **Pending Approval Screen**: Waiting state with step indicator

### 3. CRM Dashboard (`crm-shell.tsx` + views)
Dark sidebar with role-filtered navigation. Header with date, New Task button, and notification bell.

#### Dashboard View
- 4 stat cards: Total Tasks, Overdue, Revenue, Pending Reimbursements
- Recent tasks list with status bars
- Team workload progress bars
- Pending member approval banner (superadmin only)

#### Tasks View
- Status filter tabs (All/Pending/In Progress/Review/Done) with counts
- Search bar
- Full task table with columns: Task, Client, Assignee, Status, Priority, Due
- Hover-to-advance status button
- Role-based filtering (non-admins see only their tasks)

#### Clients View
- Searchable client list with revenue and completion stats
- Split-panel detail view showing: CIN, contact info, revenue, completion %, linked tasks
- Add Client form with CIN-optional adhoc support

#### Team View
- Employee cards in responsive grid
- Per-employee stats: Active/Done/Overdue counts
- Active task list per employee

#### Reimbursements View
- 3 summary cards: Total Submitted, Pending, Approved
- Submit Request form with client/task datalists
- Table with approve/reject actions (managers/admins only)
- Role-based visibility (own submissions only for non-admins)

#### Analytics View
- Monthly Task Volume (Area chart)
- Revenue by Client (Bar chart)
- Employee Performance (Horizontal bar chart)
- Status Distribution (Donut/Pie chart)

## Type System (`lib/types.ts`)

### Core Types
- `Role`: superadmin | manager | cs_executive | cs_trainee | viewer
- `View`: dashboard | tasks | clients | team | reimbursements | analytics
- `TaskStatus`: pending | in_progress | review | completed
- `Priority`: low | medium | high | urgent
- `ReimbStatus`: pending | approved | rejected

### Interfaces
- `AuthUser`: id, name, email, role, orgName, orgId, employeeId?, initials
- `Task`: id, taskType, clientId/Name, assigneeId/Name, status, priority, dueDate, isAdhoc, estimatedHours
- `Client`: id, name, type, cin, contact, email, phone, revenue, tasksTotal/Completed, isAdhoc
- `Employee`: id, name, role, email, initials
- `Reimbursement`: id, employeeId/Name, clientName, taskType, amount, description, date, status
- `Notification`: id, text, time, read

## RBAC System (`lib/utils.ts`)

Role-based access controls which views are visible and which actions are allowed:

| Role | Views | Can Add Task | Can Approve |
|------|-------|-------------|-------------|
| Super Admin | All 6 | Yes | Yes |
| Manager | All 6 | Yes | Yes |
| CS Executive | Dashboard, Tasks, Clients, Reimb | No | No |
| CS Trainee | Dashboard, Tasks, Reimb | No | No |
| Viewer | Dashboard, Analytics | No | No |

## Design System

- **Font**: DM Sans (body), JetBrains Mono (data/numbers)
- **Colors**: Neutral gray palette with dark sidebar (#0A0A0A)
- **Radius**: 0.5rem base (Tailwind theme)
- **Animations**: Motion for page transitions, modals, list items
- **Pattern**: Minimal, professional, monochrome with amber/red accents for alerts

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@techsec.in | admin123 |
| Manager | rohan@fincrm.io | pass123 |
| CS Executive | priya@fincrm.io | pass123 |
| CS Trainee | pooja@fincrm.io | pass123 |

## State Management

Currently client-side only using React `useState`. All data is seeded from `lib/data.ts`. Ready for Supabase integration — types align with the database schema in `packages/db/`.

## Build & Dev

```bash
# Dev server (port 3000)
yarn dev

# Production build
yarn build

# From root (turborepo)
turbo run dev
turbo run build
```
