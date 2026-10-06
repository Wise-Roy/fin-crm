"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Lock, X, IndianRupee, Trash2, Search, Pencil, ArrowRightLeft, CheckCircle2, UserRoundPen, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Task, TaskStatus, TaskPayment, TaskHistory, Role, TeamMember } from "@/lib/types";
import { STATUS_CFG, PAYMENT_CLS, can, fmtDate, fmtINR, fmtTime, dayLabel, statusLabel, isOverdue, getInitials, getAssignableMembers } from "@/lib/utils";
import { StatusBadge, PriorityDot, Av } from "@/components/ui-atoms";
import { api } from "@/lib/api";

export type TaskFilterMode = "all" | "open" | "overdue" | TaskStatus;

export function TasksView({
  tasks,
  payments,
  teamMembers,
  onStatusChange,
  onAssignTask,
  onAddTask,
  onCreatePayment,
  onMarkPaymentPaid,
  onDeletePayment,
  onUpdateTask,
  onDeleteTask,
  userRole,
  initialFilter,
}: {
  tasks: Task[];
  payments: TaskPayment[];
  teamMembers: TeamMember[];
  onStatusChange: (id: string, s: TaskStatus) => void | Promise<void>;
  onAssignTask: (id: string, assigneeId: string | null) => void;
  onAddTask: () => void;
  onCreatePayment: (data: { task_id: string; payment_type: string; amount: number }) => void;
  onMarkPaymentPaid: (id: string) => void;
  onDeletePayment: (id: string) => void;
  onUpdateTask: (id: string, data: Record<string, unknown>) => Promise<void>;
  onDeleteTask: (id: string) => void;
  userRole: Role;
  initialFilter?: TaskFilterMode;
}) {
  const [filter, setFilter] = useState<TaskFilterMode>(initialFilter || "all");
  useEffect(() => { if (initialFilter) setFilter(initialFilter); }, [initialFilter]);
  // Keep selectedTask in sync with tasks prop (e.g. after status change updates completed_at)
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find((t) => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  }, [tasks]);
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);

  // Edit task state
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPriority, setEditPriority] = useState<string>("");
  const [editDescription, setEditDescription] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Payment form (sidebar)
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");

  // Hide unassigned tasks from MANAGER and EMPLOYEE
  const visibleTasks = useMemo(() => {
    if (userRole === "OWNER" || userRole === "ADMIN") return tasks;
    return tasks.filter((t) => t.assigned_to_employee_id);
  }, [tasks, userRole]);

  const filtered = useMemo(() => {
    let result = visibleTasks.filter((t) => {
      if (filter === "all") return true;
      if (filter === "open") return t.status !== "COMPLETED" && t.status !== "CANCELLED";
      if (filter === "overdue") return isOverdue(t.due_date, t.status);
      return t.status === filter;
    });
    if (filterClient) {
      result = result.filter((t) => t.client_id === filterClient);
    }
    if (filterAssignee) {
      if (filterAssignee === "__unassigned__") {
        result = result.filter((t) => !t.assigned_to_employee_id);
      } else {
        result = result.filter((t) => t.assigned_to_employee_id === filterAssignee);
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.client?.name?.toLowerCase().includes(q) ||
          t.users_task_assigned_to_employee_idTousers?.name?.toLowerCase().includes(q) ||
          t.categories?.name?.toLowerCase().includes(q) ||
          t.sub_categories?.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [visibleTasks, filter, filterClient, filterAssignee, search]);

  // Unique clients from visible tasks for filter dropdown
  const clientOptions = useMemo(() => {
    const map = new Map<string, string>();
    visibleTasks.forEach((t) => { if (t.client?.id && t.client?.name) map.set(t.client.id, t.client.name); });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [visibleTasks]);

  const openCount = visibleTasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED").length;
  const overdueCount = visibleTasks.filter((t) => isOverdue(t.due_date, t.status)).length;
  const tabs: Array<{ key: TaskFilterMode; label: string; count: number }> = [
    { key: "all", label: "All", count: visibleTasks.length },
    { key: "open", label: "Open", count: openCount },
    { key: "TODO", label: "To Do", count: visibleTasks.filter((t) => t.status === "TODO").length },
    { key: "IN_PROGRESS", label: "In Progress", count: visibleTasks.filter((t) => t.status === "IN_PROGRESS").length },
    { key: "REVIEW", label: "Review", count: visibleTasks.filter((t) => t.status === "REVIEW").length },
    { key: "COMPLETED", label: "Done", count: visibleTasks.filter((t) => t.status === "COMPLETED").length },
    ...(overdueCount > 0 ? [{ key: "overdue" as TaskFilterMode, label: "Overdue", count: overdueCount }] : []),
  ];

  const openDetail = async (task: Task) => {
    setSelectedTask(task);
    setShowPayForm(false);
    setShowAllActivity(false);
    setHistoryLoading(true);
    try {
      const res = await api.tasks.history(task.id);
      setTaskHistory(res.data);
    } catch {
      setTaskHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const taskPayments = selectedTask
    ? payments.filter((p) => p.task_id === selectedTask.id)
    : [];

  const submitPayment = () => {
    if (!selectedTask || !payAmount) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) return;
    onCreatePayment({ task_id: selectedTask.id, payment_type: "Payment", amount: amt });
    setPayAmount("");
    setShowPayForm(false);
  };


  return (
    <div>
      <div className="space-y-4">
        {!can(userRole, "see_all") && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-xs text-blue-700 flex items-center gap-2">
            <Lock size={11} /> Showing your assigned tasks only
          </div>
        )}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-lg p-3 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 text-md font-medium rounded-md transition-all ${filter === tab.key ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              >
                {tab.label}
                <span className={`ml-1.5 text-xs ${filter === tab.key ? "opacity-60" : "opacity-40"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              title={filterClient ? clientOptions.find(([id]) => id === filterClient)?.[1] || "All Clients" : "All Clients"}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10 appearance-none w-32 truncate"
            >
              <option value="">All Clients</option>
              {clientOptions.map(([id, name]) => (
                <option key={id} value={id} title={name}>{name}</option>
              ))}
            </select>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              title={filterAssignee && filterAssignee !== "__unassigned__" ? teamMembers.find((m) => m.id === filterAssignee)?.name || "All Assignees" : filterAssignee === "__unassigned__" ? "Unassigned" : "All Assignees"}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10 appearance-none w-32 truncate"
            >
              <option value="">All Assignees</option>
              <option value="__unassigned__">Unassigned</option>
              {teamMembers.filter((m) => m.is_active).map((m) => (
                <option key={m.id} value={m.id} title={m.name}>{m.name}</option>
              ))}
            </select>
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-900 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 transition-all"
              />
            </div>
            {can(userRole, "add_task") && (
              <button
                onClick={onAddTask}
                className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all"
              >
                <Plus size={14} /> Add Task
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/40">
                  {["Task", "Client", "Assignee", "Status", "Priority", "Due", ...(userRole === "OWNER" || userRole === "ADMIN" ? ["Payment"] : []), "Action"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((task, i) => {
                  const assignee = task.users_task_assigned_to_employee_idTousers;
                  const tp = payments.filter((p) => p.task_id === task.id);
                  const totalPay = tp.reduce((s, p) => s + Number(p.amount), 0);
                  return (
                    <motion.tr
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={`hover:bg-gray-50/40 transition-colors group cursor-pointer ${selectedTask?.id === task.id ? "bg-gray-50" : ""}`}
                      onClick={() => openDetail(task)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 max-w-[200px]">
                          {task.categories && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded shrink-0">
                              {task.categories.name}
                            </span>
                          )}
                          <span className="text-sm font-medium text-gray-900 truncate">{task.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[130px]">
                        <span className="text-xs text-gray-500 truncate block">{task.client?.name || "\u2014"}</span>
                      </td>
                      <td className="px-4 py-3">
                        {assignee ? (
                          <Av initials={getInitials(assignee.name)} size="sm" />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                      <td className="px-4 py-3"><PriorityDot priority={task.priority} /></td>
                      <td className="px-4 py-3">
                        {task.due_date ? (
                          <span className={`text-xs ${isOverdue(task.due_date, task.status) ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                            {fmtDate(task.due_date)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">{"\u2014"}</span>
                        )}
                      </td>
                      {(userRole === "OWNER" || userRole === "ADMIN") && (
                        <td className="px-4 py-3">
                          {totalPay > 0 ? (
                            <span className="text-xs text-gray-600 font-medium">{fmtINR(totalPay)}</span>
                          ) : (
                            <span className="text-xs text-gray-300">{"\u2014"}</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={task.status}
                          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                          className="text-xs bg-white text-black rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-900/20 appearance-none border border-gray-400 hover:border-black transition-colors"
                        >
                          {(Object.keys(STATUS_CFG) as TaskStatus[]).map((s) => (
                            <option key={s} value={s} className="bg-gray-900 text-white">
                              {STATUS_CFG[s].label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-14 text-sm text-gray-400">No tasks match the filter.</div>
            )}
          </div>
        </div>
      </div>

      {/* Task Detail Side Modal */}
      <AnimatePresence>
        {selectedTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setSelectedTask(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="fixed top-0 right-0 h-full w-[420px] max-w-full bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col"
            >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-start justify-between">
                <div className="min-w-0 pr-4 flex-1">
                  {editMode ? (
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-base font-semibold text-gray-900 border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-base font-semibold text-gray-900">{selectedTask.title}</h3>
                  )}
                  {selectedTask.categories && (
                    <span className="text-xs text-gray-500 mt-0.5 block">
                      {selectedTask.categories.name}
                      {selectedTask.sub_categories && ` / ${selectedTask.sub_categories.name}`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {can(userRole, "add_task") && !editMode && (
                    <button
                      onClick={() => {
                        setEditMode(true);
                        setEditTitle(selectedTask.title);
                        setEditDescription(selectedTask.description || "");
                        setEditDueDate(selectedTask.due_date ? selectedTask.due_date.split("T")[0] ?? "" : "");
                        setEditPriority(selectedTask.priority);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
                      title="Edit task"
                    >
                      <Pencil size={13} className="text-gray-400" />
                    </button>
                  )}
                  {can(userRole, "add_task") && (
                    <button
                      onClick={() => {
                        if (confirm("Cancel this task? This action cannot be undone.")) {
                          onDeleteTask(selectedTask.id);
                          setSelectedTask(null);
                        }
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
                      title="Cancel task"
                    >
                      <Trash2 size={13} className="text-gray-400 hover:text-red-500" />
                    </button>
                  )}
                  <button onClick={() => setSelectedTask(null)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors">
                    <X size={13} className="text-gray-400" />
                  </button>
                </div>
              </div>
              {/* Status & Priority row */}
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={selectedTask.status} />
                <PriorityDot priority={selectedTask.priority} />
                {selectedTask.users_task_assigned_to_employee_idTousers && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Av initials={getInitials(selectedTask.users_task_assigned_to_employee_idTousers.name)} size="sm" />
                    <span className="text-xs text-gray-600">{selectedTask.users_task_assigned_to_employee_idTousers.name.split(" ")[0]}</span>
                  </div>
                )}
                {!selectedTask.users_task_assigned_to_employee_idTousers && (
                  <span className="ml-auto text-xs text-gray-400">Unassigned</span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {/* Details Section */}
              <div className="px-5 py-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Client</div>
                    <div className="text-xs font-medium text-gray-800 truncate">{selectedTask.client?.name || "\u2014"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Assignee</div>
                    {can(userRole, "assign_task") ? (
                      <select
                        value={selectedTask.assigned_to_employee_id || ""}
                        onChange={(e) => {
                          const val = e.target.value || null;
                          onAssignTask(selectedTask.id, val as any);
                          setSelectedTask({ ...selectedTask, assigned_to_employee_id: val, users_task_assigned_to_employee_idTousers: val ? (teamMembers.find((m) => m.id === val) ? { id: val, name: teamMembers.find((m) => m.id === val)!.name, email: teamMembers.find((m) => m.id === val)!.email } : selectedTask.users_task_assigned_to_employee_idTousers) : null });
                        }}
                        className="w-full text-xs font-medium text-gray-800 bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-900/10 appearance-none cursor-pointer"
                      >
                        <option value="">Unassigned</option>
                        {getAssignableMembers(teamMembers, userRole).map((m) => (
                          <option key={m.id} value={m.id}>{m.name} — {m.position || m.role}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-xs font-medium text-gray-800 truncate">{selectedTask.users_task_assigned_to_employee_idTousers?.name || "\u2014"}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Due</div>
                    {editMode ? (
                      <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)}
                        className="w-full text-xs font-medium text-gray-800 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                    ) : (
                      <div className={`text-xs font-medium truncate ${selectedTask.due_date && isOverdue(selectedTask.due_date, selectedTask.status) ? "text-red-500" : "text-gray-800"}`}>{selectedTask.due_date ? fmtDate(selectedTask.due_date) : "\u2014"}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Completed</div>
                    <div className={`text-xs font-medium truncate ${selectedTask.status === "COMPLETED" ? "text-emerald-600" : "text-gray-800"}`}>
                      {selectedTask.completed_at ? fmtDate(selectedTask.completed_at) : "\u2014"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">{editMode ? "Priority" : "Created"}</div>
                    {editMode ? (
                      <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}
                        className="w-full text-xs font-medium text-gray-800 bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-900/10 appearance-none cursor-pointer">
                        {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                          <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-xs font-medium text-gray-800 truncate">{fmtDate(selectedTask.created_at)}</div>
                    )}
                  </div>
                  {selectedTask.users_task_created_byTousers && (
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">Created by</div>
                      <div className="text-xs font-medium text-gray-800 truncate">{selectedTask.users_task_created_byTousers.name}</div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {(selectedTask.description || editMode) && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-400 mb-1">Description</div>
                    {editMode ? (
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={3}
                        className="w-full text-xs text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
                        placeholder="Add description…"
                      />
                    ) : (
                      <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedTask.description}</p>
                    )}
                  </div>
                )}

                {editMode && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setEditMode(false)}
                      className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!editTitle.trim() || editSaving}
                      onClick={async () => {
                        setEditSaving(true);
                        try {
                          await onUpdateTask(selectedTask.id, {
                            title: editTitle.trim(),
                            description: editDescription || null,
                            due_date: editDueDate || null,
                            priority: editPriority,
                          });
                          setEditMode(false);
                          setSelectedTask({ ...selectedTask, title: editTitle.trim(), description: editDescription || null, due_date: editDueDate || null, priority: editPriority as any });
                        } finally {
                          setEditSaving(false);
                        }
                      }}
                      className="text-xs font-medium bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex-1"
                    >
                      {editSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>

              {/* Divider + Payments Section */}
              {(userRole === "OWNER" || userRole === "ADMIN") && (
              <>
              <div className="border-t border-gray-100" />
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <IndianRupee size={10} /> Payments ({taskPayments.length})
                  </h4>
                  <button onClick={() => setShowPayForm(!showPayForm)} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
                    <Plus size={10} /> Add
                  </button>
                </div>

                <AnimatePresence>
                  {showPayForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-3">
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <input type="number" placeholder="₹ Amount" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 font-medium" onKeyDown={(e) => { if (e.key === "Enter") submitPayment(); }} />
                        <button onClick={submitPayment} className="text-xs font-medium bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800">Add</button>
                        <button onClick={() => setShowPayForm(false)} className="text-xs text-gray-400 hover:text-gray-600"><X size={12} /></button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1.5">
                  {taskPayments.length === 0 ? (
                    <p className="text-xs text-gray-400">No payments yet.</p>
                  ) : (
                    taskPayments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 group/pay">
                        <div>
                          <div className="text-xs font-medium text-gray-700">{fmtINR(Number(p.amount))}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PAYMENT_CLS[p.payment_status]}`}>
                            {p.payment_status === "SUCCESS" ? "Paid" : p.payment_status.charAt(0) + p.payment_status.slice(1).toLowerCase()}
                          </span>
                          {p.payment_status === "PENDING" && selectedTask.status === "COMPLETED" && (
                            <button onClick={() => onMarkPaymentPaid(p.id)} className="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded hover:bg-emerald-100 font-medium opacity-0 group-hover/pay:opacity-100 transition-opacity">
                              Mark Paid
                            </button>
                          )}
                          {p.payment_status === "PENDING" && (
                            <button onClick={() => onDeletePayment(p.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover/pay:opacity-100 transition-all">
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {selectedTask.status !== "COMPLETED" && taskPayments.some((p) => p.payment_status === "PENDING") && (
                  <p className="text-xs text-amber-600 mt-2">Task must be completed before payments can be marked as paid.</p>
                )}
              </div>
              </>
              )}

              {/* Divider + Activity Section */}
              <div className="border-t border-gray-100" />
              <div className="px-5 py-4">
              {/* Activity Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Activity</h4>
                {historyLoading ? (
                  <p className="text-xs text-gray-400">Loading...</p>
                ) : taskHistory.length === 0 ? (
                  <p className="text-xs text-gray-400">No activity yet.</p>
                ) : (() => {
                  const sorted = [...taskHistory].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                  const reassignments = sorted.filter((h) => h.action === "assignment_change");

                  // Build assignee handoff chain
                  const handoffChain: { id: string | null; name: string }[] = [];
                  if (reassignments.length > 0) {
                    const oldest = reassignments[reassignments.length - 1]!;
                    const firstId = (oldest.old_value as any)?.assigned_to || null;
                    const firstName = firstId ? (teamMembers.find((m) => m.id === firstId)?.name || "Unknown") : "Unassigned";
                    handoffChain.push({ id: firstId, name: firstName });
                    for (let i = reassignments.length - 1; i >= 0; i--) {
                      const r = reassignments[i]!;
                      const toId = (r.new_value as any)?.assigned_to || null;
                      const toName = toId ? (teamMembers.find((m) => m.id === toId)?.name || "Unknown") : "Unassigned";
                      handoffChain.push({ id: toId, name: toName });
                    }
                  }

                  const displayed = showAllActivity ? sorted : sorted.slice(0, 5);
                  const hasMore = sorted.length > 5;

                  // Group by day
                  const groups: { label: string; entries: TaskHistory[] }[] = [];
                  for (const h of displayed) {
                    const lbl = dayLabel(h.created_at);
                    const last = groups[groups.length - 1];
                    if (last && last.label === lbl) {
                      last.entries.push(h);
                    } else {
                      groups.push({ label: lbl, entries: [h] });
                    }
                  }

                  const getAssigneeName = (id: string | null | undefined) => {
                    if (!id) return "Unassigned";
                    return teamMembers.find((m) => m.id === id)?.name || "Unknown";
                  };

                  return (
                    <div className="space-y-3">
                      {/* Handoff strip */}
                      {handoffChain.length > 1 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 pb-2 border-b border-gray-100 overflow-x-auto">
                          {handoffChain.map((h, i) => (
                            <span key={i} className="flex items-center gap-1 shrink-0">
                              {i > 0 && <span className="text-gray-300">→</span>}
                              <Av initials={getInitials(h.name)} size="sm" />
                            </span>
                          ))}
                          <span className="ml-auto text-xs text-gray-400 shrink-0">
                            Now with {handoffChain[handoffChain.length - 1]!.name.split(" ")[0]}
                          </span>
                        </div>
                      )}

                      {/* Timeline */}
                      <ol className="space-y-0">
                        {groups.map((group) => (
                          <li key={group.label}>
                            <div className="text-xs text-gray-400 font-medium mb-2 mt-1">{group.label}</div>
                            <ol className="relative ml-3">
                              {group.entries.map((h, idx) => {
                                const isAssignment = h.action === "assignment_change";
                                const isCompleted = !isAssignment && (h.new_value as any)?.status === "COMPLETED";
                                const isLast = idx === group.entries.length - 1;
                                const actorName = h.users?.name?.split(" ")[0] || "System";

                                return (
                                  <li key={h.id} className="relative pl-6 pb-4">
                                    {/* Vertical line */}
                                    {!isLast && (
                                      <div className="absolute left-[7px] top-5 bottom-0 w-px bg-gray-200" aria-hidden="true" />
                                    )}
                                    {/* Icon */}
                                    <div className={`absolute left-0 top-0.5 w-4 h-4 rounded-full flex items-center justify-center ${
                                      isCompleted ? "bg-emerald-100" : isAssignment ? "bg-blue-100" : "bg-gray-100"
                                    }`} aria-hidden="true">
                                      {isCompleted ? (
                                        <CheckCircle2 size={10} className="text-emerald-600" />
                                      ) : isAssignment ? (
                                        <UserRoundPen size={10} className="text-blue-600" />
                                      ) : (
                                        <ArrowRightLeft size={9} className="text-gray-500" />
                                      )}
                                    </div>
                                    {/* Content */}
                                    <div>
                                      <div className="text-xs text-gray-700 flex items-center gap-1 flex-wrap">
                                        {isAssignment ? (
                                          <>
                                            <span>Reassigned</span>
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-xs text-gray-600">{getAssigneeName((h.old_value as any)?.assigned_to)}</span>
                                            <span className="text-gray-400">→</span>
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-xs font-medium text-gray-700">{getAssigneeName((h.new_value as any)?.assigned_to)}</span>
                                          </>
                                        ) : isCompleted ? (
                                          <>
                                            <span>Marked</span>
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${STATUS_CFG.COMPLETED.cls}`}>{STATUS_CFG.COMPLETED.label}</span>
                                          </>
                                        ) : (
                                          <>
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-xs text-gray-600`}>{statusLabel((h.old_value as any)?.status)}</span>
                                            <span className="text-gray-400">→</span>
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${STATUS_CFG[(h.new_value as any)?.status as TaskStatus]?.cls || "bg-gray-100 text-gray-600"}`}>{statusLabel((h.new_value as any)?.status)}</span>
                                          </>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-400 mt-0.5">{actorName} · {fmtTime(h.created_at)}</div>
                                    </div>
                                  </li>
                                );
                              })}
                            </ol>
                          </li>
                        ))}
                      </ol>

                      {/* Show all toggle */}
                      {hasMore && !showAllActivity && (
                        <button
                          onClick={() => setShowAllActivity(true)}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                        >
                          <ChevronDown size={12} />
                          Show all activity ({sorted.length})
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
              </div>
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
