"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  ListTodo,
  Building2,
  Users,
  Receipt,
  BarChart3,
  Bell,
  Plus,
  Shield,
  LogOut,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { View } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { can } from "@/lib/utils";
import { RoleBadge } from "@/components/ui-atoms";
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
};

const NAV_ITEMS: Array<{ id: View; label: string; icon: React.ElementType }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "clients", label: "Clients", icon: Building2 },
  { id: "team", label: "Team", icon: Users },
  { id: "reimbursements", label: "Reimbursements", icon: Receipt },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export function CRMShell({ onLogout }: { onLogout: () => void }) {
  const { appUser } = useAuth();
  const [view, setView] = useState<View>("dashboard");

  // Real data from API
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

  // Merge join request notifications into notifs for display
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

  // Helper to get ISO date strings for API params
  const getDateParams = useCallback((): Record<string, string> => {
    const y = (d: Date) => d.getFullYear();
    const m = (d: Date) => String(d.getMonth() + 1).padStart(2, "0");
    const day = (d: Date) => String(d.getDate()).padStart(2, "0");
    const fmt = (d: Date) => `${y(d)}-${m(d)}-${day(d)}`;
    return {
      startDate: fmt(dateRange.startDate),
      endDate: fmt(dateRange.endDate),
    };
  }, [dateRange]);

  // Fetch all data on mount and when date range changes
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const isAdmin = can(userRole, "see_all");
      const dp = getDateParams();

      const fetches: Promise<unknown>[] = [
        isAdmin
          ? api.tasks.list({ limit: "100", ...dp })
          : api.tasks.my({ limit: "100", ...dp }),
        api.clients.list({ limit: "100" }),
        api.team.list({ limit: "100" }),
        api.categories.list(),
        api.reimbursements.list({ limit: "100" }),
        api.payments.list({ limit: "100" }),
      ];

      // Only OWNER can view join requests
      if (can(userRole, "view_requests")) {
        fetches.push(api.joinRequests.list());
      }

      const results = await Promise.all(fetches);

      setTasks((results[0] as { data: Task[] }).data);
      setClients((results[1] as { data: Client[] }).data);
      setTeamMembers((results[2] as { data: TeamMember[] }).data);
      setCategories((results[3] as { data: Category[] }).data);
      setReimbs((results[4] as { data: Reimbursement[] }).data);
      setPayments((results[5] as { data: TaskPayment[] }).data);

      if (results[6]) {
        setJoinRequests((results[6] as { data: JoinRequest[] }).data);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [userRole, getDateParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTaskStatusChange = useCallback(async (id: string, status: TaskStatus) => {
    try {
      const { task } = await api.tasks.updateStatus(id, status);
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  }, []);

  const handleAddTask = useCallback(async (data: {
    title: string;
    client_id?: string;
    client_group_id?: string;
    assigned_to_employee_id?: string;
    priority: string;
    due_date: string;
    category_id?: string;
    subcategory_id?: string;
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
      setJoinRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" as const, assigned_role: role } : r))
      );
      // Refresh team members after approval
      api.team.list({ limit: "100" }).then((res) => setTeamMembers(res.data)).catch(() => {});
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to approve request";
      alert(msg);
    }
  }, []);

  const handleRejectRequest = useCallback(async (id: string) => {
    try {
      await api.joinRequests.reject(id);
      setJoinRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "REJECTED" as const } : r))
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to reject request";
      alert(msg);
    }
  }, []);

  const handleAddClient = useCallback(async (data: {
    name: string;
    email?: string;
    phone?: string;
  }) => {
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
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? { ...c, client_group: (c.client_group || []).map((g) => g.id === groupId ? group : g) }
            : c
        )
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to update group";
      alert(msg);
    }
  }, []);

  const handleDeleteGroup = useCallback(async (clientId: string, groupId: string) => {
    try {
      await api.clients.deleteGroup(clientId, groupId);
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? { ...c, client_group: (c.client_group || []).map((g) => g.id === groupId ? { ...g, is_active: false } : g) }
            : c
        )
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to delete group";
      alert(msg);
    }
  }, []);

  const handleAddGroup = useCallback(async (clientId: string, groupName: string, email: string , phone: string) => {
    try {
      const { group } = await api.clients.createGroup(clientId, {
        group_name: groupName,
        email,
        phone,
      });
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? { ...c, client_group: [...(c.client_group || []), group] }
            : c
        )
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to create group";
      alert(msg);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F4F4]">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#F4F4F4" }}
    >
      {/* Sidebar */}
      <aside
        className="w-[220px] shrink-0 flex flex-col h-full"
        style={{ background: "#0A0A0A" }}
      >
        <div
          className="px-5 py-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shrink-0">
              <Shield size={13} className="text-[#0A0A0A]" />
            </div>
            <div>
              <div className="text-white text-sm font-semibold tracking-tight">
                FinCRM
              </div>
              <div
                className="text-[10px] font-mono truncate max-w-[120px]"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                {appUser?.orgName || "—"}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const badge =
              item.id === "tasks"
                ? activeTaskCount
                : item.id === "reimbursements"
                  ? pendingReimbCount
                  : item.id === "team"
                    ? pendingRequestCount
                    : 0;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${active ? "bg-white text-[#0A0A0A] font-medium shadow-sm" : "text-white/50 hover:text-white/90 hover:bg-white/5"}`}
              >
                <item.icon size={14} />
                <span className="flex-1 text-left">{item.label}</span>
                {badge > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${active ? "bg-gray-100 text-gray-500" : "bg-white/10 text-white/40"}`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div
          className="px-3 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-white/10">
              <span className="text-[10px] font-mono font-medium text-white">
                {userInitials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">
                {appUser?.email || "—"}
              </div>
              <div className="mt-0.5">
                <RoleBadge role={userRole} />
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              className="shrink-0 hover:opacity-70 transition-opacity"
            >
              <LogOut size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                {PAGE_TITLE[view]}
              </h1>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            {(view === "tasks" || view === "reimbursements" || view === "analytics" || view === "dashboard") && (
              <DateRangeSelector value={dateRange} onChange={setDateRange} />
            )}
          </div>
          <div className="flex items-center gap-2">
            {can(userRole, "add_task") && (
              <button
                onClick={() => setShowAddTask(true)}
                className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow"
              >
                <Plus size={13} /> New Task
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Bell size={14} className="text-gray-600" />
                {unread > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-mono font-bold"
                  >
                    {unread}
                  </motion.span>
                )}
              </button>
              <NotifPanel
                open={showNotifs}
                onClose={() => setShowNotifs(false)}
                notifications={allNotifs}
                onMarkAll={() =>
                  setNotifs((p) => p.map((n) => ({ ...n, is_read: true })))
                }
                onViewRequests={pendingRequestCount > 0 ? () => { setView("team"); setShowNotifs(false); } : undefined}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.14 }}
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
                      id: r.id,
                      name: r.name,
                      email: r.email,
                      status: "pending" as const,
                      createdAt: r.created_at,
                    }))}
                    onOpenApproval={() => setView("team")}
                    userRole={userRole}
                  />
                )}
                {view === "tasks" && (
                  <TasksView
                    tasks={tasks}
                    payments={payments}
                    onStatusChange={handleTaskStatusChange}
                    onAddTask={() => setShowAddTask(true)}
                    onCreatePayment={handleCreatePayment}
                    onMarkPaymentPaid={handleMarkPaymentPaid}
                    onDeletePayment={handleDeletePayment}
                    userRole={userRole}
                  />
                )}
                {view === "clients" && (
                  <ClientsView
                    clients={clients}
                    tasks={tasks}
                    payments={payments}
                    onAddClient={handleAddClient}
                    onAddGroup={handleAddGroup}
                    onUpdateGroup={handleUpdateGroup}
                    onDeleteGroup={handleDeleteGroup}
                    userRole={userRole}
                  />
                )}
                {view === "team" && (
                  <TeamView
                    teamMembers={teamMembers}
                    tasks={tasks}
                    joinRequests={joinRequests}
                    onApprove={handleApproveRequest}
                    onReject={handleRejectRequest}
                    userRole={userRole}
                  />
                )}
                {view === "reimbursements" && (
                  <ReimbursementsView
                    reimbursements={reimbs}
                    tasks={tasks}
                    onAction={handleReimbAction}
                    onCreateReimb={handleCreateReimb}
                    userRole={userRole}
                    dateRange={dateRange}
                  />
                )}
                {view === "analytics" && (
                  <AnalyticsView
                    tasks={tasks}
                    clients={clients}
                    teamMembers={teamMembers}
                  />
                )}
              </motion.div>
            </AnimatePresence>
        </main>
      </div>

      <QuickAddModal
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
        clients={clients}
        onClientsChange={setClients}
        teamMembers={teamMembers}
        categories={categories}
        onCategoriesChange={setCategories}
        onAdd={handleAddTask}
      />
    </div>
  );
}
