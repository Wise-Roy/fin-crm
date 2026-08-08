"use client";

import { useMemo } from "react";
import { ListTodo, AlertCircle, TrendingUp, Receipt, Plus } from "lucide-react";
import { motion } from "motion/react";
import type { Task, Client, TeamMember, Reimbursement, PendingMember, Role } from "@/lib/types";
import { STATUS_CFG, can, fmtINR, fmtDate, isOverdue, getInitials } from "@/lib/utils";
import { StatusBadge, Av } from "@/components/ui-atoms";

export function DashboardView({
  tasks,
  clients,
  teamMembers,
  reimbursements,
  onAddTask,
  pendingMembers,
  onOpenApproval,
  userRole,
}: {
  tasks: Task[];
  clients: Client[];
  teamMembers: TeamMember[];
  reimbursements: Reimbursement[];
  onAddTask: () => void;
  pendingMembers: PendingMember[];
  onOpenApproval: (m: PendingMember) => void;
  userRole: Role;
}) {
  const stats = useMemo(
    () => ({
      total: tasks.length,
      active: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      overdue: tasks.filter((t) => isOverdue(t.due_date, t.status)).length,
      done: tasks.filter((t) => t.status === "COMPLETED").length,
      pendingReimb: reimbursements
        .filter((r) => r.status === "PENDING")
        .reduce((s, r) => s + r.amount, 0),
      pendingReimbCount: reimbursements.filter((r) => r.status === "PENDING")
        .length,
    }),
    [tasks, reimbursements]
  );

  const recentTasks = tasks.slice(0, 6);

  return (
    <div className="space-y-5">
      {(userRole === "OWNER" || userRole === "ADMIN") && pendingMembers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-amber-600 shrink-0" />
            <span className="text-sm font-semibold text-amber-900">
              {pendingMembers.length} member
              {pendingMembers.length > 1 ? "s" : ""} awaiting your approval
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingMembers.map((m) => (
              <button
                key={m.id}
                onClick={() => onOpenApproval(m)}
                className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2 hover:border-gray-900 hover:shadow-sm transition-all text-left"
              >
                <div className="w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center font-mono text-[10px] font-semibold shrink-0">
                  {getInitials(m.name)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-900">
                    {m.name}
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono">
                    {m.email}
                  </div>
                </div>
                <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                  Assign Role
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Tasks",
            value: stats.total,
            sub: `${stats.active} in progress`,
            icon: ListTodo,
            alert: false,
          },
          {
            label: "Overdue",
            value: stats.overdue,
            sub: "Needs attention",
            icon: AlertCircle,
            alert: stats.overdue > 0,
          },
          {
            label: "Active Clients",
            value: clients.length,
            sub: `${stats.done} tasks completed`,
            icon: TrendingUp,
            alert: false,
          },
          {
            label: "Pending Reimb.",
            value: fmtINR(stats.pendingReimb),
            sub: `${stats.pendingReimbCount} requests`,
            icon: Receipt,
            alert: false,
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                {s.label}
              </span>
              <s.icon
                size={13}
                className={s.alert ? "text-red-400" : "text-gray-200"}
              />
            </div>
            <div
              className={`text-2xl font-mono font-semibold tracking-tight ${s.alert ? "text-red-600" : "text-gray-900"}`}
            >
              {s.value}
            </div>
            <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">
              Recent Tasks
            </h3>
            {can(userRole, "add_task") && (
              <button
                onClick={onAddTask}
                className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors font-medium shadow-sm"
              >
                <Plus size={11} /> Quick Add
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {recentTasks.length === 0 && (
              <div className="text-center py-10 text-sm text-gray-400">
                No tasks yet
              </div>
            )}
            {recentTasks.map((task, i) => {
              const assignee = task.users_task_assigned_to_employee_idTousers;
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
                >
                  <div
                    className={`w-0.5 h-9 rounded-full ${STATUS_CFG[task.status].bar}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </p>
                      {task.categories && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono shrink-0">
                          {task.categories.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {task.client?.name || "No client"}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <Av
                      initials={assignee ? getInitials(assignee.name) : "?"}
                      size="sm"
                    />
                    <StatusBadge status={task.status} />
                  </div>
                  {task.due_date && (
                    <span
                      className={`text-xs font-mono shrink-0 ${isOverdue(task.due_date, task.status) ? "text-red-500 font-semibold" : "text-gray-400"}`}
                    >
                      {fmtDate(task.due_date)}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">
              Team Workload
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {teamMembers.length === 0 && (
              <p className="text-xs text-gray-400">No team members</p>
            )}
            {teamMembers.map((member) => {
              const active = tasks.filter(
                (t) => t.assigned_to_employee_id === member.id && t.status !== "COMPLETED" && t.status !== "CANCELLED"
              ).length;
              return (
                <div key={member.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Av initials={getInitials(member.name)} size="sm" />
                      <span className="text-xs font-medium text-gray-700">
                        {member.name.split(" ")[0]}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">
                      {active}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((active / 5) * 100, 100)}%`,
                      }}
                      transition={{
                        delay: 0.4,
                        duration: 0.5,
                        ease: "easeOut",
                      }}
                      className={`h-full rounded-full ${active >= 5 ? "bg-red-400" : active >= 3 ? "bg-amber-400" : "bg-gray-900"}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
