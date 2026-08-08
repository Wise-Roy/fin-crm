"use client";

import { useState } from "react";
import { X, CheckCircle2, UserCheck, UserX } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { PendingMember, Role } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/utils";

export function RoleAssignModal({
  member,
  onApprove,
  onReject,
  onClose,
}: {
  member: PendingMember;
  onApprove: (id: string, role: Role) => void;
  onReject: (id: string) => void;
  onClose: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState<Role>("EMPLOYEE");
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.16 }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto border border-gray-100">
          <div className="px-6 pt-5 pb-4 border-b border-gray-50 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Assign Role &amp; Approve
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Access will be granted immediately on approval
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            >
              <X size={13} className="text-gray-400" />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 bg-gray-900 text-white rounded-full flex items-center justify-center font-mono text-xs font-semibold">
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {member.name}
                </div>
                <div className="text-xs text-gray-400 font-mono">
                  {member.email}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Assign Role
              </label>
              <div className="space-y-2">
                {(
                  ["ADMIN", "MANAGER", "EMPLOYEE"] as Role[]
                ).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all ${selectedRole === r ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                  >
                    <span className="text-sm font-medium">
                      {ROLE_LABELS[r]}
                    </span>
                    {selectedRole === r && (
                      <CheckCircle2 size={14} className="text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  onReject(member.id);
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 border border-red-100 text-red-600 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
              >
                <UserX size={13} /> Reject
              </button>
              <button
                onClick={() => {
                  onApprove(member.id, selectedRole);
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
              >
                <UserCheck size={13} /> Approve
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
