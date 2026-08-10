"use client";

import { useMemo } from "react";
import { ListTodo, AlertCircle, TrendingUp, Receipt, Plus, ArrowRight, Clock } from "lucide-react";
import { motion } from "motion/react";
import type { Task, Client, TeamMember, Reimbursement, PendingMember, Role } from "@/lib/types";
import { PRIORITY_DOT, can, fmtINR, fmtDate, isOverdue, getInitials } from "@/lib/utils";
import { StatusBadge, Av } from "@/components/ui-atoms";
import { DateRangeSelector } from "@/components/date-range-selector";
import type { DateRange } from "@/components/date-range-selector";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardView({
  tasks,
  clients,
  teamMembers,
  reimbursements,
  onAddTask,
  pendingMembers,
  onOpenApproval,
  userRole,
  userName,
  dateRange,
  onDateRangeChange,
}: {
  tasks: Task[];
  clients: Client[];
  teamMembers: TeamMember[];
  reimbursements: Reimbursement[];
  onAddTask: () => void;
  pendingMembers: PendingMember[];
  onOpenApproval: (m: PendingMember) => void;
  userRole: Role;
  userName: string;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}) {
  const stats = useMemo(
    () => ({
      total: tasks.length,
      active: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      overdue: tasks.filter((t) => isOverdue(t.due_date, t.status)).length,
      done: tasks.filter((t) => t.status === "COMPLETED").length,
      pendingReimb: reimbursements.filter((r) => r.status === "PENDING").reduce((s, r) => s + r.amount, 0),
      pendingReimbCount: reimbursements.filter((r) => r.status === "PENDING").length,
    }),
    [tasks, reimbursements]
  );

  // Today's focus: overdue + in-progress tasks, sorted by priority
  const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const focusTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED")
        .sort((a, b) => {
          const od = (t: Task) => isOverdue(t.due_date, t.status) ? -1 : 0;
          const diff = od(a) - od(b);
          if (diff !== 0) return diff;
          return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
        })
        .slice(0, 8),
    [tasks]
  );

  const firstName = userName?.split(" ")[0] || "";

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-end justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-semibold text-gray-900"
          >
            {getGreeting()}, {firstName}
          </motion.h1>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeSelector value={dateRange} onChange={onDateRangeChange} />
        </div>
      </div>

      {/* Pending approvals */}
      {(userRole === "OWNER" || userRole === "ADMIN") && pendingMembers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50/80 border border-amber-200/60 rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <AlertCircle size={16} className="text-amber-600 shrink-0" />
          <span className="text-sm text-amber-900 flex-1">
            <strong>{pendingMembers.length}</strong> member{pendingMembers.length > 1 ? "s" : ""} awaiting approval
          </span>
          <button
            onClick={() => onOpenApproval(pendingMembers[0]!)}
            className="text-xs font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1 transition-colors"
          >
            Review <ArrowRight size={12} />
          </button>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Open Tasks", value: stats.total - stats.done, icon: ListTodo, alert: false, sub: `${stats.active} in progress` },
          { label: "Overdue", value: stats.overdue, icon: AlertCircle, alert: stats.overdue > 0, sub: "Needs attention" },
          { label: "Active Clients", value: clients.length, icon: TrendingUp, alert: false, sub: `${stats.done} completed` },
          { label: "Pending Reimb.", value: fmtINR(stats.pendingReimb), icon: Receipt, alert: false, sub: `${stats.pendingReimbCount} requests` },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{s.label}</span>
              <s.icon size={16} className={s.alert ? "text-red-400" : "text-gray-300"} />
            </div>
            <div className={`text-xl font-semibold tracking-tight ${s.alert ? "text-red-600" : "text-gray-900"}`}>
              {s.value}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Main content: Tasks + Team Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Today's Focus — dominant task list */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Today&apos;s Focus</h3>
              <span className="text-xs text-gray-400">{focusTasks.length} tasks</span>
            </div>
          </div>

          {focusTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-3">
                <ListTodo size={20} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-500 mb-1">No active tasks</p>
              <p className="text-xs text-gray-400 mb-4">Create your first task to get started</p>
              {can(userRole, "add_task") && (
                <button
                  onClick={onAddTask}
                  className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
                >
                  <Plus size={13} /> Add Task
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {focusTasks.map((task, i) => {
                const assignee = task.users_task_assigned_to_employee_idTousers;
                const overdue = isOverdue(task.due_date, task.status);
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Priority indicator */}
                    <div className={`w-1 h-8 rounded-full shrink-0 ${PRIORITY_DOT[task.priority]}`} />

                    {/* Task info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        {overdue && (
                          <span className="text-xs text-red-500 font-medium shrink-0">Overdue</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 truncate">{task.client?.name || "No client"}</span>
                        {task.categories && (
                          <>
                            <span className="text-gray-200">·</span>
                            <span className="text-xs text-gray-400">{task.categories.name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="hidden sm:flex items-center gap-3 shrink-0">
                      <Av initials={assignee ? getInitials(assignee.name) : "?"} size="sm" />
                      <StatusBadge status={task.status} />
                      {task.due_date && (
                        <span className={`text-xs whitespace-nowrap ${overdue ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                          {fmtDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Team Workload — compact right panel */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Team</h3>
          </div>
          <div className="p-3 space-y-3">
            {teamMembers.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No team members</p>
            ) : (
              teamMembers.map((member) => {
                const active = tasks.filter(
                  (t) => t.assigned_to_employee_id === member.id && t.status !== "COMPLETED" && t.status !== "CANCELLED"
                ).length;
                return (
                  <div key={member.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Av initials={getInitials(member.name)} size="sm" />
                        <span className="text-xs font-medium text-gray-700 truncate max-w-[80px]">
                          {member.name.split(" ")[0]}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 tabular-nums">{active}</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((active / 5) * 100, 100)}%` }}
                        transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                        className={`h-full rounded-full ${active >= 5 ? "bg-red-400" : active >= 3 ? "bg-amber-400" : "bg-gray-900"}`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
