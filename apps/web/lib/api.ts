import type { Task, Client, ClientGroup, TeamMember, Reimbursement, Role, JoinRequest, Category, SubCategory, TaskPayment, TaskHistory, ClientRevenue } from "./types";

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

    me: () => request<MeResponse>("/auth/me"),
  },

  clients: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<PaginatedResponse<Client>>(`/clients${qs}`);
    },
    getById: (id: string) => request<{ client: Client }>(`/clients/${encodeURIComponent(id)}`),
    create: (data: { name: string; email?: string; phone?: string }) =>
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
  },

  joinRequests: {
    create: (data: {
      organizationName: string;
      name: string;
      email: string;
      password: string;
    }) =>
      request<{ joinRequest: { id: string; status: string } }>("/join-requests", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<{ data: JoinRequest[] }>(`/join-requests${qs}`);
    },

    approve: (id: string, role: Role) =>
      request<{ message: string }>(`/join-requests/${encodeURIComponent(id)}/approve`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),

    reject: (id: string) =>
      request<{ message: string }>(`/join-requests/${encodeURIComponent(id)}/reject`, {
        method: "PATCH",
      }),
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
