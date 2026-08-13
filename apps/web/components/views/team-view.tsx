"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Pencil } from "lucide-react";
import type { Task, TeamMember, Role } from "@/lib/types";
import { STATUS_CFG, isOverdue, getInitials, ROLE_LABELS, ROLE_BADGE } from "@/lib/utils";
import { AddMemberModal } from "@/components/add-member-modal";
import { EditMemberModal } from "@/components/edit-member-modal";

export function TeamView({
  teamMembers,
  tasks,
  onAddMember,
  onUpdateMember,
  userRole,
  currentUserId,
}: {
  teamMembers: TeamMember[];
  tasks: Task[];
  onAddMember: (data: {
    name: string; email: string; password: string; role: string; position?: string; phone?: string;
  }) => Promise<void>;
  onUpdateMember: (id: string, data: {
    name?: string; email?: string; phone?: string; position?: string; role?: string; password?: string;
  }) => Promise<void>;
  userRole: Role;
  currentUserId: string;
}) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          <p className="text-xs text-gray-400">{teamMembers.length} members</p>
        </div>
        {userRole === "OWNER" && (
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all"
          >
            <Plus size={14} /> Add Member
          </button>
        )}
      </div>

      {/* Members */}
      {(
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
                  <div className="flex-1">
                    {userRole === "OWNER" && (
                      <button
                        onClick={() => setEditingMember(member)}
                        className="float-right w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                        title="Edit member"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {member.name}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_BADGE[member.role]}`}>
                        {ROLE_LABELS[member.role]}
                      </span>
                    </div>
                    {member.position && (
                      <div className="text-xs text-gray-400 mt-0.5">{member.position}</div>
                    )}
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

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMember && (
          <AddMemberModal
            onAdd={async (data) => {
              await onAddMember(data);
              setShowAddMember(false);
            }}
            onClose={() => setShowAddMember(false)}
          />
        )}
        {editingMember && (
          <EditMemberModal
            member={editingMember}
            isOwnerSelf={editingMember.id === currentUserId}
            onUpdate={onUpdateMember}
            onClose={() => setEditingMember(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
