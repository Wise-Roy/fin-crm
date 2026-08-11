"use client";

import { useState } from "react";
import {
  Shield, Settings, BarChart3, Signature, LayoutDashboard, ListTodo,
  Building2, Receipt, Users, Bell, Calendar, Plus, ChevronDown, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Section {
  id: string;
  icon: React.ElementType;
  title: string;
  content: React.ReactNode;
}

function SectionCard({ section, isOpen, onToggle }: { section: Section; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center shrink-0">
          <section.icon size={15} />
        </div>
        <span className="text-sm font-semibold text-gray-900 flex-1">{section.title}</span>
        {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed space-y-3">
              {section.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function HelpView() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["roles"]));

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const features: Section[] = [
    {
      id: "roles",
      icon: Shield,
      title: "Role-Based Access Control",
      content: (
        <>
          <p>FinCRM has four roles with different permissions:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Feature</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-700">Owner</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-700">Admin</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-700">Manager</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-700">Employee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  ["Add/manage team members", true, false, false, false],
                  ["Settings & configuration", true, false, false, false],
                  ["Analytics & reporting", true, true, false, false],
                  ["Employee performance", true, false, false, false],
                  ["Add tasks", true, true, true, false],
                  ["Add clients", true, true, false, false],
                  ["Add DSC entries", true, true, false, false],
                  ["Submit reimbursements", true, true, true, true],
                  ["Approve reimbursements", true, false, false, false],
                  ["View all tasks", true, true, true, false],
                  ["View own tasks only", false, false, false, true],
                  ["Client details & groups", true, true, true, false],
                  ["Client revenue", true, false, false, false],
                  ["Update task status", true, true, true, true],
                  ["Manage payments", true, true, false, false],
                ].map(([feature, ...roles]) => (
                  <tr key={feature as string} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 text-gray-700">{feature as string}</td>
                    {(roles as boolean[]).map((allowed, i) => (
                      <td key={i} className="text-center px-3 py-2">
                        {allowed ? <span className="text-emerald-600">&#10003;</span> : <span className="text-gray-300">&#10005;</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: "settings",
      icon: Settings,
      title: "Settings & Configuration (Owner Only)",
      content: (
        <>
          <p>Available only to the <strong>Owner</strong> role. Customize your workspace:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Theme Customization</strong> — Change sidebar, navbar, page background, and accent colors. Choose from 6 preset palettes (Midnight, Ocean, Forest, Royal, Warm, Rose) or create your own.</li>
            <li><strong>Organization Branding</strong> — Set your firm&apos;s display name and upload a custom logo that appears in the sidebar.</li>
            <li><strong>Live Preview</strong> — All changes are previewed in real-time before saving.</li>
          </ul>
        </>
      ),
    },
    {
      id: "analytics",
      icon: BarChart3,
      title: "Analytics (Owner & Admin)",
      content: (
        <>
          <p>Visual reports and insights available to Owner and Admin roles:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Monthly Task Volume</strong> — Area chart showing tasks added vs completed over time.</li>
            <li><strong>Tasks by Client</strong> — Bar chart showing task distribution across clients.</li>
            <li><strong>Employee Performance</strong> — (Owner only) Horizontal bar chart of top 5 employees by completed + active tasks. Filterable by employee.</li>
            <li><strong>Status Distribution</strong> — Donut chart breaking down tasks by current status (To Do, In Progress, Waiting Client, Review, Completed).</li>
          </ul>
        </>
      ),
    },
    {
      id: "dsc",
      icon: Signature,
      title: "DSC — Digital Signature Certificates",
      content: (
        <>
          <p>Track and manage Digital Signature Certificates for your clients:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Certificate Tracking</strong> — Store PAN, name, related company, issuing authority, validity dates, and passwords.</li>
            <li><strong>Status Indicators</strong> — Certificates are automatically flagged as Active, Expiring Soon (within 30 days), or Expired.</li>
            <li><strong>Client Linking</strong> — Link DSC entries to clients and client groups for organized management.</li>
            <li><strong>Search & Filter</strong> — Search by name, PAN, company, authority, or client. Filter by status.</li>
            <li><strong>Adding DSC</strong> — Owner and Admin can add new DSC entries from the DSC section or the navbar Add button.</li>
          </ul>
        </>
      ),
    },
  ];

  const modules: Section[] = [
    {
      id: "dashboard",
      icon: LayoutDashboard,
      title: "Dashboard",
      content: (
        <>
          <p>Your daily overview at a glance:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>KPI Cards</strong> — Open tasks, overdue tasks, active clients, and pending reimbursement amount.</li>
            <li><strong>Today&apos;s Focus</strong> — Priority-sorted list of active tasks. Overdue tasks appear first, then by priority (Urgent → High → Medium → Low).</li>
            <li><strong>Team Workload</strong> — Quick view of each team member&apos;s active task count with a visual load bar (green → amber → red as load increases).</li>
          </ul>
        </>
      ),
    },
    {
      id: "tasks",
      icon: ListTodo,
      title: "Tasks",
      content: (
        <>
          <p>Core task management module:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Status Workflow</strong> — Tasks move through: To Do → In Progress → Review → Completed. Also supports Waiting Client and Cancelled states.</li>
            <li><strong>Priority Levels</strong> — Low, Medium, High, Urgent — each color-coded for quick identification.</li>
            <li><strong>Filtering</strong> — Filter by status tabs (All, To Do, In Progress, Review, Done).</li>
            <li><strong>Task Details</strong> — Click any task to see full details, status history timeline, and payment records.</li>
            <li><strong>Payments</strong> — Owner/Admin can add payments to tasks and track payment status (Pending, Success, Failed, Refunded).</li>
            <li><strong>Status Updates</strong> — All roles can update the status of their tasks using the dropdown in the Action column.</li>
            <li><strong>Employee View</strong> — Employees see only tasks assigned to them.</li>
          </ul>
        </>
      ),
    },
    {
      id: "clients",
      icon: Building2,
      title: "Clients",
      content: (
        <>
          <p>Manage your client base:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Client List</strong> — All clients with email, group count, task completion ratio, and revenue (Owner only).</li>
            <li><strong>Client Groups</strong> — Organize contacts under each client (e.g., directors, accountants). Add, rename, or delete groups.</li>
            <li><strong>Detail Panel</strong> — Click a client (Owner/Admin/Manager) to see contact info, groups, revenue breakdown, and linked tasks.</li>
            <li><strong>Revenue Tracking</strong> — Owner sees total paid and pending payment amounts per client.</li>
            <li><strong>Employee View</strong> — Employees can see the client list but cannot open client details or add clients.</li>
          </ul>
        </>
      ),
    },
    {
      id: "reimbursements",
      icon: Receipt,
      title: "Reimbursements",
      content: (
        <>
          <p>Track expense reimbursement requests:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Submit Requests</strong> — All roles can submit reimbursements. Select a task, enter amount and description.</li>
            <li><strong>Summary Cards</strong> — Total submitted, pending approval, and approved amounts at a glance.</li>
            <li><strong>Approval Flow</strong> — Only the Owner can approve or reject pending reimbursements.</li>
            <li><strong>Employee View</strong> — Employees see only their own reimbursement submissions.</li>
            <li><strong>Quick Access</strong> — Submit reimbursements from the navbar Add button or directly from the Reimbursements section.</li>
          </ul>
        </>
      ),
    },
    {
      id: "team",
      icon: Users,
      title: "Team",
      content: (
        <>
          <p>View and manage your team:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Member Cards</strong> — Each member shows their name, role/position, email, and task stats (active, done, overdue).</li>
            <li><strong>Active Tasks</strong> — See each member&apos;s current task list directly on their card.</li>
            <li><strong>Add Members</strong> — Only the Owner can add new team members with credentials (name, email, password, role, position, phone).</li>
            <li><strong>Assignable Roles</strong> — New members can be assigned Admin, Manager, or Employee roles.</li>
          </ul>
        </>
      ),
    },
  ];

  const extras: Section[] = [
    {
      id: "notifications",
      icon: Bell,
      title: "Notifications",
      content: (
        <>
          <p>Real-time notifications keep you informed:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Task Assigned</strong> — Get notified when a task is assigned to you.</li>
            <li><strong>Status Changes</strong> — Task creators and assignees are notified when status changes.</li>
            <li><strong>Owner Alerts</strong> — Owners receive notifications for new tasks, clients, DSC entries, and reimbursement submissions.</li>
            <li><strong>Bell Icon</strong> — Unread count badge on the bell icon in the navbar. Click to open the notification panel.</li>
            <li><strong>Mark as Read</strong> — Select individual notifications with checkboxes and mark them as read, or use &quot;Mark all read&quot;.</li>
            <li><strong>Auto-refresh</strong> — Notifications poll every 30 seconds for new updates.</li>
          </ul>
        </>
      ),
    },
    {
      id: "daterange",
      icon: Calendar,
      title: "Date Range Filter (Default 30 Days)",
      content: (
        <>
          <p>The date range selector in the navbar controls which data you see:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Default Range</strong> — Set to the last 30 days on login. All tasks, reimbursements, and DSC entries are filtered by this range.</li>
            <li><strong>Custom Range</strong> — Click the date selector to choose a custom start and end date.</li>
            <li><strong>Global Filter</strong> — Changing the date range refreshes all data across dashboard, tasks, reimbursements, and DSC views.</li>
          </ul>
        </>
      ),
    },
    {
      id: "addmenu",
      icon: Plus,
      title: "Navbar Add Button",
      content: (
        <>
          <p>Quick-create items from anywhere in the app:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Add Task</strong> — (Owner, Admin, Manager) Opens the task creation modal with fields for title, client, assignee, priority, due date, and category.</li>
            <li><strong>Add Client</strong> — (Owner, Admin) Navigates to the Clients section for adding a new client.</li>
            <li><strong>Add DSC</strong> — (Owner, Admin) Opens the DSC creation form in the DSC section.</li>
            <li><strong>Reimbursement</strong> — (All roles) Navigates to the Reimbursements section to submit a new request.</li>
            <li>The options shown depend on your role — you only see what you have permission to create.</li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Help & Guide</h1>
        <p className="text-sm text-gray-400">Everything you need to know about using FinCRM.</p>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Features</h2>
        <div className="space-y-2">
          {features.map((s) => (
            <SectionCard key={s.id} section={s} isOpen={openSections.has(s.id)} onToggle={() => toggle(s.id)} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Modules</h2>
        <div className="space-y-2">
          {modules.map((s) => (
            <SectionCard key={s.id} section={s} isOpen={openSections.has(s.id)} onToggle={() => toggle(s.id)} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Navbar & Navigation</h2>
        <div className="space-y-2">
          {extras.map((s) => (
            <SectionCard key={s.id} section={s} isOpen={openSections.has(s.id)} onToggle={() => toggle(s.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
