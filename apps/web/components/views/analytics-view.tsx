"use client";

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
import type { Task, Client, TeamMember } from "@/lib/types";

export function AnalyticsView({
  tasks,
  clients,
  teamMembers,
}: {
  tasks: Task[];
  clients: Client[];
  teamMembers: TeamMember[];
}) {
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

  const empData = teamMembers.map((e) => ({
    name: e.name.split(" ")[0],
    completed: tasks.filter((t) => t.assigned_to_employee_id === e.id && t.status === "COMPLETED").length,
    active: tasks.filter((t) => t.assigned_to_employee_id === e.id && t.status !== "COMPLETED" && t.status !== "CANCELLED").length,
  }));

  // Tasks per client
  const clientData = clients
    .map((c) => ({
      name: c.name.split(" ")[0],
      tasks: tasks.filter((t) => t.client_id === c.id).length,
    }))
    .sort((a, b) => b.tasks - a.tasks)
    .slice(0, 8);

  const statusData = [
    {
      name: "To Do",
      value: tasks.filter((t) => t.status === "TODO").length,
      color: "#9CA3AF",
    },
    {
      name: "In Progress",
      value: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      color: "#374151",
    },
    {
      name: "Waiting Client",
      value: tasks.filter((t) => t.status === "WAITING_CLIENT").length,
      color: "#F97316",
    },
    {
      name: "Review",
      value: tasks.filter((t) => t.status === "REVIEW").length,
      color: "#F59E0B",
    },
    {
      name: "Completed",
      value: tasks.filter((t) => t.status === "COMPLETED").length,
      color: "#10B981",
    },
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">
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
                <XAxis
                  dataKey="m"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...ttp} />
                <Area
                  type="monotone"
                  dataKey="added"
                  stroke="#d1d5db"
                  fill="url(#ga)"
                  name="Added"
                />
                <Area
                  type="monotone"
                  dataKey="done"
                  stroke="#111827"
                  strokeWidth={2}
                  fill="url(#gd)"
                  name="Completed"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">
            Tasks by Client
          </h3>
          {clientData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={clientData}
                margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f3f4f6"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...ttp} />
                <Bar
                  dataKey="tasks"
                  fill="#111827"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={44}
                  name="Tasks"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">
            Employee Performance
          </h3>
          {empData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={empData}
                layout="vertical"
                margin={{ top: 4, right: 4, bottom: 0, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f3f4f6"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip {...ttp} />
                <Bar
                  dataKey="completed"
                  fill="#111827"
                  radius={[0, 4, 4, 0]}
                  name="Completed"
                  maxBarSize={16}
                />
                <Bar
                  dataKey="active"
                  fill="#e5e7eb"
                  radius={[0, 4, 4, 0]}
                  name="Active"
                  maxBarSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">
            Status Distribution
          </h3>
          {statusData.length === 0 ? (
            <div className="h-[160px] flex items-center justify-center text-sm text-gray-400">No data yet</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...ttp} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {statusData.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ background: s.color }}
                      />
                      <span className="text-xs text-gray-600">{s.name}</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-gray-900">
                      {s.value}
                    </span>
                  </div>
                ))}
                <div className="pt-1 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Total</span>
                  <span className="text-xs font-mono font-semibold text-gray-900">
                    {statusData.reduce((s, d) => s + d.value, 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
