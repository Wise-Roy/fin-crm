import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TaskStatus, Priority, ReimbStatus, PaymentStatus, Role, View } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const STATUS_CFG: Record<
  TaskStatus,
  { label: string; cls: string; bar: string }
> = {
  TODO: {
    label: "To Do",
    cls: "bg-gray-100 text-gray-500",
    bar: "bg-gray-300",
  },
  IN_PROGRESS: {
    label: "In Progress",
    cls: "bg-blue-50 text-blue-700",
    bar: "bg-blue-400",
  },
  WAITING_CLIENT: {
    label: "Waiting Client",
    cls: "bg-orange-50 text-orange-600",
    bar: "bg-orange-400",
  },
  REVIEW: {
    label: "Under Review",
    cls: "bg-amber-50 text-amber-700",
    bar: "bg-amber-400",
  },
  COMPLETED: {
    label: "Completed",
    cls: "bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-400",
  },
  CANCELLED: {
    label: "Cancelled",
    cls: "bg-gray-100 text-gray-400",
    bar: "bg-gray-200",
  },
};

export const PRIORITY_DOT: Record<Priority, string> = {
  LOW: "bg-gray-300",
  MEDIUM: "bg-blue-400",
  HIGH: "bg-orange-400",
  URGENT: "bg-red-500",
};

export const STATUS_NEXT: Partial<Record<TaskStatus, TaskStatus>> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "REVIEW",
  WAITING_CLIENT: "IN_PROGRESS",
  REVIEW: "COMPLETED",
};

export const REIMB_CLS: Record<ReimbStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-600",
  PAID: "bg-blue-50 text-blue-700",
};

const ALL_VIEWS: View[] = ["dashboard", "tasks", "clients", "team", "reimbursements", "analytics"];

export const ROLE_VIEWS: Record<Role, View[]> = {
  OWNER: [...ALL_VIEWS, "configuration"],
  ADMIN: ALL_VIEWS,
  MANAGER: ALL_VIEWS,
  EMPLOYEE: ALL_VIEWS,
};

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
};

export const ROLE_BADGE: Record<Role, string> = {
  OWNER: "bg-gray-900 text-white",
  ADMIN: "bg-blue-50 text-blue-700",
  MANAGER: "bg-purple-50 text-purple-700",
  EMPLOYEE: "bg-amber-50 text-amber-700",
};

type Action = "add_task" | "add_client" | "approve_reimb" | "manage_team" | "see_all" | "view_requests" | "manage_payments" | "mark_payment_done" | "view_revenue";

export const can = (role: Role, action: Action): boolean => {
  switch (action) {
    // OWNER, ADMIN, MANAGER can add tasks (not EMPLOYEE)
    case "add_task":
      return (["OWNER", "ADMIN", "MANAGER"] as Role[]).includes(role);
    // Only OWNER, ADMIN can add clients
    case "add_client":
      return (["OWNER", "ADMIN"] as Role[]).includes(role);
    // Only OWNER can view/manage join requests
    case "view_requests":
    case "manage_team":
      return role === "OWNER";
    // OWNER, ADMIN, MANAGER see all tasks; EMPLOYEE sees own
    case "see_all":
      return (["OWNER", "ADMIN", "MANAGER"] as Role[]).includes(role);
    // OWNER, ADMIN can approve reimbursements
    case "approve_reimb":
      return (["OWNER", "ADMIN"] as Role[]).includes(role);
    // OWNER, ADMIN can manage payments (create)
    case "manage_payments":
      return (["OWNER", "ADMIN"] as Role[]).includes(role);
    // Only OWNER can mark payment done and view revenue
    case "mark_payment_done":
    case "view_revenue":
      return role === "OWNER";
    default:
      return false;
  }
};

export const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const isOverdue = (d: string | undefined | null, s: TaskStatus) =>
  !!d && s !== "COMPLETED" && s !== "CANCELLED" && new Date(d) < new Date();

export const PAYMENT_CLS: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  SUCCESS: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-600",
  REFUNDED: "bg-blue-50 text-blue-700",
};
