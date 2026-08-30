"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Lock, X, IndianRupee, History, Trash2, Search, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Task, TaskStatus, TaskPayment, TaskHistory, Role, TeamMember } from "@/lib/types";
import { STATUS_CFG, PAYMENT_CLS, can, fmtDate, fmtINR, isOverdue, getInitials, getAssignableMembers } from "@/lib/utils";
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
  onAssignTask: (id: string, assigneeId: string) => void;
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
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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
  }, [visibleTasks, filter, search]);

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
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-900 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 transition-all"
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
                        <div className="flex items-center gap-2">
                          <Av initials={assignee ? getInitials(assignee.name) : "?"} size="sm" />
                          <span className="text-xs text-gray-600 hidden lg:block">
                            {assignee?.name.split(" ")[0] || "Unassigned"}
                          </span>
                        </div>
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
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-50 shrink-0">
              <div className="min-w-0 pr-4 flex-1">
                {editMode ? (
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-base font-semibold text-gray-900 border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    autoFocus
                  />
                ) : (
                  <h3 className="text-base font-semibold text-gray-900 truncate">{selectedTask.title}</h3>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selectedTask.status} />
                  <PriorityDot priority={selectedTask.priority} />
                </div>
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

            <div className="flex-1 overflow-auto p-5 space-y-5">
              {/* Task Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Client</div>
                  <div className="text-xs font-medium text-gray-800 truncate">{selectedTask.client?.name || "\u2014"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Assignee</div>
                  {can(userRole, "assign_task") ? (
                    <select
                      value={selectedTask.assigned_to_employee_id || ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          onAssignTask(selectedTask.id, e.target.value);
                          setSelectedTask({ ...selectedTask, assigned_to_employee_id: e.target.value, users_task_assigned_to_employee_idTousers: teamMembers.find((m) => m.id === e.target.value) ? { id: e.target.value, name: teamMembers.find((m) => m.id === e.target.value)!.name, email: teamMembers.find((m) => m.id === e.target.value)!.email } : selectedTask.users_task_assigned_to_employee_idTousers });
                        }
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
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Due</div>
                  {editMode ? (
                    <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)}
                      className="w-full text-xs font-medium text-gray-800 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                  ) : (
                    <div className="text-xs font-medium text-gray-800 truncate">{selectedTask.due_date ? fmtDate(selectedTask.due_date) : "\u2014"}</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">{editMode ? "Priority" : "Created"}</div>
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
              </div>

              {/* Description Section */}
              {(selectedTask.description || editMode) && (
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Description</div>
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
                <div className="flex gap-2">
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

              {/* Payments Section - OWNER only */}
              {(userRole === "OWNER" || userRole === "ADMIN") && (
              <div>
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
              )}

              {/* History Section */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-3">
                  <History size={10} /> History
                </h4>
                {historyLoading ? (
                  <p className="text-xs text-gray-400">Loading...</p>
                ) : taskHistory.length === 0 ? (
                  <p className="text-xs text-gray-400">No history yet.</p>
                ) : (
                  <div className="space-y-2">
                    {taskHistory.map((h) => {
                      const isAssignment = h.action === "assignment_change";
                      const getAssigneeName = (id: string | null | undefined) => {
                        if (!id) return "Unassigned";
                        return teamMembers.find((m) => m.id === id)?.name || "Unknown";
                      };
                      return (
                        <div key={h.id} className="flex items-start gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isAssignment ? "bg-blue-400" : "bg-gray-300"}`} />
                          <div>
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">{h.users?.name || "System"}</span>
                              {isAssignment ? (
                                <>
                                  {" reassigned "}
                                  <span className="text-xs">{getAssigneeName((h.old_value as any)?.assigned_to)}</span>
                                  {" \u2192 "}
                                  <span className="font-medium text-xs">{getAssigneeName((h.new_value as any)?.assigned_to)}</span>
                                </>
                              ) : (
                                <>
                                  {" changed status "}
                                  <span className="text-xs">{(h.old_value as any)?.status}</span>
                                  {" \u2192 "}
                                  <span className="font-medium text-xs">{(h.new_value as any)?.status}</span>
                                </>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">{fmtDate(h.created_at)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
