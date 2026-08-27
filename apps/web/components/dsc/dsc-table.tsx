"use client";

import { useState, Fragment } from "react";
import { Trash2, Eye, EyeOff, ChevronDown, ChevronUp, Edit3, X } from "lucide-react";
import type { Dsc, Client, Role } from "@/lib/types";
import { fmtDate, can } from "@/lib/utils";
import { validatePAN, validatePhone } from "@/lib/validations";
import { DscStatusBadge } from "./dsc-status-badge";

export function DscTable({
  entries,
  clients,
  onUpdate,
  onDelete,
  userRole,
}: {
  entries: Dsc[];
  clients: Client[];
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  userRole: Role;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visiblePw, setVisiblePw] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  const togglePw = (id: string) => {
    setVisiblePw((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEdit = (dsc: Dsc) => {
    setEditingId(dsc.id);
    setEditForm({
      pan_number: dsc.pan_number,
      name: dsc.name,
      related_company: dsc.related_company,
      issue_date: dsc.issue_date.slice(0, 10),
      valid_till_date: dsc.valid_till_date.slice(0, 10),
      issuing_authority: dsc.issuing_authority,
      password: dsc.password,
      client_id: dsc.client_id || "",
      client_group_id: dsc.client_group_id || "",
      position: dsc.position || "",
      mobile_number: dsc.mobile_number || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const panErr = editingId ? validatePAN(editForm["pan_number"] ?? "").error : undefined;
  const phoneErr = editingId ? validatePhone(editForm["mobile_number"] ?? "").error : undefined;

  const saveEdit = () => {
    if (!editingId || panErr || phoneErr) return;
    const data: Record<string, unknown> = {};
    const entry = entries.find((d) => d.id === editingId);
    if (!entry) return;

    // Only send changed fields
    if (editForm.pan_number !== entry.pan_number) data.pan_number = (editForm.pan_number || "").toUpperCase();
    if (editForm.name !== entry.name) data.name = editForm.name;
    if (editForm.related_company !== entry.related_company) data.related_company = editForm.related_company;
    if (editForm.issue_date !== entry.issue_date.slice(0, 10)) data.issue_date = editForm.issue_date;
    if (editForm.valid_till_date !== entry.valid_till_date.slice(0, 10)) data.valid_till_date = editForm.valid_till_date;
    if (editForm.issuing_authority !== entry.issuing_authority) data.issuing_authority = editForm.issuing_authority;
    if (editForm.password !== entry.password) data.password = editForm.password;
    if (editForm.client_id !== (entry.client_id || "")) data.client_id = editForm.client_id || null;
    if (editForm.client_group_id !== (entry.client_group_id || "")) data.client_group_id = editForm.client_group_id || null;
    if (editForm.position !== (entry.position || "")) data.position = editForm.position || null;
    if (editForm.mobile_number !== (entry.mobile_number || "")) data.mobile_number = editForm.mobile_number || null;

    if (Object.keys(data).length > 0) {
      onUpdate(editingId, data);
    }
    cancelEdit();
  };

  const updateField = (key: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const selectedEditClient = clients.find((c) => c.id === editForm.client_id);
  const editGroups = selectedEditClient?.client_group?.filter((g) => g.is_active) || [];

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        No DSC entries found. Add one to get started.
      </div>
    );
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10";
  const labelCls = "block text-xs text-gray-400 uppercase tracking-wider mb-0.5";
  const canEdit = can(userRole, "add_dsc");

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">PAN</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Related Company</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Issue Date</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Valid Till</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Authority</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider w-20"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((dsc) => {
            const isExpanded = expandedId === dsc.id;
            const isEditing = editingId === dsc.id;
            const customerName = dsc.client_group
              ? `${dsc.client?.name || ""} → ${dsc.client_group.group_name}`
              : dsc.client?.name || "—";

            return (
              <Fragment key={dsc.id}>
                <tr
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => { if (!isEditing) setExpandedId(isExpanded ? null : dsc.id); }}
                >
                  <td className="py-3 px-4 font-medium text-gray-900">{dsc.name}</td>
                  <td className="py-3 px-4 text-gray-600 font-mono text-xs">{dsc.pan_number}</td>
                  <td className="py-3 px-4 text-gray-600">{dsc.related_company}</td>
                  <td className="py-3 px-4 text-gray-600">{customerName}</td>
                  <td className="py-3 px-4 text-gray-500">{fmtDate(dsc.issue_date)}</td>
                  <td className="py-3 px-4 text-gray-500">{fmtDate(dsc.valid_till_date)}</td>
                  <td className="py-3 px-4"><DscStatusBadge validTillDate={dsc.valid_till_date} /></td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{dsc.issuing_authority}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-gray-50/80">
                    <td colSpan={9} className="px-4 py-4">
                      {isEditing ? (
                        /* ─── Edit Form ─── */
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className={labelCls}>PAN Number *</label>
                              <input value={editForm.pan_number} onChange={(e) => updateField("pan_number", e.target.value.toUpperCase())}
                                maxLength={10} className={`${inputCls} font-mono uppercase`} />
                              {panErr && <p className="text-xs text-red-500 mt-0.5">{panErr}</p>}
                            </div>
                            <div>
                              <label className={labelCls}>Name *</label>
                              <input value={editForm.name} onChange={(e) => updateField("name", e.target.value)} className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Related Company *</label>
                              <input value={editForm.related_company} onChange={(e) => updateField("related_company", e.target.value)} className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Issuing Authority *</label>
                              <input value={editForm.issuing_authority} onChange={(e) => updateField("issuing_authority", e.target.value)} className={inputCls} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className={labelCls}>Issue Date *</label>
                              <input type="date" value={editForm.issue_date} onChange={(e) => updateField("issue_date", e.target.value)} className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Valid Till *</label>
                              <input type="date" value={editForm.valid_till_date} onChange={(e) => updateField("valid_till_date", e.target.value)} className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Customer</label>
                              <select value={editForm.client_id} onChange={(e) => { updateField("client_id", e.target.value); updateField("client_group_id", ""); }} className={inputCls}>
                                <option value="">— None —</option>
                                {clients.filter((c) => c.is_active).map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className={labelCls}>Client Group</label>
                              <select value={editForm.client_group_id} onChange={(e) => updateField("client_group_id", e.target.value)}
                                className={inputCls} disabled={!editForm.client_id || editGroups.length === 0}>
                                <option value="">— None —</option>
                                {editGroups.map((g) => (
                                  <option key={g.id} value={g.id}>{g.group_name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className={labelCls}>Password *</label>
                              <input value={editForm.password} onChange={(e) => updateField("password", e.target.value)} className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Position</label>
                              <input value={editForm.position} onChange={(e) => updateField("position", e.target.value)}
                                placeholder="e.g. Director" className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Mobile</label>
                              <input value={editForm.mobile_number} onChange={(e) => updateField("mobile_number", e.target.value.replace(/\D/g, ""))}
                                maxLength={10} placeholder="10-digit" className={inputCls} />
                              {phoneErr && <p className="text-xs text-red-500 mt-0.5">{phoneErr}</p>}
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={cancelEdit} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
                            <button onClick={saveEdit}
                              disabled={!editForm.name || !editForm.pan_number || !editForm.related_company || !editForm.issuing_authority || !editForm.issue_date || !editForm.valid_till_date || !editForm.password || !!panErr || !!phoneErr}
                              className="text-xs bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ─── Detail View ─── */
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-gray-400 uppercase tracking-wider block mb-1">Position</span>
                              <span className="text-gray-700">{dsc.position || "—"}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 uppercase tracking-wider block mb-1">Mobile</span>
                              <span className="text-gray-700">{dsc.mobile_number || "—"}</span>
                            </div>
                            {userRole !== "EMPLOYEE" && (
                              <div>
                                <span className="text-gray-400 uppercase tracking-wider block mb-1">Password</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-700 font-mono">
                                    {visiblePw.has(dsc.id) ? dsc.password : "••••••••"}
                                  </span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); togglePw(dsc.id); }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                  >
                                    {visiblePw.has(dsc.id) ? <EyeOff size={12} /> : <Eye size={12} />}
                                  </button>
                                </div>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-400 uppercase tracking-wider block mb-1">Added By</span>
                              <span className="text-gray-700">{dsc.created_by_user?.name || "—"}</span>
                            </div>
                          </div>
                          {canEdit && (
                            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end gap-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); startEdit(dsc); }}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                <Edit3 size={12} /> Edit
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); onDelete(dsc.id); }}
                                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
