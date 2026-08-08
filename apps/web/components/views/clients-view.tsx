"use client";

import { useState } from "react";
import { Search, Plus, Building2, X, Users, FolderPlus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Task, Client, ClientGroup, Role } from "@/lib/types";
import { can, fmtDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui-atoms";

type AddMode = "client" | "group" | null;

export function ClientsView({
  clients,
  tasks,
  onAddClient,
  onAddGroup,
  userRole,
}: {
  clients: Client[];
  tasks: Task[];
  onAddClient: (c: { name: string; email?: string; phone?: string }) => void;
  onAddGroup: (
    clientId: string,
    groupName: string,
    email: string,
    phone: string,
  ) => void;
  userRole: Role;
}) {
  const [selected, setSelected] = useState<Client | null>(null);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [search, setSearch] = useState("");

  // Client form
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  // Group form
  const [groupClientId, setGroupClientId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupEmail, setGroupEmail] = useState("");
  const [groupPhone, setGroupPhone] = useState("");

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.client_group || []).some((g) =>
        g.group_name.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  // Keep selected in sync with clients list
  const selectedClient = selected
    ? clients.find((c) => c.id === selected.id) || null
    : null;

  const clientTasks = selectedClient
    ? tasks.filter((t) => t.client_id === selectedClient.id)
    : [];

  const groups = selectedClient?.client_group?.filter((g) => g.is_active) ?? [];

  const submitClient = () => {
    if (!clientForm.name) return;
    onAddClient({
      name: clientForm.name,
      email: clientForm.email || undefined,
      phone: clientForm.phone || undefined,
    });
    setClientForm({ name: "", email: "", phone: "" });
    setAddMode(null);
  };

  const submitGroup = () => {
    if (!groupClientId || !groupName.trim()) return;
    onAddGroup(
      groupClientId,
      groupName.trim(),
      groupEmail.trim(),
      groupPhone.trim(),
    );
    setGroupName("");
    setGroupEmail("");
    setGroupPhone("");
    setGroupClientId("");
    setAddMode(null);
  };

  // Inline add group from detail panel
  const [detailGroupName, setDetailGroupName] = useState("");
  const [showDetailAddGroup, setShowDetailAddGroup] = useState(false);

  const submitDetailGroup = () => {
    if (!selectedClient || !detailGroupName.trim()) return;
    onAddGroup(
      selectedClient.id,
      detailGroupName.trim(),
      groupEmail.trim(),
      groupPhone.trim(),
    );
    setDetailGroupName("");
    setShowDetailAddGroup(false);
  };

  const canAdd = can(userRole, "add_client");

  return (
    <div className="flex gap-4 h-[calc(100vh-140px)]">
      {/* Left: Client list */}
      <div
        className={`bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col transition-all ${selectedClient ? "w-full lg:w-[55%]" : "w-full"}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 shrink-0">
          <h3 className="text-sm font-semibold text-gray-900">
            Clients{" "}
            <span className="text-gray-300 font-mono ml-1">
              {clients.length}
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={11}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 w-32"
              />
            </div>
            {canAdd && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setAddMode(addMode === "client" ? null : "client")
                  }
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm ${addMode === "client" ? "bg-gray-700 text-white" : "bg-gray-900 text-white hover:bg-gray-800"}`}
                >
                  <Plus size={10} /> Client
                </button>
                <button
                  onClick={() =>
                    setAddMode(addMode === "group" ? null : "group")
                  }
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm ${addMode === "group" ? "bg-gray-700 text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}
                >
                  <FolderPlus size={10} /> Group
                </button>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {/* Add Client Form */}
          {addMode === "client" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden shrink-0"
            >
              <div className="mx-5 mt-4 mb-2 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <p className="text-xs font-semibold text-gray-700">
                  Add New Client
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {(
                    [
                      ["Name *", "name", false],
                      ["Email", "email", false],
                      ["Phone", "phone", true],
                    ] as const
                  ).map(([ph, key, mono]) => (
                    <input
                      key={key}
                      placeholder={ph}
                      value={clientForm[key]}
                      onChange={(e) =>
                        setClientForm((p) => ({ ...p, [key]: e.target.value }))
                      }
                      className={`border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white ${mono ? "font-mono" : ""}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddMode(null)}
                    className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitClient}
                    className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Add Client
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Add Group Form */}
          {addMode === "group" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden shrink-0"
            >
              <div className="mx-5 mt-4 mb-2 p-4 bg-gray-50 rounded-xl border border-blue-100 space-y-3">
                <p className="text-xs font-semibold text-gray-700">
                  Add Client Group
                </p>
                <div className="space-y-2.5">
                  <select
                    value={groupClientId}
                    onChange={(e) => setGroupClientId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 appearance-none"
                  >
                    <option value="">Select Client *</option>
                    {clients
                      .filter((c) => c.is_active)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  <input
                    placeholder="Group Name *"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  />
                  <input
                    type="email"
                    placeholder="Group Email"
                    value={groupEmail}
                    onChange={(e) => setGroupEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  />

                  <input
                    type="tel"
                    placeholder="Group Phone"
                    value={groupPhone}
                    onChange={(e) => setGroupPhone(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 font-mono"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddMode(null)}
                    className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitGroup}
                    disabled={!groupClientId || !groupName.trim()}
                    className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    Add Group
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Client list */}
        <div className="flex-1 overflow-auto divide-y divide-gray-50">
          {filtered.map((c, i) => {
            const totalTasks = tasks.filter((t) => t.client_id === c.id).length;
            const completedTasks = tasks.filter(
              (t) => t.client_id === c.id && t.status === "COMPLETED",
            ).length;
            const groupCount =
              c.client_group?.filter((g) => g.is_active).length ?? 0;
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.025 }}
                onClick={() =>
                  setSelected(selectedClient?.id === c.id ? null : c)
                }
                className={`w-full text-left px-5 py-4 hover:bg-gray-50/70 transition-colors ${selectedClient?.id === c.id ? "bg-gray-50 border-l-2 border-l-gray-900" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Building2 size={13} className="text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {c.name}
                        </span>
                        {!c.is_active && (
                          <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-mono">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-400 font-mono">
                          {c.email || "No email"}
                        </span>
                        {groupCount > 0 && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <Users size={9} /> {groupCount} group
                            {groupCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-gray-400">
                      {completedTasks}/{totalTasks} tasks
                    </div>
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
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="hidden lg:flex flex-col bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex-1"
          >
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-50 shrink-0">
              <div className="min-w-0 pr-4">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {selectedClient.name}
                </h3>
                <span className="text-xs text-gray-400">
                  {selectedClient.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors shrink-0"
              >
                <X size={13} className="text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-5 space-y-5">
              {/* Info */}
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["Email", selectedClient.email || "—"],
                    ["Phone", selectedClient.phone || "—"],
                    [
                      "Status",
                      selectedClient.is_active ? "Active" : "Inactive",
                    ],
                    ["Since", fmtDate(selectedClient.created_at)],
                  ] as const
                ).map(([l, v]) => (
                  <div key={l}>
                    <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">
                      {l}
                    </div>
                    <div className="text-xs font-medium text-gray-800 font-mono truncate">
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              {/* Groups */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Groups ({groups.length})
                  </h4>
                  {canAdd && (
                    <button
                      onClick={() => setShowDetailAddGroup(!showDetailAddGroup)}
                      className="text-[11px] text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
                    >
                      <Plus size={10} /> Add Group
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {showDetailAddGroup && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-3"
                    >
                      <div className="flex gap-2">
                        <input
                          placeholder="Group name"
                          value={detailGroupName}
                          onChange={(e) => setDetailGroupName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") submitDetailGroup();
                          }}
                          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                        />
                        <button
                          onClick={submitDetailGroup}
                          disabled={!detailGroupName.trim()}
                          className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1.5">
                  {groups.length === 0 ? (
                    <p className="text-xs text-gray-400">No groups yet.</p>
                  ) : (
                    groups.map((g) => {
                      const groupTasks = tasks.filter(
                        (t) => t.client_group_id === g.id,
                      );
                      return (
                        <div
                          key={g.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <Users size={11} className="text-gray-400" />
                            <span className="text-xs font-medium text-gray-700">
                              {g.group_name}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {groupTasks.length} tasks
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Tasks */}
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Tasks ({clientTasks.length})
                </h4>
                <div className="space-y-2">
                  {clientTasks.length === 0 ? (
                    <p className="text-xs text-gray-400">
                      No tasks linked yet.
                    </p>
                  ) : (
                    clientTasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 gap-2"
                      >
                        <span className="text-xs text-gray-700 font-medium truncate flex-1">
                          {t.title}
                        </span>
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
