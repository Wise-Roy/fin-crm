"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  BarChart3,
  Bell,
  Plus,
  ListTodo,
  LogOut,
  Loader2,
  Settings,
  Search,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { View } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { can } from "@/lib/utils";
import { NotifPanel } from "@/components/notification-panel";
import { QuickAddModal } from "@/components/quick-add-modal";
import { DateRangeSelector, getTodayRange } from "@/components/date-range-selector";
import type { DateRange } from "@/components/date-range-selector";
import { DashboardView } from "@/components/views/dashboard-view";
import { TasksView } from "@/components/views/tasks-view";
import { ClientsView } from "@/components/views/clients-view";
import { TeamView } from "@/components/views/team-view";
import { ReimbursementsView } from "@/components/views/reimbursements-view";
import { AnalyticsView } from "@/components/views/analytics-view";
import { ConfigurationView } from "@/components/views/configuration-view";
import { useTheme } from "@/lib/theme-context";
import { INIT_NOTIFS } from "@/lib/data";
import type {
  Task,
  Client,
  TeamMember,
  JoinRequest,
  Category,
  Reimbursement,
  TaskPayment,
  Notification as NotifType,
  TaskStatus,
  Role,
} from "@/lib/types";
import { getInitials } from "@/lib/utils";

const PAGE_TITLE: Record<View, string> = {
  dashboard: "Dashboard",
  tasks: "Tasks",
  clients: "Clients",
  team: "Team",
  reimbursements: "Reimbursements",
  analytics: "Analytics",
  configuration: "Configuration",
};

const NAV_ITEMS: Array<{ id: View; label: string; icon: React.ElementType }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "clients", label: "Clients", icon: Building2 },
  { id: "team", label: "Team", icon: Users },
  { id: "reimbursements", label: "Reimb.", icon: Receipt },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export function CRMShell({ onLogout }: { onLogout: () => void }) {
  const { appUser } = useAuth();
  const { theme } = useTheme();
  const [view, setView] = useState<View>("dashboard");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [reimbs, setReimbs] = useState<Reimbursement[]>([]);
  const [payments, setPayments] = useState<TaskPayment[]>([]);
  const [notifs, setNotifs] = useState<NotifType[]>(INIT_NOTIFS);

  const [dateRange, setDateRange] = useState<DateRange>(getTodayRange);

  const [showAddTask, setShowAddTask] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const userRole = appUser?.role || "EMPLOYEE";
  const userInitials = appUser?.initials || getInitials(appUser?.name || "??");

  const pendingRequestCount = joinRequests.filter((r) => r.status === "PENDING").length;
  const unread = notifs.filter((n) => !n.is_read).length + pendingRequestCount;
  const activeTaskCount = tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED").length;
  const pendingReimbCount = reimbs.filter((r) => r.status === "PENDING").length;

  const joinRequestNotifs: NotifType[] = joinRequests
    .filter((r) => r.status === "PENDING")
    .map((r) => ({
      id: `jr-${r.id}`,
      title: "Join Request",
      message: `${r.name} (${r.email}) wants to join your organisation.`,
      is_read: false,
      created_at: r.created_at,
    }));
  const allNotifs = [...joinRequestNotifs, ...notifs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const getDateParams = useCallback((): Record<string, string> => {
    const y = (d: Date) => d.getFullYear();
    const m = (d: Date) => String(d.getMonth() + 1).padStart(2, "0");
    const day = (d: Date) => String(d.getDate()).padStart(2, "0");
    const fmt = (d: Date) => `${y(d)}-${m(d)}-${day(d)}`;
    return { startDate: fmt(dateRange.startDate), endDate: fmt(dateRange.endDate) };
  }, [dateRange]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const isAdmin = can(userRole, "see_all");
      const dp = getDateParams();
      const fetches: Promise<unknown>[] = [
        isAdmin ? api.tasks.list({ limit: "100", ...dp }) : api.tasks.my({ limit: "100", ...dp }),
        api.clients.list({ limit: "100" }),
        api.team.list({ limit: "100" }),
        api.categories.list(),
        api.reimbursements.list({ limit: "100" }),
        api.payments.list({ limit: "100" }),
      ];
      if (can(userRole, "view_requests")) fetches.push(api.joinRequests.list());
      const results = await Promise.all(fetches);
      setTasks((results[0] as { data: Task[] }).data);
      setClients((results[1] as { data: Client[] }).data);
      setTeamMembers((results[2] as { data: TeamMember[] }).data);
      setCategories((results[3] as { data: Category[] }).data);
      setReimbs((results[4] as { data: Reimbursement[] }).data);
      setPayments((results[5] as { data: TaskPayment[] }).data);
      if (results[6]) setJoinRequests((results[6] as { data: JoinRequest[] }).data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [userRole, getDateParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTaskStatusChange = useCallback(async (id: string, status: TaskStatus) => {
    try {
      const { task } = await api.tasks.updateStatus(id, status);
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    } catch (err) { console.error("Failed to update task status:", err); }
  }, []);

  const handleAddTask = useCallback(async (data: {
    title: string; client_id?: string; client_group_id?: string;
    assigned_to_employee_id?: string; priority: string; due_date: string;
    category_id?: string; subcategory_id?: string;
  }) => {
    try {
      const { task } = await api.tasks.create(data);
      setTasks((prev) => [task, ...prev]);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to create task";
      alert(msg);
    }
  }, []);

  const handleApproveRequest = useCallback(async (id: string, role: Role) => {
    try {
      await api.joinRequests.approve(id, role);
      setJoinRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" as const, assigned_role: role } : r)));
      api.team.list({ limit: "100" }).then((res) => setTeamMembers(res.data)).catch(() => {});
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to approve request";
      alert(msg);
    }
  }, []);

  const handleRejectRequest = useCallback(async (id: string) => {
    try {
      await api.joinRequests.reject(id);
      setJoinRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "REJECTED" as const } : r)));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to reject request";
      alert(msg);
    }
  }, []);

  const handleAddClient = useCallback(async (data: { name: string; email?: string; phone?: string }) => {
    try {
      const { client } = await api.clients.create(data);
      setClients((prev) => [client, ...prev]);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to create client";
      alert(msg);
    }
  }, []);

  const handleReimbAction = useCallback(async (id: string, action: "APPROVED" | "REJECTED") => {
    try {
      const fn = action === "APPROVED" ? api.reimbursements.approve : api.reimbursements.reject;
      const { reimbursement } = await fn(id);
      setReimbs((prev) => prev.map((r) => (r.id === id ? reimbursement : r)));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to update reimbursement";
      alert(msg);
    }
  }, []);

  const handleCreateReimb = useCallback(async (data: { task_id: string; amount: number; description?: string }) => {
    try {
      const { reimbursement } = await api.reimbursements.create(data);
      setReimbs((prev) => [reimbursement, ...prev]);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to submit reimbursement";
      alert(msg);
    }
  }, []);

  const handleCreatePayment = useCallback(async (data: { task_id: string; payment_type: string; amount: number }) => {
    try {
      const { payment } = await api.payments.create(data);
      setPayments((prev) => [payment, ...prev]);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to create payment";
      alert(msg);
    }
  }, []);

  const handleMarkPaymentPaid = useCallback(async (id: string) => {
    try {
      const { payment } = await api.payments.markPaid(id);
      setPayments((prev) => prev.map((p) => (p.id === id ? payment : p)));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to mark payment";
      alert(msg);
    }
  }, []);

  const handleDeletePayment = useCallback(async (id: string) => {
    try {
      await api.payments.delete(id);
      setPayments((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to delete payment";
      alert(msg);
    }
  }, []);

  const handleUpdateGroup = useCallback(async (clientId: string, groupId: string, data: Record<string, unknown>) => {
    try {
      const { group } = await api.clients.updateGroup(clientId, groupId, data);
      setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, client_group: (c.client_group || []).map((g) => g.id === groupId ? group : g) } : c));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to update group";
      alert(msg);
    }
  }, []);

  const handleDeleteGroup = useCallback(async (clientId: string, groupId: string) => {
    try {
      await api.clients.deleteGroup(clientId, groupId);
      setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, client_group: (c.client_group || []).map((g) => g.id === groupId ? { ...g, is_active: false } : g) } : c));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to delete group";
      alert(msg);
    }
  }, []);

  const handleAddGroup = useCallback(async (clientId: string, groupName: string, email: string, phone: string) => {
    try {
      const { group } = await api.clients.createGroup(clientId, { group_name: groupName, email, phone });
      setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, client_group: [...(c.client_group || []), group] } : c));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to create group";
      alert(msg);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--background, #F4F4F4)" }}>
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  const sidebarBg = theme.colors.sidebar;
  const sidebarFg = theme.colors.sidebarText;
  const navbarBg = theme.colors.navbar;
  const navbarFg = theme.colors.navbarText;
  const pageBg = theme.colors.page;
  const accentColor = theme.colors.accent;

  const navItems = [
    ...NAV_ITEMS,
    ...(userRole === "OWNER" ? [{ id: "configuration" as View, label: "Settings", icon: Settings }] : []),
  ];

  const sidebarW = sidebarExpanded ? 200 : 68;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: pageBg }}>
      {/* ─── Sidebar ─── */}
      <motion.aside
        animate={{ width: sidebarW }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="shrink-0 flex flex-col h-full relative z-20"
        style={{ background: sidebarBg }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Logo */}
        <div className="flex items-center justify-center py-5" style={{ borderBottom: `1px solid ${sidebarFg}10` }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: sidebarFg }}>
            <ListTodo size={15} style={{ color: sidebarBg }} />
          </div>
          {sidebarExpanded && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-2.5 text-sm font-bold truncate"
              style={{ color: sidebarFg }}
            >
              {appUser?.orgName || "FinCRM"}
            </motion.span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const badge =
              item.id === "tasks" ? activeTaskCount
              : item.id === "reimbursements" ? pendingReimbCount
              : item.id === "team" ? pendingRequestCount
              : 0;
            const active = view === item.id;
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => setView(item.id)}
                  className="w-full flex items-center rounded-lg transition-all relative"
                  style={{
                    padding: sidebarExpanded ? "10px 12px" : "10px 0",
                    justifyContent: sidebarExpanded ? "flex-start" : "center",
                    gap: sidebarExpanded ? "10px" : "0",
                    backgroundColor: active ? `${sidebarFg}15` : "transparent",
                    color: active ? sidebarFg : `${sidebarFg}60`,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = `${sidebarFg}0A`;
                      e.currentTarget.style.color = `${sidebarFg}D0`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = `${sidebarFg}60`;
                    }
                  }}
                >
                  {active && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                      style={{ backgroundColor: sidebarFg }}
                    />
                  )}
                  <item.icon size={18} />
                  {sidebarExpanded && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                  {badge > 0 && !sidebarExpanded && (
                    <span className="absolute top-1 right-1.5 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center bg-red-500 text-white">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                  {badge > 0 && sidebarExpanded && (
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${sidebarFg}15`, color: `${sidebarFg}80` }}>
                      {badge}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        {/* Bottom: user */}
        <div className="px-2 pb-3" style={{ borderTop: `1px solid ${sidebarFg}10` }}>
          {/* User */}
          <div className="relative group">
            <div
              className="flex items-center rounded-lg py-2"
              style={{ justifyContent: sidebarExpanded ? "flex-start" : "center", padding: sidebarExpanded ? "8px 10px" : "8px 0" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold"
                style={{ backgroundColor: `${sidebarFg}18`, color: sidebarFg }}
              >
                {userInitials}
              </div>
              {sidebarExpanded && (
                <div className="flex-1 min-w-0 ml-2.5">
                  <div className="text-xs font-medium truncate" style={{ color: sidebarFg }}>
                    {appUser?.name || "—"}
                  </div>
                  <div className="text-xs truncate" style={{ color: `${sidebarFg}50` }}>
                    {appUser?.email || "—"}
                  </div>
                </div>
              )}
              {sidebarExpanded && (
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="shrink-0 ml-1 p-1.5 rounded-md transition-colors"
                  style={{ color: `${sidebarFg}40` }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = `${sidebarFg}90`; e.currentTarget.style.backgroundColor = `${sidebarFg}10`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = `${sidebarFg}40`; e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* ─── Main ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ─── Navbar ─── */}
        <header
          className="border-b px-5 py-5 flex items-center justify-between shrink-0 shadow-sm"
          style={{ backgroundColor: navbarBg, borderColor: `${navbarFg}08` }}
        >
          {/* Left: search */}
          <div className="hidden md:flex items-start max-w-xs flex-1 mx-8">
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all"
                style={{ borderColor: `${navbarFg}12`, backgroundColor: `${navbarFg}04`, color: navbarFg }}
                readOnly
              />
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: `${navbarFg}70` }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${navbarFg}06`; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {unread}
                  </span>
                )}
              </button>
              <NotifPanel
                open={showNotifs}
                onClose={() => setShowNotifs(false)}
                notifications={allNotifs}
                onMarkAll={() => setNotifs((p) => p.map((n) => ({ ...n, is_read: true })))}
                onViewRequests={pendingRequestCount > 0 ? () => { setView("team"); setShowNotifs(false); } : undefined}
              />
            </div>
            {can(userRole, "add_task") && (view === "dashboard" || view === "tasks" || view === "clients") && (
              <button
                onClick={() => setShowAddTask(true)}
                className="flex items-center gap-1.5 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                <Plus size={14} />
                <span className="hidden sm:inline">New Task</span>
              </button>
            )}
          </div>
        </header>

        {/* ─── Content ─── */}
        <main className="flex-1 overflow-auto p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="h-full"
            >
              {view === "dashboard" && (
                <DashboardView
                  tasks={tasks}
                  clients={clients}
                  teamMembers={teamMembers}
                  reimbursements={reimbs}
                  onAddTask={() => setShowAddTask(true)}
                  pendingMembers={joinRequests.filter((r) => r.status === "PENDING").map((r) => ({
                    id: r.id, name: r.name, email: r.email, status: "pending" as const, createdAt: r.created_at,
                  }))}
                  onOpenApproval={() => setView("team")}
                  userRole={userRole}
                  userName={appUser?.name || ""}
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              )}
              {view === "tasks" && (
                <TasksView tasks={tasks} payments={payments} onStatusChange={handleTaskStatusChange}
                  onAddTask={() => setShowAddTask(true)} onCreatePayment={handleCreatePayment}
                  onMarkPaymentPaid={handleMarkPaymentPaid} onDeletePayment={handleDeletePayment} userRole={userRole} />
              )}
              {view === "clients" && (
                <ClientsView clients={clients} tasks={tasks} payments={payments}
                  onAddClient={handleAddClient} onAddGroup={handleAddGroup}
                  onUpdateGroup={handleUpdateGroup} onDeleteGroup={handleDeleteGroup} userRole={userRole} />
              )}
              {view === "team" && (
                <TeamView teamMembers={teamMembers} tasks={tasks} joinRequests={joinRequests}
                  onApprove={handleApproveRequest} onReject={handleRejectRequest} userRole={userRole} />
              )}
              {view === "reimbursements" && (
                <ReimbursementsView reimbursements={reimbs} tasks={tasks} onAction={handleReimbAction}
                  onCreateReimb={handleCreateReimb} userRole={userRole} dateRange={dateRange} />
              )}
              {view === "analytics" && (
                <AnalyticsView tasks={tasks} clients={clients} teamMembers={teamMembers} userRole={userRole} />
              )}
              {view === "configuration" && <ConfigurationView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <QuickAddModal
        open={showAddTask} onClose={() => setShowAddTask(false)}
        clients={clients} onClientsChange={setClients} teamMembers={teamMembers}
        categories={categories} onCategoriesChange={setCategories} onAdd={handleAddTask}
      />
    </div>
  );
}
