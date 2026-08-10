"use client";

import { useState, useMemo } from "react";
import { Plus, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Reimbursement, Task, Role } from "@/lib/types";
import type { DateRange } from "@/components/date-range-selector";
import { REIMB_CLS, can, fmtINR, fmtDate } from "@/lib/utils";

export function ReimbursementsView({
  reimbursements,
  tasks,
  onAction,
  onCreateReimb,
  userRole,
  dateRange,
}: {
  reimbursements: Reimbursement[];
  tasks: Task[];
  onAction: (id: string, a: "APPROVED" | "REJECTED") => void;
  onCreateReimb: (data: { task_id: string; amount: number; description?: string }) => void;
  userRole: Role;
  dateRange?: DateRange;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formTaskId, setFormTaskId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const visible = useMemo(() => {
    if (!dateRange) return reimbursements;
    return reimbursements.filter((r) => {
      const d = new Date(r.created_at);
      return d >= dateRange.startDate && d <= dateRange.endDate;
    });
  }, [reimbursements, dateRange]);

  const pending = visible.filter((r) => r.status === "PENDING");
  const approved = visible.filter((r) => r.status === "APPROVED");

  const submitReimb = () => {
    if (!formTaskId || !formAmount) return;
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) return;
    onCreateReimb({
      task_id: formTaskId,
      amount: amt,
      description: formDesc.trim() || undefined,
    });
    setFormTaskId("");
    setFormAmount("");
    setFormDesc("");
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {!can(userRole, "see_all") && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-xs text-blue-700 flex items-center gap-2">
          <Lock size={11} /> Showing your submissions only
        </div>
      )}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            l: "Total Submitted",
            v: fmtINR(visible.reduce((s, r) => s + Number(r.amount), 0)),
            sub: `${visible.length} requests`,
          },
          {
            l: "Pending Approval",
            v: fmtINR(pending.reduce((s, r) => s + Number(r.amount), 0)),
            sub: `${pending.length} awaiting`,
          },
          {
            l: "Approved",
            v: fmtINR(approved.reduce((s, r) => s + Number(r.amount), 0)),
            sub: `${approved.length} processed`,
          },
        ].map((s) => (
          <div key={s.l} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">{s.l}</div>
            <div className="text-xl font-semibold text-gray-900">{s.v}</div>
            <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h3 className="typo-card-title text-gray-900">Reimbursement Requests</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Plus size={11} /> Submit Request
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mx-5 my-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <p className="text-xs font-semibold text-gray-700">New Reimbursement</p>
                <select
                  value={formTaskId}
                  onChange={(e) => setFormTaskId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 appearance-none"
                >
                  <option value="">Select Task *</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Amount *"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 font-semibold"
                />
                <input
                  placeholder="Description (optional)"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowForm(false)} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
                  <button
                    onClick={submitReimb}
                    disabled={!formTaskId || !formAmount}
                    className="text-sm font-medium bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/40">
                {["Amount", "Task", "Description", "Date", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-gray-50/40 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm  font-semibold text-gray-900">{fmtINR(Number(r.amount))}</span>
                  </td>
                  <td className="px-4 py-3 max-w-[150px]">
                    <span className="text-xs text-gray-500 truncate block">{r.task?.title || "\u2014"}</span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <span className="text-xs text-gray-500 truncate block">{r.description || "\u2014"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400">{fmtDate(r.created_at)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${REIMB_CLS[r.status]}`}>
                      {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "PENDING" && can(userRole, "approve_reimb") && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onAction(r.id, "APPROVED")} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-100 transition-colors font-medium">Approve</button>
                        <button onClick={() => onAction(r.id, "REJECTED")} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 transition-colors font-medium">Reject</button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && (
            <div className="text-center py-14 text-sm text-gray-400">No reimbursements found for this date range.</div>
          )}
        </div>
      </div>
    </div>
  );
}
