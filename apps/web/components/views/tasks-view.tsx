"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Lock } from "lucide-react";
import { motion } from "motion/react";
import type { Task, TaskStatus, Role } from "@/lib/types";
import { STATUS_CFG, STATUS_NEXT, can, fmtDate, isOverdue, getInitials } from "@/lib/utils";
import { StatusBadge, PriorityDot, Av } from "@/components/ui-atoms";

export function TasksView({
  tasks,
  onStatusChange,
  onAddTask,
  userRole,
}: {
  tasks: Task[];
  onStatusChange: (id: string, s: TaskStatus) => void;
  onAddTask: () => void;
  userRole: Role;
}) {
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (filter === "all" || t.status === filter) &&
          (!search ||
            [
              t.title,
              t.client?.name || "",
              t.users_task_assigned_to_employee_idTousers?.name || "",
            ].some((f) =>
              f.toLowerCase().includes(search.toLowerCase())
            ))
      ),
    [tasks, filter, search]
  );

  const tabs: Array<{ key: "all" | TaskStatus; label: string; count: number }> = [
    { key: "all", label: "All", count: tasks.length },
    {
      key: "TODO",
      label: "To Do",
      count: tasks.filter((t) => t.status === "TODO").length,
    },
    {
      key: "IN_PROGRESS",
      label: "In Progress",
      count: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    },
    {
      key: "REVIEW",
      label: "Review",
      count: tasks.filter((t) => t.status === "REVIEW").length,
    },
    {
      key: "COMPLETED",
      label: "Done",
      count: tasks.filter((t) => t.status === "COMPLETED").length,
    },
  ];

  return (
    <div className="space-y-4">
      {!can(userRole, "see_all") && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-xs text-blue-700 flex items-center gap-2">
          <Lock size={11} /> Showing your assigned tasks only
        </div>
      )}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-lg p-1 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === tab.key ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
            >
              {tab.label}
              <span
                className={`ml-1.5 font-mono text-[10px] ${filter === tab.key ? "opacity-60" : "opacity-40"}`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={12}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 w-44"
            />
          </div>
          {can(userRole, "add_task") && (
            <button
              onClick={onAddTask}
              className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-800 transition-all shadow-sm"
            >
              <Plus size={12} /> New Task
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/40">
                {[
                  "Task",
                  "Client",
                  "Assignee",
                  "Status",
                  "Priority",
                  "Due",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((task, i) => {
                const assignee = task.users_task_assigned_to_employee_idTousers;
                return (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-gray-50/40 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 max-w-[200px]">
                        {task.categories && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono shrink-0">
                            {task.categories.name}
                          </span>
                        )}
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {task.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[130px]">
                      <span className="text-xs text-gray-500 truncate block">
                        {task.client?.name || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Av
                          initials={assignee ? getInitials(assignee.name) : "?"}
                          size="sm"
                        />
                        <span className="text-xs text-gray-600 hidden lg:block">
                          {assignee?.name.split(" ")[0] || "Unassigned"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityDot priority={task.priority} />
                    </td>
                    <td className="px-4 py-3">
                      {task.due_date ? (
                        <span
                          className={`text-xs font-mono ${isOverdue(task.due_date, task.status) ? "text-red-500 font-semibold" : "text-gray-400"}`}
                        >
                          {isOverdue(task.due_date, task.status) && "⚠ "}
                          {fmtDate(task.due_date)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {STATUS_NEXT[task.status] && (
                        <button
                          onClick={() =>
                            onStatusChange(task.id, STATUS_NEXT[task.status]!)
                          }
                          className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors opacity-0 group-hover:opacity-100 whitespace-nowrap font-medium"
                        >
                          → {STATUS_CFG[STATUS_NEXT[task.status]!].label}
                        </button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-14 text-sm text-gray-400">
              No tasks match the filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
