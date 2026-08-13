import type { Task, Client, ClientGroup, TeamMember, Reimbursement, Role, Category, SubCategory, TaskPayment, TaskHistory, ClientRevenue, Dsc, Notification } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const TOKEN_KEY = "fincrm_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      (body as { error?: string }).error || `Request failed: ${res.status}`,
      res.status,
      body as Record<string, unknown>
    );
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// --- Response types matching real backend ---

interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  phone?: string | null;
  position?: string | null;
  tenant: { id: string; name: string; subdomain: string };
}

interface AuthResponse {
  user: AuthUserResponse;
  token: string;
}

interface MeResponse {
  user: AuthUserResponse;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// --- API ---

export const api = {
  auth: {
    signup: (data: {
      name: string;
      email: string;
      password: string;
      organizationName: string;
      phone: string;
    }) =>
      request<AuthResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    login: (data: { email: string; password: string; subdomain?: string }) =>
      request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    verifyOtp: (data: { email: string; otp: string }) =>
      request<AuthResponse>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    forgotPassword: (email: string) =>
      request<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),

    resetPassword: (data: { token: string; password: string }) =>
      request<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    me: () => request<MeResponse>("/auth/me"),
  },

  clients: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<PaginatedResponse<Client>>(`/clients${qs}`);
    },
    getById: (id: string) => request<{ client: Client }>(`/clients/${encodeURIComponent(id)}`),
    create: (data: Record<string, unknown>) =>
      request<{ client: Client }>("/clients", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request<{ client: Client }>(`/clients/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/clients/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    quickCreate: (name: string) =>
      request<{ client: Client }>("/clients/quick", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    createGroup: (clientId: string, data: { group_name: string; email?: string; phone?: string }) =>
      request<{ group: ClientGroup }>(`/clients/${encodeURIComponent(clientId)}/groups`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateGroup: (clientId: string, groupId: string, data: Record<string, unknown>) =>
      request<{ group: ClientGroup }>(`/clients/${encodeURIComponent(clientId)}/groups/${encodeURIComponent(groupId)}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteGroup: (clientId: string, groupId: string) =>
      request<{ message: string }>(`/clients/${encodeURIComponent(clientId)}/groups/${encodeURIComponent(groupId)}`, {
        method: "DELETE",
      }),
    revenue: (clientId: string) =>
      request<{ revenue: ClientRevenue }>(`/clients/${encodeURIComponent(clientId)}/revenue`),
  },

  tasks: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<PaginatedResponse<Task>>(`/tasks${qs}`);
    },
    my: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<PaginatedResponse<Task>>(`/tasks/my${qs}`);
    },
    getById: (id: string) => request<{ task: Task }>(`/tasks/${encodeURIComponent(id)}`),
    create: (data: Record<string, unknown>) =>
      request<{ task: Task }>("/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request<{ task: Task }>(`/tasks/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: string) =>
      request<{ task: Task }>(`/tasks/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    assign: (id: string, assigned_to_employee_id: string) =>
      request<{ task: Task }>(`/tasks/${encodeURIComponent(id)}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ assigned_to_employee_id }),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/tasks/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    history: (id: string) =>
      request<{ data: TaskHistory[] }>(`/tasks/${encodeURIComponent(id)}/history`),
  },

  payments: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<PaginatedResponse<TaskPayment>>(`/payments${qs}`);
    },
    byTask: (taskId: string) =>
      request<{ data: TaskPayment[] }>(`/payments/by-task/${encodeURIComponent(taskId)}`),
    create: (data: { task_id: string; payment_type: string; amount: number }) =>
      request<{ payment: TaskPayment }>("/payments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    markPaid: (id: string) =>
      request<{ payment: TaskPayment }>(`/payments/${encodeURIComponent(id)}/mark-paid`, {
        method: "PATCH",
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/payments/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  },

  dsc: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<PaginatedResponse<Dsc>>(`/dsc${qs}`);
    },
    getById: (id: string) => request<{ dsc: Dsc }>(`/dsc/${encodeURIComponent(id)}`),
    create: (data: {
      pan_number: string; name: string; related_company: string;
      issue_date: string; valid_till_date: string; issuing_authority: string;
      password: string; client_id?: string; client_group_id?: string;
      position?: string; mobile_number?: string;
    }) =>
      request<{ dsc: Dsc }>("/dsc", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request<{ dsc: Dsc }>(`/dsc/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/dsc/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  },

  reimbursements: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<PaginatedResponse<Reimbursement>>(`/reimbursements${qs}`);
    },
    create: (data: { task_id: string; amount: number; description?: string }) =>
      request<{ reimbursement: Reimbursement }>("/reimbursements", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    approve: (id: string) =>
      request<{ reimbursement: Reimbursement }>(`/reimbursements/${encodeURIComponent(id)}/approve`, {
        method: "PATCH",
      }),
    reject: (id: string) =>
      request<{ reimbursement: Reimbursement }>(`/reimbursements/${encodeURIComponent(id)}/reject`, {
        method: "PATCH",
      }),
  },

  team: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<PaginatedResponse<TeamMember>>(`/team${qs}`);
    },
    create: (data: {
      name: string;
      email: string;
      password: string;
      role: string;
      position?: string;
      phone?: string;
    }) =>
      request<{ member: TeamMember }>("/team", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: {
      name?: string;
      email?: string;
      phone?: string;
      position?: string;
      role?: string;
      password?: string;
    }) =>
      request<{ member: TeamMember }>(`/team/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },


  config: {
    get: () => request<{ config: Record<string, unknown> | null }>("/config"),
    update: (theme: Record<string, unknown>) =>
      request<{ config: Record<string, unknown> }>("/config", {
        method: "PUT",
        body: JSON.stringify({ theme }),
      }),
    uploadLogo: (file: string, mimeType: string) =>
      request<{ logoUrl: string }>("/config/logo", {
        method: "POST",
        body: JSON.stringify({ file, mimeType }),
      }),
    deleteLogo: () =>
      request<{ success: boolean }>("/config/logo", { method: "DELETE" }),
  },

  notifications: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<{ data: Notification[] }>(`/notifications${qs}`);
    },
    markAllRead: () =>
      request<{ success: boolean }>("/notifications/mark-all-read", { method: "PATCH" }),
    markRead: (id: string) =>
      request<{ success: boolean }>(`/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" }),
  },

  categories: {
    list: () => request<{ data: Category[] }>("/categories"),

    create: (name: string) =>
      request<{ category: Category }>("/categories", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),

    createSubcategory: (categoryId: string, name: string) =>
      request<{ subcategory: SubCategory }>(
        `/categories/${encodeURIComponent(categoryId)}/subcategories`,
        { method: "POST", body: JSON.stringify({ name }) }
      ),
  },
};
