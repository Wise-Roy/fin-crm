Redesign my existing CRM dashboard into a SaaS-oriented “Focus Mode” workspace.

Keep the core CRM functionality and existing content, but create a calmer, productivity-first interface optimized for completing tasks quickly.

Design direction:
- Minimal, premium B2B SaaS aesthetic
- Dark graphite sidebar with a clean light workspace
- High contrast, excellent readability, generous spacing
- Use only 3–5 colors: graphite, white, slate gray, subtle blue accent, red for alerts
- Use modern sans-serif typography
- Avoid excessive gradients, decorative graphics, and unnecessary cards
- Make the interface feel similar to Linear, Superhuman, and modern productivity tools without copying them

Focus Mode layout:
1. Compact left sidebar
   - 64–72px wide by default
   - Icon-first navigation
   - Tooltips on hover
   - Active item shown with a bright white or blue background
   - Navigation items: Dashboard, Tasks, Clients, Team, Reimbursements, Analytics, Settings
   - Show notification/count badges where relevant
   - Bottom section with user avatar, workspace switcher, and collapse control

2. Top navigation bar
   - Keep it visually quiet and compact
   - Include breadcrumb or current page title
   - Centered command/search input with shortcut hint
   - Notification button
   - Primary “New Task” button
   - User profile menu
   - Add a keyboard-friendly command palette interaction

3. Main workspace
   - Use a focused dashboard layout instead of a dense admin panel
   - Start with a strong greeting such as “Good morning, Shrenik”
   - Include a compact date selector
   - Add a “Today’s focus” section with priority tasks
   - Display KPI summaries for Open Tasks, Overdue, Active Clients, and Pending Reimbursements
   - Use one dominant task list instead of many competing cards
   - Add a compact team workload panel on the right
   - Include useful empty states with clear actions
   - Use subtle dividers and restrained borders

4. Interactions
   - Sidebar collapses and expands smoothly
   - On mobile, replace the sidebar with a slide-out drawer
   - Active navigation item updates visually
   - Search opens a command palette
   - “New Task” opens a task creation modal
   - Notification button opens a notification panel
   - KPI cards can be clicked to filter the task list
   - Add hover, focus, and pressed states
   - Ensure keyboard navigation and accessible labels

5. Responsive behavior
   - Desktop: compact icon sidebar plus full dashboard
   - Tablet: collapsible sidebar
   - Mobile: top bar with menu button and bottom-safe content spacing
   - Do not allow horizontal overflow
   - Preserve hierarchy and readability at 390px width

Implementation:
- Use React and Tailwind CSS.
- Use reusable components for Sidebar, Topbar, CommandPalette, TaskList, MetricCard, WorkloadPanel, and MobileDrawer.
- Use lucide-react icons instead of manually drawn SVGs.
- Keep the implementation production-ready and accessible.
- Preserve existing CRM labels and data structure.
- Add realistic empty states but do not use localStorage or mock authentication.
- Update metadata for the USP Face CRM workspace.
- Make the result feel like a polished focused productivity mode, not a generic dashboard.