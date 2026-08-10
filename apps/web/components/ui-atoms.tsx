"use client";

import type { TaskStatus, Priority, Role } from "@/lib/types";
import { STATUS_CFG, PRIORITY_DOT, ROLE_BADGE, ROLE_LABELS } from "@/lib/utils";

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, cls } = STATUS_CFG[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs  font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: Priority }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400 ">
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[priority]}`}
      />
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

export function Av({
  initials,
  size = "md",
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
}) {
  const s = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
  }[size];
  return (
    <div
      className={`${s} rounded-full bg-gray-900 text-white flex items-center justify-center  font-medium shrink-0`}
    >
      {initials}
    </div>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[role]}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
