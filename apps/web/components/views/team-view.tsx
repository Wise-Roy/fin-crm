"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { UserCheck, UserX, Clock } from "lucide-react";
import type { Task, TeamMember, JoinRequest, Role } from "@/lib/types";
import { STATUS_CFG, isOverdue, getInitials, ROLE_LABELS, can } from "@/lib/utils";
import { RoleAssignModal } from "@/components/role-assign-modal";

type Tab = "members" | "requests";

export function TeamView({
  teamMembers,
  tasks,
  joinRequests,
  onApprove,
  onReject,
  userRole,
}: {
  teamMembers: TeamMember[];
  tasks: Task[];
  joinRequests: JoinRequest[];
  onApprove: (id: string, role: Role) => void;
  onReject: (id: string) => void;
  userRole: Role;
}) {
  const [tab, setTab] = useState<Tab>("members");
  const [selectedRequest, setSelectedRequest] = useState<JoinRequest | null>(null);
  const canManage = can(userRole, "view_requests");
  const pendingCount = joinRequests.filter((r) => r.status === "PENDING").length;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-5">
        <button
          onClick={() => setTab("members")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === "members" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
        >
          Members
          <span className="ml-1.5 text-xs text-gray-400">{teamMembers.length}</span>
        </button>
        {canManage && (
          <button
            onClick={() => setTab("requests")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${tab === "requests" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            Requests
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Members Tab */}
      {tab === "members" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.length === 0 && (
            <div className="col-span-full text-center py-14 text-sm text-gray-400">
              No team members found.
            </div>
          )}
          {teamMembers.map((member, i) => {
            const memberTasks = tasks.filter((t) => t.assigned_to_employee_id === member.id);
            const active = memberTasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED");
            const done = memberTasks.filter((t) => t.status === "COMPLETED");
            const overdue = active.filter((t) => isOverdue(t.due_date, t.status));
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-gray-900 text-white flex items-center justify-center font-semibold text-sm shrink-0">
                    {getInitials(member.name)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {member.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{member.position || ROLE_LABELS[member.role]}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {member.email}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { l: "Active", v: active.length, a: false },
                    { l: "Done", v: done.length, a: false },
                    { l: "Overdue", v: overdue.length, a: overdue.length > 0 },
                  ].map((s) => (
                    <div
                      key={s.l}
                      className="text-center bg-gray-50 rounded-lg py-2.5"
                    >
                      <div
                        className={`text-lg font-semibold ${s.a ? "text-red-500" : "text-gray-900"}`}
                      >
                        {s.v}
                      </div>
                      <div className="text-xs text-gray-400">{s.l}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                    Active Tasks
                  </div>
                  {active.length === 0 ? (
                    <p className="text-xs text-gray-400">No active tasks</p>
                  ) : (
                    active.slice(0, 4).map((t) => (
                      <div key={t.id} className="flex items-center gap-2 mb-1.5">
                        <div
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_CFG[t.status].bar}`}
                        />
                        <span className="text-xs text-gray-600 truncate">
                          {t.title}
                        </span>
                      </div>
                    ))
                  )}
                  {active.length > 4 && (
                    <div className="text-xs text-gray-400 pl-3.5">
                      +{active.length - 4} more
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Requests Tab */}
      {tab === "requests" && canManage && (
        <div className="space-y-3">
          {joinRequests.length === 0 && (
            <div className="text-center py-14 text-sm text-gray-400">
              No join requests.
            </div>
          )}
          {joinRequests.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center font-semibold text-sm shrink-0">
                {getInitials(req.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900">{req.name}</div>
                <div className="text-xs text-gray-400">{req.email}</div>
                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(req.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
              <div className="shrink-0">
                {req.status === "PENDING" ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                    >
                      <UserCheck size={12} /> Review
                    </button>
                  </div>
                ) : (
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      req.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {req.status === "APPROVED"
                      ? `Approved — ${ROLE_LABELS[req.assigned_role!]}`
                      : "Rejected"}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Role Assign Modal */}
      {selectedRequest && (
        <RoleAssignModal
          member={{
            id: selectedRequest.id,
            name: selectedRequest.name,
            email: selectedRequest.email,
            status: "pending",
            createdAt: selectedRequest.created_at,
          }}
          onApprove={(id, role) => {
            onApprove(id, role);
            setSelectedRequest(null);
          }}
          onReject={(id) => {
            onReject(id);
            setSelectedRequest(null);
          }}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}
