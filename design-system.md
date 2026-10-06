# Design System

## 1. Overview

FinCRM is a multi-tenant CRM application for Indian professional services firms (CA/CS/legal). The frontend is a single-page Next.js app with a sidebar-based shell, dark primary palette, and a runtime-customizable theme system.

**Visual identity:** Monochrome primary palette (near-black + grays), semantic status colors from Tailwind defaults, Inter typeface, minimal shadows, rounded corners.

**Architecture:** All views render inside a single `CRMShell` component. No page-level routing beyond the shell — views are switched via local state with Framer Motion transitions.

---

## 2. Design Principles

_Derived from implementation patterns. Confidence: Medium._

1. **Monochrome-first** — Primary UI uses gray-900/white. Color reserved for status semantics.
2. **Density over whitespace** — Compact typography (14px default), tight spacing, data-dense tables.
3. **Flat hierarchy** — Minimal shadows (shadow-sm on cards, shadow-2xl on modals only). Borders over elevation.
4. **Convention via repetition** — No formal component library; patterns emerge from consistent inline Tailwind classes.
5. **Runtime theming** — Sidebar, navbar, accent, and page background colors are tenant-configurable at runtime.

---

## 3. Technology / Styling Architecture

| Layer | Tool | Version |
|---|---|---|
| Framework | Next.js | 16.2.0 |
| CSS | Tailwind CSS (v4, inline `@theme`) | 4.1 |
| PostCSS | @tailwindcss/postcss | 4.1 |
| Variant system | class-variance-authority (CVA) | 0.7.1 |
| Class merging | tailwind-merge + clsx | 3.6.0 / 2.1.1 |
| Animation | motion (Framer Motion) | 13.0.0 |
| Icons | lucide-react | 1.30.0 |
| Charts | recharts | 3.10.1 |

**No explicit `tailwind.config.ts`** — all theme tokens are defined via `@theme inline` in `apps/web/app/globals.css`.

**Key files:**
- CSS & tokens: `apps/web/app/globals.css`
- Theme provider: `apps/web/lib/theme-context.tsx`
- Utility helpers: `apps/web/lib/utils.ts`
- Types: `apps/web/lib/types.ts`

---

## 4. Design Tokens

### 4.1 Colors

#### Semantic CSS Variables (`:root` in `globals.css`)

| Token | Value | Purpose |
|---|---|---|
| `--background` | `#F4F4F4` | Page background |
| `--foreground` | `#0A0A0A` | Primary text |
| `--card` | `#ffffff` | Card surfaces |
| `--card-foreground` | `#0A0A0A` | Card text |
| `--popover` | `#ffffff` | Popover surfaces |
| `--popover-foreground` | `#0A0A0A` | Popover text |
| `--primary` | `#0A0A0A` | Primary action color |
| `--primary-foreground` | `#ffffff` | Text on primary |
| `--secondary` | `#EFEFEF` | Secondary surfaces |
| `--secondary-foreground` | `#0A0A0A` | Text on secondary |
| `--muted` | `#F0F0F0` | Muted backgrounds |
| `--muted-foreground` | `#6B6B6B` | Muted text |
| `--accent` | `#E8E8E8` | Accent surfaces |
| `--accent-foreground` | `#0A0A0A` | Text on accent |
| `--destructive` | `#C0392B` | Destructive actions |
| `--destructive-foreground` | `#ffffff` | Text on destructive |
| `--border` | `rgba(0,0,0,0.08)` | Default border |
| `--input` | `transparent` | Input border |
| `--input-background` | `#F7F7F7` | Input fill |
| `--ring` | `rgba(0,0,0,0.25)` | Focus ring |

#### Shell Variables (set at runtime by ThemeProvider)

| Token | Default | Purpose |
|---|---|---|
| `--sidebar` | `#0A0A0A` | Sidebar background |
| `--sidebar-foreground` | `#FAFAFA` | Sidebar text |
| `--navbar` | `#FFFFFF` | Navbar background |
| `--navbar-foreground` | `#111111` | Navbar text |

#### Status Colors (from `lib/utils.ts`, Tailwind utilities)

**Task Status:**

| Status | Badge classes | Bar color |
|---|---|---|
| TODO | `bg-gray-100 text-gray-500` | `bg-gray-300` |
| IN_PROGRESS | `bg-blue-50 text-blue-700` | `bg-blue-400` |
| WAITING_CLIENT | `bg-orange-50 text-orange-600` | `bg-orange-400` |
| REVIEW | `bg-amber-50 text-amber-700` | `bg-amber-400` |
| COMPLETED | `bg-emerald-50 text-emerald-700` | `bg-emerald-400` |
| CANCELLED | `bg-gray-100 text-gray-400` | `bg-gray-200` |

**Priority:**

| Priority | Dot color |
|---|---|
| LOW | `bg-gray-300` |
| MEDIUM | `bg-blue-400` |
| HIGH | `bg-orange-400` |
| URGENT | `bg-red-500` |

**Role Badges:**

| Role | Classes |
|---|---|
| OWNER | `bg-gray-900 text-white` |
| ADMIN | `bg-blue-50 text-blue-700` |
| MANAGER | `bg-purple-50 text-purple-700` |
| EMPLOYEE | `bg-amber-50 text-amber-700` |

**Reimbursement Status:**

| Status | Classes |
|---|---|
| PENDING | `bg-amber-50 text-amber-700` |
| APPROVED | `bg-emerald-50 text-emerald-700` |
| REJECTED | `bg-red-50 text-red-600` |
| PAID | `bg-blue-50 text-blue-700` |

**Payment Status:**

| Status | Classes |
|---|---|
| PENDING | `bg-amber-50 text-amber-700` |
| SUCCESS | `bg-emerald-50 text-emerald-700` |
| FAILED | `bg-red-50 text-red-600` |
| REFUNDED | `bg-blue-50 text-blue-700` |

**DSC Status:**

| Status | Classes |
|---|---|
| ACTIVE | `bg-emerald-50 text-emerald-700` |
| EXPIRING_SOON | `bg-amber-50 text-amber-700` |
| EXPIRED | `bg-red-50 text-red-600` |

Confidence: High — all defined in `lib/utils.ts` STATUS_CFG, PRIORITY_DOT, REIMB_CLS, and component files.

### 4.2 Typography

**Font Loading:** Google Fonts import in `globals.css` line 1.

| Family | Weights | Variable | Purpose |
|---|---|---|---|
| Inter | 400, 500, 600, 700 | `--font-sans` | All UI text |
| JetBrains Mono | 400, 500, 600 | `--font-mono` | Code, IDs, formatted text |

**Type Scale (CSS variables):**

| Token | Value | Usage |
|---|---|---|
| `--text-xs` | 0.75rem (12px) | Metadata, timestamps, badges, captions |
| `--text-sm` | 0.875rem (14px) | Default UI text, body, labels, buttons |
| `--text-md` | 1rem (16px) | Larger body, card titles |
| `--text-lg` | 1.125rem (18px) | Subsection headings |
| `--text-xl` | 1.25rem (20px) | Section titles |
| `--text-2xl` | 1.5rem (24px) | Page titles |
| `--text-3xl` | 1.875rem (30px) | Large/exceptional headings |

**Typography Utility Classes** (`globals.css`):

| Class | Size | Weight | Line-height |
|---|---|---|---|
| `.typo-page-title` | `--text-2xl` (24px) | 600 | 1.3 |
| `.typo-section-title` | `--text-xl` (20px) | 600 | 1.3 |
| `.typo-card-title` | `--text-md` (16px) | 600 | 1.4 |
| `.typo-body` | `--text-sm` (14px) | 400 | 1.5 |
| `.typo-body-lg` | `--text-md` (16px) | 400 | 1.5 |
| `.typo-label` | `--text-sm` (14px) | 500 | 1.4 |
| `.typo-caption` | `--text-xs` (12px) | 400 | 1.4 |
| `.typo-button` | `--text-sm` (14px) | 500 | 1 |

**Base body:** `font-size: var(--text-sm)` (14px), `line-height: 1.5`, `-webkit-font-smoothing: antialiased`.

Confidence: High — explicitly defined in `globals.css`.

### 4.3 Spacing

**Scale (CSS variables, 4px base):**

| Token | Value |
|---|---|
| `--space-1` | 0.25rem (4px) |
| `--space-2` | 0.5rem (8px) |
| `--space-3` | 0.75rem (12px) |
| `--space-4` | 1rem (16px) |
| `--space-5` | 1.25rem (20px) |
| `--space-6` | 1.5rem (24px) |
| `--space-8` | 2rem (32px) |
| `--space-10` | 2.5rem (40px) |
| `--space-12` | 3rem (48px) |
| `--space-16` | 4rem (64px) |

**Observed usage:** Components predominantly use Tailwind's default spacing utilities (`p-4`, `gap-3`, `space-y-4`) which align with this scale. The CSS variables exist but inline Tailwind classes are the dominant pattern.

Confidence: High (variables defined), Medium (actual usage is mixed between variables and Tailwind utilities).

### 4.4 Border Radius

| Token | Value | Derived from |
|---|---|---|
| `--radius` | 0.5rem (8px) | Base token |
| `--radius-sm` | calc(--radius - 4px) = 4px | Small controls |
| `--radius-md` | calc(--radius - 2px) = 6px | Medium controls |
| `--radius-lg` | var(--radius) = 8px | Default (cards, inputs) |
| `--radius-xl` | calc(--radius + 4px) = 12px | Large containers |

**Observed conventions:**

| Element | Radius used |
|---|---|
| Inputs | `rounded-lg` (8px) |
| Cards / filter bars | `rounded-lg` (8px) |
| Modals | `rounded-2xl` (16px) |
| Avatars | `rounded-full` |
| Badges | `rounded` (4px) or `rounded-full` |
| Buttons | `rounded-lg` (8px) or `rounded-xl` (12px) |

Confidence: High.

### 4.5 Borders

**Border color:** `border-border` applied globally via `* { @apply border-border; }` in globals.css.

| Context | Border pattern |
|---|---|
| Cards | `border border-gray-100` |
| Inputs | `border border-gray-200` |
| Table headers | `border-b border-gray-50` |
| Table rows | `divide-y divide-gray-50` |
| Modal headers | `border-b border-gray-100` |
| Navbar | `border-b` (uses default border color) |
| Sidebar active | 3px left bar, accent color |

Confidence: High.

### 4.6 Shadows

No custom shadow tokens defined. Uses Tailwind defaults:

| Level | Usage |
|---|---|
| `shadow-sm` | Cards, buttons, filter bars |
| `shadow-md` | Side panels |
| `shadow-2xl` | Modals, notification panel |

Confidence: High — no custom values, Tailwind defaults throughout.

### 4.7 Breakpoints

No custom breakpoints. Uses Tailwind v4 defaults:

| Breakpoint | Value | Observed usage |
|---|---|---|
| `sm` | 640px | Button text labels (`hidden sm:inline`) |
| `md` | 768px | Navbar date selector (`hidden md:flex`) |
| `lg` | 1024px | Grid columns (1→3-4 cols), main layout shifts |
| `xl` | 1280px | Not explicitly observed |
| `2xl` | 1536px | Not explicitly observed |

Confidence: High (sm, md, lg used), Low (xl, 2xl not observed).

### 4.8 Z-Index

Not formally established. No custom z-index tokens.

**Observed implicit layers:**

| Element | Observed z-value |
|---|---|
| Modal backdrop | `z-40` |
| Modal content | `z-50` |
| Side panel | `z-50` |
| Notification panel | Positioned absolute, no explicit z |

Confidence: Low — no formal system, values observed inline.

### 4.9 Motion

**Library:** `motion` (Framer Motion) v13.0.0

**Common patterns:**

| Pattern | Properties | Duration |
|---|---|---|
| Page transition | `opacity: 0→1, y: 4→0` | 0.12s |
| Modal entrance | `scale: 0.96→1, y: 16→0, opacity: 0→1` | 0.2s |
| Sidebar expand | `width: 68→200` | 0.2s |
| Notification dropdown | `y: -8→0, scale: 0.97→1, opacity: 0→1` | 0.14s |
| Side panel slide | `x: "100%"→0` | 0.25s |
| List stagger | delay per item: `i * 0.05` or `i * 0.02` | varies |
| Hover transitions | CSS `transition-colors` or `transition-all` | default |

**Easing curve:** `[0.23, 1, 0.32, 1]` (custom ease-out, used on modals and sidebar).

**Reduced motion:** Not currently implemented.

Confidence: High.

---

## 5. Layout System

### App Shell Structure

```
┌──────────┬──────────────────────────────────┐
│          │  Navbar (sticky)                  │
│ Sidebar  ├──────────────────────────────────┤
│ (fixed)  │  Content area (scrollable)        │
│ 68-200px │  p-5 (20px padding)              │
│          │                                   │
└──────────┴──────────────────────────────────┘
```

**Sidebar:** Fixed left, 68px collapsed, 200px expanded (hover-triggered animation).
**Navbar:** Sticky top, full width minus sidebar. Contains date range, help, notifications, add menu.
**Content:** `flex-1 overflow-auto`, 20px padding all sides.

**Source:** `apps/web/components/crm-shell.tsx`

### Common Page Layout

```
Page title (typo-page-title)
↓
Filter bar (bg-white rounded-lg p-3 shadow-sm border border-gray-100)
↓
Search input + action buttons
↓
Data table or card grid
```

Confidence: High — consistent across Tasks, Clients, Team, DSC, Reimbursements views.

---

## 6. Responsive System

| Breakpoint | Layout behavior |
|---|---|
| < 640px | Single column grids, button text hidden, sidebar collapsed |
| 640px (sm) | Button labels visible (`hidden sm:inline`) |
| 768px (md) | Navbar date selector visible (`hidden md:flex`) |
| 1024px (lg) | Multi-column grids (2→4 cols), full dashboard layout |

**Grid patterns observed:**
- Dashboard KPI: `grid-cols-2 lg:grid-cols-4`
- Dashboard main: `grid-cols-1 lg:grid-cols-4` (3+1 split)
- Team cards: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Reimbursement stats: `grid-cols-3` (always 3)

**Table responsive:** `overflow-x-auto` wrapper for horizontal scroll on small screens.

**Modal responsive:** `max-w-md` or `max-w-lg` with `p-4` wrapper for mobile breathing room.

Confidence: High.

---

## 7. Component Inventory

### UI Primitives (`components/ui-atoms.tsx`)

| Component | Purpose | Variants/Sizes |
|---|---|---|
| `StatusBadge` | Task status display | 6 statuses (TODO→CANCELLED) |
| `PriorityDot` | Priority indicator | 4 levels (LOW→URGENT) |
| `Av` (Avatar) | User initials circle | sm (24px), md (32px), lg (40px) |
| `RoleBadge` | User role display | 4 roles (OWNER→EMPLOYEE) |

### Form Components

| Component | File | Purpose |
|---|---|---|
| `Combobox` | `components/combobox.tsx` | Searchable dropdown with optional create |
| `DateRangeSelector` | `components/date-range-selector.tsx` | Date range with presets |
| `ClientKycForm` | `components/client-kyc-form.tsx` | KYC data entry (PAN, GST, address) |

### Modal Components

| Component | File | Size | Purpose |
|---|---|---|---|
| `AuthModal` | `components/auth-modal.tsx` | max-w-lg | Login/signup/OTP |
| `QuickAddModal` | `components/quick-add-modal.tsx` | max-w-md | Rapid task creation |
| `AddMemberModal` | `components/add-member-modal.tsx` | max-w-md | New team member |
| `EditMemberModal` | `components/edit-member-modal.tsx` | max-w-md | Edit team member |
| `RoleAssignModal` | `components/role-assign-modal.tsx` | max-w-sm | Approve pending member |
| `DscAddModal` | `components/dsc/dsc-add-modal.tsx` | large | Add DSC certificate |

### Application Components

| Component | File | Purpose |
|---|---|---|
| `CRMShell` | `components/crm-shell.tsx` | Main app shell (sidebar + navbar + views) |
| `NotifPanel` | `components/notification-panel.tsx` | Notification dropdown (w-80) |
| `DscStatusBadge` | `components/dsc/dsc-status-badge.tsx` | DSC validity indicator |

### View Components (`components/views/`)

| View | File | Pattern |
|---|---|---|
| Dashboard | `dashboard-view.tsx` | KPI grid + focus tasks |
| Tasks | `tasks-view.tsx` | Filter tabs + table + side panel |
| Clients | `clients-view.tsx` | List + expandable groups + KYC |
| Team | `team-view.tsx` | Card grid + action buttons |
| DSC | `dsc/dsc-view.tsx` | Table + inline edit |
| Reimbursements | `reimbursements-view.tsx` | Stat cards + tab panels |
| Analytics | `analytics-view.tsx` | Charts (recharts) |
| Data Import | `data-import-view.tsx` | Multi-step import flow |
| Configuration | `configuration-view.tsx` | Settings cards |
| Help | `help-view.tsx` | Documentation layout |

---

## 8. Component Patterns

### 8.1 Buttons

**Primary button:**
```
bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium
hover:bg-gray-800 transition-colors disabled:opacity-50
```

**Full-width submit:**
```
bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold
hover:bg-gray-800 transition-all
```

**Destructive:**
```
text-red-500 hover:text-red-600
```
or
```
bg-red-50 text-red-600 border border-red-200
```

**Ghost/icon button:**
```
text-gray-400 hover:text-gray-600
```

**Toggle group (role selector):**
```
Unchecked: border-2 border-gray-200 text-gray-500 hover:border-gray-300
Checked: border-2 border-gray-900 bg-gray-900 text-white
```

**States:** hover (bg-gray-800), disabled (opacity-50 cursor-not-allowed), loading (spinner + disabled).

Confidence: High.

### 8.2 Forms

**Label:**
```
block text-xs font-medium text-gray-500 mb-1
```
or uppercase variant:
```
text-xs text-gray-500 mb-0.5 uppercase tracking-wider
```

**Optional indicator:** `<span class="text-gray-300">(optional)</span>`

**Input (standard):**
```
w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all
```

**Input (compact):**
```
w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs
focus:outline-none focus:ring-2 focus:ring-gray-900/10
```

**Error message:**
```
text-xs text-red-500 mt-1
```

**Error alert box:**
```
text-xs text-red-600 flex items-center gap-1.5 bg-red-50 rounded-lg px-3 py-2
```

**Form context help:**
```
text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2
```

**Field spacing:** `space-y-4` or `space-y-3`
**Multi-column:** `grid grid-cols-2 gap-3`

Confidence: High.

### 8.3 Inputs

See 8.2. Additional patterns:

**Password input:** Type toggles password/text. Eye/EyeOff icon button at `absolute right-3 top-1/2 -translate-y-1/2`.

**Search input:** Search icon prefix, gray-900 border on focus.

**Date input:** Native `type="date"`, same styling as text input.

**Textarea:** Same border/focus styling, with `rows` attribute.

**Select (native):** Same styling as text input.

**Combobox:** Custom component with search, click-outside dismiss, check icon for selected, optional create.

### 8.4 Selects

Two patterns:
1. **Native `<select>`** — standard input styling, used for simple dropdowns (status, priority, assignee).
2. **Combobox component** — searchable, filterable, with optional async creation. Used for categories, clients, subcategories.

### 8.5 Cards

**Standard card (filter bar / stat card):**
```
bg-white border border-gray-100 rounded-lg p-3 shadow-sm
```

**KPI card (dashboard):**
```
bg-white border border-gray-100 rounded-xl p-4
hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer
```

**Content:** Icon (gray-300) + label (xs uppercase gray-400) + value (xl semibold) + subtext (xs gray-400).

### 8.6 Tables

**Container:** `overflow-x-auto`
**Table:** `w-full text-sm`

**Header:**
```
border-b border-gray-50 bg-gray-50/40
th: text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap
```

**Body:**
```
divide-y divide-gray-50
tr: hover:bg-gray-50/40 transition-colors
td: px-4 py-3
```

**Cell types:**
- Primary text: `text-gray-900 font-medium`
- Secondary: `text-gray-600 text-xs`
- Metadata: `text-gray-400 text-xs uppercase tracking-wider`
- Currency: right-aligned `text-xs text-gray-600 font-medium`, fmtINR()
- Date: `text-xs text-gray-400`, overdue in `text-red-500 font-semibold`

**Selected row:** `bg-gray-50`
**Actions column:** Right-aligned, icon buttons or dropdown select.

### 8.7 Modals

**Backdrop:**
```
fixed inset-0 bg-black/40 backdrop-blur-sm z-40
```

**Container:**
```
fixed inset-0 z-50 flex items-center justify-center p-4
```

**Card:**
```
bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100
```

**Header:**
```
flex items-center justify-between px-6 py-4 border-b border-gray-100
Title: text-base font-semibold
Close: X icon, text-gray-400 hover:text-gray-600
```

**Body:** `px-6 py-5 space-y-4`

**Animation:** `scale: 0.96→1, y: 16→0, opacity: 0→1`, duration 0.2s, easing `[0.23, 1, 0.32, 1]`.

### 8.8 Drawers

**Side panel (task detail):**
```
fixed top-0 right-0 h-full w-[420px] max-w-full
bg-white border-l border-gray-200 shadow-2xl z-50
```

**Backdrop:** `bg-black/20`
**Animation:** `x: "100%"→0`, duration 0.25s.
**Header:** Sticky, `px-5 py-4 border-b border-gray-50`.
**Content:** `flex-1 overflow-auto`.

### 8.9 Tabs

**Filter tabs (pill-style):**
```
Container: flex gap-1 bg-white rounded-lg p-1 border border-gray-100
Tab: px-3 py-1.5 rounded-md text-xs font-medium transition-colors
Active: bg-gray-900 text-white
Inactive: text-gray-500 hover:text-gray-700 hover:bg-gray-50
```

**Count badge on tab:** `ml-1 text-xs opacity-60`

Confidence: High — used in Tasks, Reimbursements views.

### 8.10 Navigation

**Sidebar item (collapsed):**
```
Icon centered, 18px, color from theme
Active: bg highlight ${sidebarFg}15, 3px left accent bar
Hover: bg ${sidebarFg}0A
Badge: small red circle top-right
```

**Sidebar item (expanded):**
```
Icon + label side-by-side, gap-3
Active: white text, accent left bar (rounded-r-full)
Badge: right-aligned pill (px-1.5 py-0.5 rounded-full)
```

**Badge colors:** Red (#EF4444) for task/reimbursement counts.

**User card (sidebar bottom):** Avatar + name + role, logout button.

### 8.11 Feedback

**Notification panel:** `w-80`, absolute positioned, `rounded-xl shadow-2xl`.
- Unread: blue dot + background tint.
- Time: "just now", "Xm ago", "Xh ago".
- Batch actions: checkbox + "Mark all read" / "Mark X read".

**Toasts:** Not formally implemented as a component. Inferred from Notification type but no dedicated toast system found.

Confidence: Medium (notification panel: High, toast: Low).

### 8.12 Loading

**Inline spinner:**
```
w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin
```

**Button loading:** Spinner replaces or accompanies text + `disabled opacity-60`.

**Full-page overlay:** Backdrop with centered spinner during initial data fetch.

**Loading text labels:** "Loading...", "Signing in...", "Creating...", "Adding...", "Verifying..."

### 8.13 Empty States

**Structure:** Centered, icon + primary message + secondary message + optional CTA.

```
Container: py-14 or py-16, text-center
Icon: 48-64px in bg-gray-50 rounded circle, icon color gray-300
Primary: text-sm text-gray-500
Secondary: text-xs text-gray-400
CTA: primary button
```

**Examples:**
- No tasks: ListTodo icon, "No active tasks", "Create your first task to get started", Add Task button.
- No matches (combobox): "No matches" inline text.
- No notifications: "No notifications" in gray-400.

### 8.14 Error States

**Form field error:** `text-xs text-red-500 mt-1` below the field.

**API error alert:**
```
text-xs text-red-600 flex items-center gap-1.5 bg-red-50 rounded-lg px-3 py-2
AlertCircle icon (14px)
```

**Disabled fields:** `opacity-50 cursor-not-allowed`.

---

## 9. Iconography

**Library:** lucide-react v1.30.0 (single library, no mixing).

**Sizes used:** 14px, 15px, 18px, 20px depending on context.

**Navigation icons:**
- LayoutDashboard, ListTodo, Building2, Users, Signature, Receipt, BarChart3, FileSpreadsheet, Settings, HelpCircle

**Action icons:**
- Plus, X, Pencil, Trash2, Check, CheckCircle2, UserCheck, UserX

**Status/info icons:**
- AlertCircle, Lock, Clock, Eye, EyeOff, Bell, LogOut, Loader2, ChevronDown, Calendar, Search, History, IndianRupee, TrendingUp

**Convention:** Icons always paired with text labels in navigation and buttons. Icon-only buttons use `title` attribute for context.

Confidence: High.

---

## 10. Images & Illustrations

**Logo:** Custom org logo via ThemeProvider (`logoUrl`) or fallback icon.

**Avatars:** Generated from initials using `Av` component (no image avatars).

**Empty state graphics:** Lucide icons in gray-50 circle backgrounds (no custom illustrations).

**No product imagery, background images, or custom SVG illustrations found.**

Confidence: High.

---

## 11. Forms & Validation

### Validation System

**Library:** Custom validators in `apps/web/lib/validations.ts` (inferred from imports).

**Pattern:** Each validator returns `{ valid: boolean, error?: string }`.

**Available validators:**
- `validateName()` — 1-100 characters
- `validateEmail()` — Email format
- `validatePhone()` — 10 digits
- `validatePAN()` — 10 uppercase alphanumeric
- `validateGSTIN()` — GST format
- `validateLLPIN()` — LLPIN format

**Validation timing:** Real-time (on change or blur), error shown immediately.

### Visual Convention

- Error text below field: `text-xs text-red-500 mt-1`
- Submit disabled when validation errors exist
- Required fields: `*` in label or implied by required attribute
- Optional fields: `(optional)` in gray-300

### Common Form Patterns

| Pattern | Usage |
|---|---|
| Full-width stacked fields | Most modals |
| 2-column grid (`grid-cols-2 gap-3`) | Phone + Position, Address fields |
| Inline expanding form | DSC edit, reimbursement create |
| Searchable combobox | Category, client, subcategory selection |

---

## 12. Data Display

### Currency Formatting

`fmtINR()` utility — formats numbers in Indian Rupee (INR) with IndianRupee icon.

### Date Formatting

`fmtDate()` utility — formats dates for display.
Overdue dates: `text-red-500 font-semibold`.

### Status Display

All statuses use `StatusBadge` component: `px-2 py-0.5 rounded text-xs font-medium` with semantic colors.

### Priority Display

`PriorityDot` component: colored 6px circle + label text (`text-xs text-gray-400`).

### Number Display

KPI values: `text-xl font-semibold` (or larger for emphasis).
Table numbers: `text-xs text-gray-600 font-medium`.

---

## 13. Page Patterns

### Pattern 1: List/Filter Page

**Structure:** Header → Filter tabs → Search + action button → Table → (optional side panel)

**Used in:** Tasks, Clients, DSC, Reimbursements, Team

**Key elements:**
- Filter bar: `bg-white border border-gray-100 rounded-lg p-3 shadow-sm`
- Pill tabs for status filtering
- Search input with icon
- Primary "Add" button (black)
- Data table with standard styling
- Empty state centered in table area

### Pattern 2: Dashboard / KPI Overview

**Structure:** Greeting → 4-card KPI grid → Main content (focus tasks + team workload)

**Used in:** Dashboard

**Key elements:**
- KPI cards: `grid-cols-2 lg:grid-cols-4 gap-3`
- Main content: `grid-cols-1 lg:grid-cols-4` (3+1 split)
- Staggered animation on cards

### Pattern 3: Modal Form

**Structure:** Backdrop → Centered card → Header/Body/Footer

**Used in:** All modals (Add Member, Quick Add, Auth, etc.)

**Key elements:**
- Consistent card styling (`rounded-2xl shadow-2xl max-w-md`)
- Header with title + close button
- Body with stacked form fields
- Submit button at bottom

### Pattern 4: Side Panel Detail

**Structure:** Right-slide panel over content

**Used in:** Task detail

**Key elements:**
- 420px width, full height
- Slide-in animation from right
- Sticky header, scrollable content
- Backdrop dismiss

---

## 14. Product-Specific Patterns

### Task Workflow

Status progression: `TODO → IN_PROGRESS → WAITING_CLIENT → REVIEW → COMPLETED`
Alternative: Any status → `CANCELLED`
Visual: `STATUS_NEXT` map defines valid transitions.

Tasks can be **locked** (no status changes allowed) — shown with Lock icon.

### Client Groups

Clients can have sub-entities (groups) for multi-location/entity firms.
Displayed as expandable nested items under client card.
Dropdown format: "Group — Client" for task assignment.

### KYC Compliance (India-specific)

Dedicated form for Indian business compliance fields: PAN, GSTIN, DIN, CIN, LLPIN, GST state codes, address.

### DSC Management

Digital signature certificates tracked with validity dates.
Auto-computed status: ACTIVE / EXPIRING_SOON (within 30 days) / EXPIRED.

### Role-Based Access

Views filtered by role via `ROLE_VIEWS` lookup in shell.
Action buttons conditionally rendered based on `can()` helper (checks OWNER/ADMIN/MANAGER).
Configuration view: OWNER only.

### Reimbursement Workflow

Employee submits → Manager/Admin reviews (Approve/Reject) → PAID status.

### Payment Tracking

Per-task payments with status tracking (PENDING → SUCCESS).
OWNER/ADMIN can create and mark payments as paid.

---

## 15. Accessibility

### Implemented

- Semantic HTML: `<button>`, `<form>`, `<table>`, `<nav>` used correctly
- Input types: `email`, `password`, `date`, `number` for appropriate fields
- Labels: Block labels above inputs with `htmlFor` or implicit association
- Focus rings: `focus:ring-2 focus:ring-gray-900/10` on inputs, `focus-visible:ring-2` on buttons
- Password toggle: Proper `<button>` element (not div)
- Icon buttons: `title` attributes for context
- Font sizes: Minimum 12px (`--text-xs`)
- Color contrast: Primary text (gray-900 on white) passes WCAG AA

### Not Implemented / Limited

- No `aria-live` regions for dynamic content (notifications, loading states)
- No explicit focus trap in modals (relies on backdrop click dismiss)
- No `aria-label` on most icon-only buttons (uses `title` instead)
- No skip-to-content link
- No reduced-motion media query support
- Keyboard navigation: Natural tab order, but no explicit Escape key handlers for modals

Confidence: High (for what exists and what doesn't).

---

## 16. Content & Copy

### Tone

Professional, direct, action-oriented. CRM/compliance terminology used without explanation.

### Page Titles

Single or two-word nouns: "Dashboard", "Tasks", "Clients", "Team", "DSC", "Reimbursements", "Analytics", "Configuration", "Help & Guide". Defined in `PAGE_TITLE` constant.

### Button Labels

Verb-first for actions: "Add Task", "Add Client", "Add Member", "Submit Request", "Mark Paid", "Approve", "Reject", "Save".

### Placeholders

Descriptive, example-based: "Search tasks...", "John Doe", "john@yourfirm.in", "e.g. CA", "9876543210", "ABCDE1234F".

### Validation Messages

Specific to rule: "Name must be 1-100 characters", "Invalid email format", "Phone number must be 10 digits", "PAN must be 10 characters (uppercase)", "Password must be at least 8 characters".

### Empty States

Icon + primary message + secondary message + CTA pattern. Tone: helpful, instructional ("Create your first task to get started").

### Form Help Text

Context boxes in modals: "Create login credentials for the new member. They can sign in immediately with these credentials."

---

## 17. Animation & Interaction

See section 4.9 Motion for full details.

**Summary:**
- Page transitions: Fast fade+slide (0.12s)
- Modal/drawer: Scale+slide with custom easing (0.2s)
- Sidebar: Width animation on hover (0.2s)
- Lists: Staggered delays (0.02-0.05s per item)
- Hover: CSS `transition-colors` or `transition-all`
- No CSS keyframe animations defined
- No reduced-motion support

---

## 18. Design Inconsistencies

### Inconsistency 1: Border Radius

| Pattern | Observed values | Files |
|---|---|---|
| Buttons | `rounded-lg` (8px), `rounded-xl` (12px) | Various modals |
| Cards | `rounded-lg` (8px), `rounded-xl` (12px) | Dashboard vs filter bars |

**Frequency:** Moderate. **Likely convention:** `rounded-lg` for controls, `rounded-xl` for KPI cards. **Confidence:** Medium.

### Inconsistency 2: Input Padding

| Pattern | Observed values | Files |
|---|---|---|
| Standard inputs | `px-3 py-2.5` | Modal forms |
| Compact inputs | `px-2.5 py-1.5` | KYC form, inline forms |

**Frequency:** Consistent within context (compact for dense forms, standard for modals). **Likely convention:** Two intentional sizes. **Confidence:** Medium.

### Inconsistency 3: Label Styling

| Pattern | Observed values | Files |
|---|---|---|
| Form labels | `text-xs font-medium text-gray-500 mb-1` | Most modals |
| Uppercase labels | `text-xs text-gray-500 mb-0.5 uppercase tracking-wider` | Some forms |
| Table headers | `text-xs font-medium text-gray-400 uppercase tracking-wider` | Tables |

**Frequency:** Mixed. **Likely convention:** Uppercase for table headers and some form sections, sentence-case for standard form labels. **Confidence:** Medium.

### Inconsistency 4: Focus Ring Opacity

| Pattern | Observed values | Files |
|---|---|---|
| Input focus | `focus:ring-gray-900/10` | Most inputs |
| Button focus | `focus-visible:ring-gray-900/20` | Some buttons |

**Frequency:** Low. **Likely convention:** 10% opacity for inputs, 20% for buttons. **Confidence:** Low — may be intentional.

### Inconsistency 5: No Unified Button Component

Buttons are implemented inline with repeated Tailwind classes rather than a shared `<Button>` component. CVA is installed but not used for buttons.

**Frequency:** Throughout entire codebase. **Likely convention:** Inline classes. **Confidence:** High that this is the current approach (not an inconsistency per se, but a consolidation opportunity).

---

## 19. Existing Component Mapping

When implementing new UI, reuse these existing components:

| Need | Use | Import |
|---|---|---|
| Task status badge | `StatusBadge` | `@/components/ui-atoms` |
| Priority indicator | `PriorityDot` | `@/components/ui-atoms` |
| User avatar | `Av` | `@/components/ui-atoms` |
| Role badge | `RoleBadge` | `@/components/ui-atoms` |
| Searchable dropdown | `Combobox` | `@/components/combobox` |
| Date range picker | `DateRangeSelector` | `@/components/date-range-selector` |
| KYC form | `ClientKycForm` | `@/components/client-kyc-form` |
| DSC status | `DscStatusBadge` | `@/components/dsc/dsc-status-badge` |
| Notification panel | `NotifPanel` | `@/components/notification-panel` |
| Status colors | `STATUS_CFG` | `@/lib/utils` |
| Priority colors | `PRIORITY_DOT` | `@/lib/utils` |
| Reimbursement colors | `REIMB_CLS` | `@/lib/utils` |
| Permission check | `can()` | `@/lib/utils` |
| Currency format | `fmtINR()` | `@/lib/utils` |
| Date format | `fmtDate()` | `@/lib/utils` |
| Class merging | `cn()` | `@/lib/utils` (clsx + tailwind-merge) |

---

## 20. Recommended Design Tokens

_These are recommendations only, not current implementations._

### Consider Standardizing

1. **Button component** — Extract repeated button classes into a CVA-based `<Button>` component with variants (primary, secondary, destructive, ghost) and sizes (sm, md, lg). CVA is already installed.

2. **Input component** — Extract standard/compact input styling into a reusable `<Input>` component.

3. **Card component** — Standardize card padding and radius (currently mixed `rounded-lg`/`rounded-xl`).

4. **Modal component** — Extract shared modal shell (backdrop + card + header + body) into a reusable `<Modal>` component. All 6 modals share identical structure.

5. **Label styling** — Pick one convention (uppercase or sentence-case) for form labels.

6. **Toast system** — No dedicated toast/snackbar component exists. Consider adding one for API success/error feedback.

7. **Focus ring** — Standardize ring opacity (10% vs 20%) across all interactive elements.

8. **Reduced motion** — Add `prefers-reduced-motion` media query support for motion animations.

Status: Recommendation only.

---

## 21. Agent Implementation Rules

1. **Reuse existing components.** Check section 19 before creating anything new.
2. **Reuse existing tokens.** Use CSS variables from `globals.css` and utility classes (`.typo-*`).
3. **Search before creating.** Check `components/` and `lib/utils.ts` before building a new component.
4. **Follow established page patterns.** New pages should match Pattern 1 (list/filter) or Pattern 2 (dashboard) from section 13.
5. **Follow responsive conventions.** Use `sm`, `md`, `lg` breakpoints as documented in section 6.
6. **Do not introduce arbitrary colors.** Use status colors from `STATUS_CFG`, `PRIORITY_DOT`, `REIMB_CLS`, or CSS variables.
7. **Do not introduce arbitrary spacing.** Use Tailwind defaults or `--space-*` variables.
8. **Implement all states.** Loading (spinner), empty (icon+message+CTA), error (red text), disabled (opacity-50).
9. **Preserve accessibility patterns.** Semantic HTML, focus rings, labels, `title` on icon buttons.
10. **Prefer consistency over novelty.** Match existing border-radius, padding, and shadow conventions.
11. **Do not create duplicate patterns.** If a modal/form/table pattern exists, extend it rather than inventing new structure.
12. **When inconsistent, follow the dominant convention.** Refer to section 18 for known inconsistencies and their likely conventions.
13. **Do not invent design rules.** If this document doesn't cover it, inspect the codebase for evidence before deciding.
14. **Use lucide-react for all icons.** No other icon library.
15. **Use motion (Framer Motion) for animations.** Follow existing duration/easing patterns.
16. **Indian compliance context.** This CRM serves Indian professional firms — use INR currency, Indian state codes, PAN/GST formats.

---

## 22. Evidence / Source References

| Topic | Source file |
|---|---|
| CSS variables, tokens, typography classes | `apps/web/app/globals.css` |
| Theme provider, runtime theming | `apps/web/lib/theme-context.tsx` |
| Status/priority/role color maps | `apps/web/lib/utils.ts` |
| UI atoms (StatusBadge, PriorityDot, Av, RoleBadge) | `apps/web/components/ui-atoms.tsx` |
| App shell, sidebar, navbar, view routing | `apps/web/components/crm-shell.tsx` |
| Modal structure pattern | `apps/web/components/add-member-modal.tsx` |
| Form/validation pattern | `apps/web/components/auth-modal.tsx` |
| Searchable dropdown | `apps/web/components/combobox.tsx` |
| Table pattern | `apps/web/components/views/tasks-view.tsx` |
| KPI dashboard pattern | `apps/web/components/views/dashboard-view.tsx` |
| Side panel pattern | `apps/web/components/views/tasks-view.tsx` |
| KYC form (India compliance) | `apps/web/components/client-kyc-form.tsx` |
| DSC management | `apps/web/components/dsc/dsc-view.tsx` |
| Package dependencies | `apps/web/package.json` |
| PostCSS config | `apps/web/postcss.config.mjs` |
| Types | `apps/web/lib/types.ts` |
| Validators | `apps/web/lib/validations.ts` (inferred) |
