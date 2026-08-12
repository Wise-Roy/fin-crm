"use client";

import { useState, useMemo } from "react";
import { Plus, Lock, X, IndianRupee, History, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Task, TaskStatus, TaskPayment, TaskHistory, Role } from "@/lib/types";
import { STATUS_CFG, PAYMENT_CLS, can, fmtDate, fmtINR, isOverdue, getInitials } from "@/lib/utils";
import { StatusBadge, PriorityDot, Av } from "@/components/ui-atoms";
import { api } from "@/lib/api";

export function TasksView({
  tasks,
  payments,
  onStatusChange,
  onAddTask,
  onCreatePayment,
  onMarkPaymentPaid,
  onDeletePayment,
  userRole,
}: {
  tasks: Task[];
  payments: TaskPayment[];
  onStatusChange: (id: string, s: TaskStatus) => void;
  onAddTask: () => void;
  onCreatePayment: (data: { task_id: string; payment_type: string; amount: number }) => void;
  onMarkPaymentPaid: (id: string) => void;
  onDeletePayment: (id: string) => void;
  userRole: Role;
}) {
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Payment form
  const [showPayForm, setShowPayForm] = useState(false);
  const [payType, setPayType] = useState("");
  const [payAmount, setPayAmount] = useState("");

  const filtered = useMemo(
    () =>
      tasks.filter((t) => filter === "all" || t.status === filter),
    [tasks, filter]
  );

  const tabs: Array<{ key: "all" | TaskStatus; label: string; count: number }> = [
    { key: "all", label: "All", count: tasks.length },
    { key: "TODO", label: "To Do", count: tasks.filter((t) => t.status === "TODO").length },
    { key: "IN_PROGRESS", label: "In Progress", count: tasks.filter((t) => t.status === "IN_PROGRESS").length },
    { key: "REVIEW", label: "Review", count: tasks.filter((t) => t.status === "REVIEW").length },
    { key: "COMPLETED", label: "Done", count: tasks.filter((t) => t.status === "COMPLETED").length },
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
    if (!selectedTask || !payType.trim() || !payAmount) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) return;
    onCreatePayment({ task_id: selectedTask.id, payment_type: payType.trim(), amount: amt });
    setPayType("");
    setPayAmount("");
    setShowPayForm(false);
  };

  return (
    <div className="flex gap-4 h-full">
      <div className={`space-y-4 transition-all ${selectedTask ? "flex-1" : "w-full"}`}>
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
          {can(userRole, "add_task") && (
            <button
              onClick={onAddTask}
              className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all"
            >
              <Plus size={14} /> Add Task
            </button>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/40">
                  {["Task", "Client", "Assignee", "Status", "Priority", "Due", "Payment", "Action"].map((h) => (
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
                  const paidPay = tp.filter((p) => p.payment_status === "SUCCESS").reduce((s, p) => s + Number(p.amount), 0);
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
                      <td className="px-4 py-3">
                        {totalPay > 0 ? (
                          <span className="text-xs text-gray-600">
                            {fmtINR(paidPay)}<span className="text-gray-300">/{fmtINR(totalPay)}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">{"\u2014"}</span>
                        )}
                      </td>
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

      {/* Task Detail Panel */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="hidden lg:flex flex-col bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden w-[380px] shrink-0"
          >
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-50 shrink-0">
              <div className="min-w-0 pr-4">
                <h3 className="text-base font-semibold text-gray-900 truncate">{selectedTask.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selectedTask.status} />
                  <PriorityDot priority={selectedTask.priority} />
                </div>
              </div>
              <button onClick={() => setSelectedTask(null)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors shrink-0">
                <X size={13} className="text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-5">
              {/* Task Info */}
              <div className="grid grid-cols-2 gap-3">
                {([
                  ["Client", selectedTask.client?.name || "\u2014"],
                  ["Assignee", selectedTask.users_task_assigned_to_employee_idTousers?.name || "\u2014"],
                  ["Due", selectedTask.due_date ? fmtDate(selectedTask.due_date) : "\u2014"],
                  ["Created", fmtDate(selectedTask.created_at)],
                ] as const).map(([l, v]) => (
                  <div key={l}>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">{l}</div>
                    <div className="text-xs font-medium text-gray-800 truncate">{v}</div>
                  </div>
                ))}
              </div>

              {/* Payments Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <IndianRupee size={10} /> Payments ({taskPayments.length})
                  </h4>
                  {can(userRole, "manage_payments") && (
                    <button onClick={() => setShowPayForm(!showPayForm)} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
                      <Plus size={10} /> Add
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {showPayForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-3">
                      <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <input placeholder="Payment type (e.g. Service Fee)" value={payType} onChange={(e) => setPayType(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                        <input type="number" placeholder="Amount" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 font-medium" />
                        <div className="flex gap-2">
                          <button onClick={() => setShowPayForm(false)} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button>
                          <button onClick={submitPayment} className="text-sm font-medium bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 flex-1">Add Payment</button>
                        </div>
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
                          <div className="text-xs font-medium text-gray-700">{p.payment_type}</div>
                          <div className="text-xs text-gray-500">{fmtINR(Number(p.amount))}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PAYMENT_CLS[p.payment_status]}`}>
                            {p.payment_status === "SUCCESS" ? "Paid" : p.payment_status.charAt(0) + p.payment_status.slice(1).toLowerCase()}
                          </span>
                          {p.payment_status === "PENDING" && can(userRole, "mark_payment_done") && selectedTask.status === "COMPLETED" && (
                            <button onClick={() => onMarkPaymentPaid(p.id)} className="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded hover:bg-emerald-100 font-medium opacity-0 group-hover/pay:opacity-100 transition-opacity">
                              Mark Paid
                            </button>
                          )}
                          {p.payment_status === "PENDING" && can(userRole, "mark_payment_done") && (
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
                    {taskHistory.map((h) => (
                      <div key={h.id} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                        <div>
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">{h.users?.name || "System"}</span>
                            {" changed status "}
                            <span className=" text-xs">{(h.old_value as any)?.status}</span>
                            {" \u2192 "}
                            <span className="font-medium text-xs">{(h.new_value as any)?.status}</span>
                          </div>
                          <div className="text-xs text-gray-400">{fmtDate(h.created_at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
