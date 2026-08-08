"use client";

import { useState, useMemo } from "react";
import { Plus, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Reimbursement, Role, ReimbStatus } from "@/lib/types";
import { REIMB_CLS, can, fmtINR, fmtDate } from "@/lib/utils";

export function ReimbursementsView({
  reimbursements,
  onAction,
  userRole,
}: {
  reimbursements: Reimbursement[];
  onAction: (id: string, a: "APPROVED" | "REJECTED") => void;
  userRole: Role;
}) {
  const [showForm, setShowForm] = useState(false);

  const visible = reimbursements;

  const pending = visible.filter((r) => r.status === "PENDING");
  const approved = visible.filter((r) => r.status === "APPROVED");

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
            v: fmtINR(visible.reduce((s, r) => s + r.amount, 0)),
            sub: `${visible.length} requests`,
          },
          {
            l: "Pending Approval",
            v: fmtINR(pending.reduce((s, r) => s + r.amount, 0)),
            sub: `${pending.length} awaiting`,
          },
          {
            l: "Approved",
            v: fmtINR(approved.reduce((s, r) => s + r.amount, 0)),
            sub: `${approved.length} processed`,
          },
        ].map((s) => (
          <div
            key={s.l}
            className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
          >
            <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">
              {s.l}
            </div>
            <div className="text-xl font-mono font-semibold text-gray-900">
              {s.v}
            </div>
            <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h3 className="text-sm font-semibold text-gray-900">
            Reimbursement Requests
          </h3>
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
                <p className="text-xs text-gray-500">
                  Reimbursement submission form coming soon (backend endpoint needed).
                </p>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/40">
                {[
                  "Amount",
                  "Description",
                  "Date",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
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
                    <span className="text-sm font-mono font-semibold text-gray-900">
                      {fmtINR(r.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <span className="text-xs text-gray-500 truncate block">
                      {r.description || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-mono text-gray-400">
                      {fmtDate(r.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${REIMB_CLS[r.status]}`}
                    >
                      {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "PENDING" && can(userRole, "approve_reimb") && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onAction(r.id, "APPROVED")}
                          className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-100 transition-colors font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onAction(r.id, "REJECTED")}
                          className="text-[11px] bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 transition-colors font-medium"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
