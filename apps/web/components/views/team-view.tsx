"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X, Eye, EyeOff, Loader2 } from "lucide-react";
import type { Task, TeamMember, Role } from "@/lib/types";
import { STATUS_CFG, isOverdue, getInitials, ROLE_LABELS } from "@/lib/utils";

const ASSIGNABLE_ROLES: Array<{ value: Role; label: string }> = [
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "EMPLOYEE", label: "Employee" },
];

export function TeamView({
  teamMembers,
  tasks,
  onAddMember,
  userRole,
}: {
  teamMembers: TeamMember[];
  tasks: Task[];
  onAddMember: (data: {
    name: string; email: string; password: string; role: string; position?: string; phone?: string;
  }) => Promise<void>;
  userRole: Role;
}) {
  const [showAddMember, setShowAddMember] = useState(false);

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
      </AnimatePresence>
    </div>
  );
}

function AddMemberModal({
  onAdd,
  onClose,
}: {
  onAdd: (data: {
    name: string; email: string; password: string; role: string; position?: string; phone?: string;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("EMPLOYEE");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await onAdd({
        name,
        email,
        password,
        role,
        position: position || undefined,
        phone: phone || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Add Team Member</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              Create login credentials for the new member. They can sign in immediately with these credentials.
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="John Doe" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="john@yourfirm.in" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className={`${inputCls} pr-10`}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
              <div className="flex gap-2">
                {ASSIGNABLE_ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                      role === r.value
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Position <span className="text-gray-300">(optional)</span></label>
                <input type="text" value={position} onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. CA" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone <span className="text-gray-300">(optional)</span></label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210" className={inputCls} />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Adding…
                </>
              ) : (
                "Add Member"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </>
  );
}
