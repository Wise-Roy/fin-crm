"use client";

import { useState } from "react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import type { Role, TeamMember } from "@/lib/types";
import { validateName, validateEmail, validatePhone } from "@/lib/validations";

const ASSIGNABLE_ROLES: Array<{ value: Role; label: string }> = [
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "EMPLOYEE", label: "Employee" },
];

export function EditMemberModal({
  member,
  onUpdate,
  onClose,
  isOwnerSelf,
}: {
  member: TeamMember;
  onUpdate: (id: string, data: {
    name?: string; email?: string; phone?: string; position?: string; role?: string; password?: string;
  }) => Promise<void>;
  onClose: () => void;
  isOwnerSelf: boolean;
}) {
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [phone, setPhone] = useState(member.phone || "");
  const [position, setPosition] = useState(member.position || "");
  const [role, setRole] = useState<Role>(member.role);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nameErr = validateName(name).error;
  const emailErr = validateEmail(email).error;
  const phoneErr = phone ? validatePhone(phone).error : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (nameErr || emailErr || phoneErr) return;
    if (password && password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    const data: Record<string, string | undefined> = {};
    if (name !== member.name) data.name = name;
    if (email !== member.email) data.email = email;
    if (phone !== (member.phone || "")) data.phone = phone;
    if (position !== (member.position || "")) data.position = position;
    if (!isOwnerSelf && role !== member.role) data.role = role;
    if (password) data.password = password;

    if (Object.keys(data).length === 0) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      await onUpdate(member.id, data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member");
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
            <h3 className="text-base font-semibold text-gray-900">Edit Member</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className={inputCls} />
              {nameErr && <p className="text-xs text-red-500 mt-1">{nameErr}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className={inputCls} />
              {emailErr && <p className="text-xs text-red-500 mt-1">{emailErr}</p>}
            </div>

            {!isOwnerSelf && (
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
            )}

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
                {phoneErr && <p className="text-xs text-red-500 mt-1">{phoneErr}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                New Password <span className="text-gray-300">(leave blank to keep current)</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
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

            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !!nameErr || !!emailErr || !!phoneErr}
              className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </>
  );
}
