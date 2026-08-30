"use client";

import { useState, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { CheckCircle2, X } from "lucide-react";
import type { Task, Client, TeamMember, Role } from "@/lib/types";
import { fmtDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui-atoms";

export function AnalyticsView({
  tasks,
  clients,
  teamMembers,
  userRole,
}: {
  tasks: Task[];
  clients: Client[];
  teamMembers: TeamMember[];
  userRole: Role;
}) {
  const [empFilter, setEmpFilter] = useState<string>("all");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Group tasks by month
  const monthlyMap = new Map<string, { added: number; done: number }>();
  tasks.forEach((t) => {
    const d = new Date(t.created_at);
    const key = d.toLocaleDateString("en-US", { month: "short" });
    const entry = monthlyMap.get(key) || { added: 0, done: 0 };
    entry.added++;
    if (t.status === "COMPLETED") entry.done++;
    monthlyMap.set(key, entry);
  });
  const monthlyData = Array.from(monthlyMap.entries()).map(([m, v]) => ({ m, ...v }));

  // Employee data — sorted by total work (completed + active), top 5
  const allEmpData = useMemo(() =>
    teamMembers
      .map((e) => {
        const completed = tasks.filter((t) => t.assigned_to_employee_id === e.id && t.status === "COMPLETED").length;
        const active = tasks.filter((t) => t.assigned_to_employee_id === e.id && t.status !== "COMPLETED" && t.status !== "CANCELLED").length;
        return { id: e.id, name: e.name.split(" ")[0], fullName: e.name, completed, active, total: completed + active };
      })
      .sort((a, b) => b.total - a.total),
    [teamMembers, tasks]
  );

  const empData = useMemo(() => {
    if (empFilter === "all") return allEmpData.slice(0, 5);
    return allEmpData.filter((e) => e.id === empFilter);
  }, [allEmpData, empFilter]);

  // Tasks per client
  const clientData = clients
    .map((c) => ({
      id: c.id,
      name: c.name.length > 10 ? c.name.split(" ")[0] : c.name,
      fullName: c.name,
      tasks: tasks.filter((t) => t.client_id === c.id).length,
    }))
    .sort((a, b) => b.tasks - a.tasks)
    .slice(0, 8);

  const handleBarClick = useCallback((data: any) => {
    if (data?.id) {
      setSelectedClientId((prev) => prev === data.id ? null : data.id);
    }
  }, []);

  const selectedClient = selectedClientId ? clients.find((c) => c.id === selectedClientId) : null;
  const selectedClientTasks = useMemo(() => {
    if (!selectedClientId) return [];
    return tasks.filter((t) => t.client_id === selectedClientId && t.status === "COMPLETED");
  }, [tasks, selectedClientId]);

  const statusData = [
    { name: "To Do", value: tasks.filter((t) => t.status === "TODO").length, color: "#9CA3AF" },
    { name: "In Progress", value: tasks.filter((t) => t.status === "IN_PROGRESS").length, color: "#374151" },
    { name: "Waiting Client", value: tasks.filter((t) => t.status === "WAITING_CLIENT").length, color: "#F97316" },
    { name: "Review", value: tasks.filter((t) => t.status === "REVIEW").length, color: "#F59E0B" },
    { name: "Completed", value: tasks.filter((t) => t.status === "COMPLETED").length, color: "#10B981" },
  ].filter((s) => s.value > 0);

  const ttp = {
    contentStyle: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      fontSize: "11px",
      padding: "8px 12px",
    },
    labelStyle: { color: "#374151", fontWeight: 600, marginBottom: 4 },
    cursor: { stroke: "#f3f4f6" },
  };

  const isOwner = userRole === "OWNER";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="typo-card-title text-gray-900 mb-5">
            Monthly Task Volume
          </h3>
          {monthlyData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={monthlyData}
                margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
              >
                <defs>
                  <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e5e7eb" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#e5e7eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111827" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip {...ttp} />
                <Area type="monotone" dataKey="added" stroke="#d1d5db" fill="url(#ga)" name="Added" />
                <Area type="monotone" dataKey="done" stroke="#111827" strokeWidth={2} fill="url(#gd)" name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="typo-card-title text-gray-900 mb-5">
            Tasks by Client
          </h3>
          {clientData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={clientData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip {...ttp} />
                <Bar dataKey="tasks" radius={[4, 4, 0, 0]} maxBarSize={44} name="Tasks" onClick={handleBarClick} className="cursor-pointer">
                  {clientData.map((entry) => (
                    <Cell key={entry.id} fill={entry.id === selectedClientId ? "#374151" : "#111827"} stroke={entry.id === selectedClientId ? "#111827" : "none"} strokeWidth={entry.id === selectedClientId ? 2 : 0} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {isOwner && (
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="typo-card-title text-gray-900">
                Employee Performance
              </h3>
              <select
                value={empFilter}
                onChange={(e) => setEmpFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 appearance-none cursor-pointer"
              >
                <option value="all">Top 5</option>
                {allEmpData.map((e) => (
                  <option key={e.id} value={e.id}>{e.fullName}</option>
                ))}
              </select>
            </div>
            {empData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={empData} layout="vertical" margin={{ top: 4, right: 4, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip {...ttp} />
                  <Bar dataKey="completed" fill="#111827" radius={[0, 4, 4, 0]} name="Completed" maxBarSize={16} />
                  <Bar dataKey="active" fill="#e5e7eb" radius={[0, 4, 4, 0]} name="Active" maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="typo-card-title text-gray-900 mb-5">
            Status Distribution
          </h3>
          {statusData.length === 0 ? (
            <div className="h-[160px] flex items-center justify-center text-sm text-gray-400">No data yet</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                    {statusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...ttp} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {statusData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
                      <span className="text-xs text-gray-600">{s.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900">{s.value}</span>
                  </div>
                ))}
                <div className="pt-1 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Total</span>
                  <span className="text-xs font-semibold text-gray-900">
                    {statusData.reduce((s, d) => s + d.value, 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Completed Tasks for Selected Client — separate card */}
      {selectedClient && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="typo-card-title text-gray-900 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              Completed Tasks — {selectedClient.name}
              <span className="text-sm font-normal text-gray-400">({selectedClientTasks.length})</span>
            </h3>
            <button onClick={() => setSelectedClientId(null)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors">
              <X size={14} className="text-gray-400" />
            </button>
          </div>
          {selectedClientTasks.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No completed tasks for this client.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {selectedClientTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2.5 px-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-800 truncate">{t.title}</span>
                    {t.categories && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded shrink-0">{t.categories.name}</span>
                    )}
                    {t.sub_categories && (
                      <span className="text-xs bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded shrink-0">{t.sub_categories.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {t.users_task_assigned_to_employee_idTousers && (
                      <span className="text-xs text-gray-400">{t.users_task_assigned_to_employee_idTousers.name}</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {t.completed_at ? fmtDate(t.completed_at) : fmtDate(t.updated_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
