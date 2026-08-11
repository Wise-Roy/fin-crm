"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Building2, X, Users, FolderPlus, IndianRupee, Trash2, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Task, Client, ClientGroup, TaskPayment, ClientRevenue, Role } from "@/lib/types";
import { can, fmtDate, fmtINR } from "@/lib/utils";
import { StatusBadge } from "@/components/ui-atoms";
import { api } from "@/lib/api";

type AddMode = "client" | "group" | null;

export function ClientsView({
  clients,
  tasks,
  payments,
  onAddClient,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  userRole,
}: {
  clients: Client[];
  tasks: Task[];
  payments: TaskPayment[];
  onAddClient: (c: { name: string; email?: string; phone?: string }) => void;
  onAddGroup: (clientId: string, groupName: string, email: string, phone: string) => void;
  onUpdateGroup: (clientId: string, groupId: string, data: Record<string, unknown>) => void;
  onDeleteGroup: (clientId: string, groupId: string) => void;
  userRole: Role;
}) {
  const [selected, setSelected] = useState<Client | null>(null);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [revenue, setRevenue] = useState<ClientRevenue | null>(null);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");

  // Client form
  const [clientForm, setClientForm] = useState({ name: "", email: "", phone: "" });
  // Group form
  const [groupClientId, setGroupClientId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupEmail, setGroupEmail] = useState("");
  const [groupPhone, setGroupPhone] = useState("");

  const filtered = clients;

  const selectedClient = selected ? clients.find((c) => c.id === selected.id) || null : null;
  const clientTasks = selectedClient ? tasks.filter((t) => t.client_id === selectedClient.id) : [];
  const groups = selectedClient?.client_group?.filter((g) => g.is_active) ?? [];

  // Fetch revenue when client selected (OWNER only)
  const fetchRevenue = useCallback(async (clientId: string) => {
    if (!can(userRole, "view_revenue")) { setRevenue(null); return; }
    try {
      const res = await api.clients.revenue(clientId);
      setRevenue(res.revenue);
    } catch {
      setRevenue(null);
    }
  }, [userRole]);

  useEffect(() => {
    if (selectedClient) fetchRevenue(selectedClient.id);
    else setRevenue(null);
  }, [selectedClient?.id, fetchRevenue]);

  // Compute client payment totals for the list
  const clientPaymentTotals = new Map<string, number>();
  payments.forEach((p) => {
    if (p.payment_status === "SUCCESS" && p.task?.client_id) {
      clientPaymentTotals.set(
        p.task.client_id,
        (clientPaymentTotals.get(p.task.client_id) || 0) + Number(p.amount),
      );
    }
  });

  const submitClient = () => {
    if (!clientForm.name) return;
    onAddClient({ name: clientForm.name, email: clientForm.email || undefined, phone: clientForm.phone || undefined });
    setClientForm({ name: "", email: "", phone: "" });
    setAddMode(null);
  };

  const submitGroup = () => {
    if (!groupClientId || !groupName.trim()) return;
    onAddGroup(groupClientId, groupName.trim(), groupEmail.trim(), groupPhone.trim());
    setGroupName(""); setGroupEmail(""); setGroupPhone(""); setGroupClientId("");
    setAddMode(null);
  };

  const [detailGroupName, setDetailGroupName] = useState("");
  const [showDetailAddGroup, setShowDetailAddGroup] = useState(false);

  const submitDetailGroup = () => {
    if (!selectedClient || !detailGroupName.trim()) return;
    onAddGroup(selectedClient.id, detailGroupName.trim(), "", "");
    setDetailGroupName("");
    setShowDetailAddGroup(false);
  };

  const startEditGroup = (g: ClientGroup) => {
    setEditingGroup(g.id);
    setEditGroupName(g.group_name);
  };

  const saveEditGroup = () => {
    if (!selectedClient || !editingGroup || !editGroupName.trim()) return;
    onUpdateGroup(selectedClient.id, editingGroup, { group_name: editGroupName.trim() });
    setEditingGroup(null);
  };

  const canAdd = can(userRole, "add_client");
  const canViewDetails = can(userRole, "view_client_details");

  return (
    <div className="flex gap-4 h-[calc(100vh-140px)]">
      {/* Left: Client list */}
      <div className={`bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col transition-all ${selectedClient ? "w-full lg:w-[55%]" : "w-full"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 shrink-0">
          <h3 className="text-base font-semibold text-gray-900">
            Clients 
          </h3>
          <div className="flex items-center gap-2">
            {canAdd && (
              <div className="flex items-center gap-1">
                <button onClick={() => setAddMode(addMode === "client" ? null : "client")} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm ${addMode === "client" ? "bg-gray-700 text-white" : "bg-gray-900 text-white hover:bg-gray-800"}`}>
                  <Plus size={10} /> Client
                </button>
                <button onClick={() => setAddMode(addMode === "group" ? null : "group")} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm ${addMode === "group" ? "bg-gray-700 text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}>
                  <FolderPlus size={10} /> Group
                </button>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {addMode === "client" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden shrink-0">
              <div className="mx-5 mt-4 mb-2 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <p className="text-xs font-semibold text-gray-700">Add New Client</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {(([["Name *", "name", false], ["Email", "email", false], ["Phone", "phone", true]] as const)).map(([ph, key, mono]) => (
                    <input key={key} placeholder={ph} value={clientForm[key]} onChange={(e) => setClientForm((p) => ({ ...p, [key]: e.target.value }))} className={`border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white ${mono ? "" : ""}`} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setAddMode(null)} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
                  <button onClick={submitClient} className="text-sm font-medium bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">Add Client</button>
                </div>
              </div>
            </motion.div>
          )}
          {addMode === "group" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden shrink-0">
              <div className="mx-5 mt-4 mb-2 p-4 bg-gray-50 rounded-xl border border-blue-100 space-y-3">
                <p className="text-xs font-semibold text-gray-700">Add Client Group</p>
                <div className="space-y-2.5">
                  <select value={groupClientId} onChange={(e) => setGroupClientId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 appearance-none">
                    <option value="">Select Client *</option>
                    {clients.filter((c) => c.is_active).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                  <input placeholder="Group Name *" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                  <input type="email" placeholder="Group Email" value={groupEmail} onChange={(e) => setGroupEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                  <input type="tel" placeholder="Group Phone" value={groupPhone} onChange={(e) => setGroupPhone(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 " />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setAddMode(null)} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
                  <button onClick={submitGroup} disabled={!groupClientId || !groupName.trim()} className="text-sm font-medium bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">Add Group</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Client list */}
        <div className="flex-1 overflow-auto divide-y divide-gray-50">
          {filtered.map((c, i) => {
            const totalTasks = tasks.filter((t) => t.client_id === c.id).length;
            const completedTasks = tasks.filter((t) => t.client_id === c.id && t.status === "COMPLETED").length;
            const groupCount = c.client_group?.filter((g) => g.is_active).length ?? 0;
            const rev = clientPaymentTotals.get(c.id) || 0;
            return (
              <motion.button key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.025 }}
                onClick={() => canViewDetails && setSelected(selectedClient?.id === c.id ? null : c)}
                className={`w-full text-left px-5 py-4 hover:bg-gray-50/70 transition-colors ${selectedClient?.id === c.id ? "bg-gray-50 border-l-2 border-l-gray-900" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Building2 size={13} className="text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">{c.name}</span>
                        {!c.is_active && (<span className="text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded ">Inactive</span>)}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 ">{c.email || "No email"}</span>
                        {groupCount > 0 && (<span className="text-xs text-gray-400 flex items-center gap-0.5"><Users size={9} /> {groupCount} group{groupCount > 1 ? "s" : ""}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-gray-400">{completedTasks}/{totalTasks} tasks</div>
                    {rev > 0 && userRole === "OWNER" && (
                      <div className="text-xs  text-emerald-600">{fmtINR(rev)}</div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Right: Detail panel */}
      <AnimatePresence>
        {selectedClient && (
          <motion.div
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="hidden lg:flex flex-col bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex-1"
          >
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-50 shrink-0">
              <div className="min-w-0 pr-4">
                <h3 className="text-base font-semibold text-gray-900 truncate">{selectedClient.name}</h3>
                <span className="text-xs text-gray-400">{selectedClient.is_active ? "Active" : "Inactive"}</span>
              </div>
              <button onClick={() => setSelected(null)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors shrink-0">
                <X size={13} className="text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-5 space-y-5">
              {/* Info */}
              <div className="grid grid-cols-2 gap-3">
                {(([
                  ["Email", selectedClient.email || "\u2014"],
                  ["Phone", selectedClient.phone || "\u2014"],
                  ["Status", selectedClient.is_active ? "Active" : "Inactive"],
                  ["Since", fmtDate(selectedClient.created_at)],
                ] as const)).map(([l, v]) => (
                  <div key={l}>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">{l}</div>
                    <div className="text-xs font-medium text-gray-800  truncate">{v}</div>
                  </div>
                ))}
              </div>

              {/* Revenue (OWNER only) */}
              {can(userRole, "view_revenue") && revenue && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1 mb-3">
                    <IndianRupee size={10} /> Revenue
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-lg  font-semibold text-emerald-800">{fmtINR(revenue.total_paid)}</div>
                      <div className="text-xs text-emerald-600">{revenue.paid_count} paid payments</div>
                    </div>
                    <div>
                      <div className="text-lg  font-semibold text-amber-700">{fmtINR(revenue.total_pending)}</div>
                      <div className="text-xs text-amber-600">{revenue.pending_count} pending</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Groups */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Groups ({groups.length})</h4>
                  {canAdd && (
                    <button onClick={() => setShowDetailAddGroup(!showDetailAddGroup)} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
                      <Plus size={10} /> Add Group
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {showDetailAddGroup && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-3">
                      <div className="flex gap-2">
                        <input placeholder="Group name" value={detailGroupName} onChange={(e) => setDetailGroupName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") submitDetailGroup(); }}
                          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                        <button onClick={submitDetailGroup} disabled={!detailGroupName.trim()} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">Add</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1.5">
                  {groups.length === 0 ? (
                    <p className="text-xs text-gray-400">No groups yet.</p>
                  ) : (
                    groups.map((g) => {
                      const groupTasks = tasks.filter((t) => t.client_group_id === g.id);
                      const isEditing = editingGroup === g.id;
                      return (
                        <div key={g.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 group/grp">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Users size={11} className="text-gray-400 shrink-0" />
                            {isEditing ? (
                              <input value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") saveEditGroup(); if (e.key === "Escape") setEditingGroup(null); }}
                                onBlur={saveEditGroup} autoFocus
                                className="flex-1 border border-gray-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                            ) : (
                              <span className="text-xs font-medium text-gray-700 truncate">{g.group_name}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 ">{groupTasks.length} tasks</span>
                            {canAdd && !isEditing && (
                              <div className="flex items-center gap-1 opacity-0 group-hover/grp:opacity-100 transition-opacity">
                                <button onClick={() => startEditGroup(g)} className="text-gray-400 hover:text-gray-700"><Edit3 size={10} /></button>
                                <button onClick={() => onDeleteGroup(selectedClient.id, g.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={10} /></button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Tasks */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tasks ({clientTasks.length})</h4>
                <div className="space-y-2">
                  {clientTasks.length === 0 ? (
                    <p className="text-xs text-gray-400">No tasks linked yet.</p>
                  ) : (
                    clientTasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 gap-2">
                        <span className="text-xs text-gray-700 font-medium truncate flex-1">{t.title}</span>
                        <StatusBadge status={t.status} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
