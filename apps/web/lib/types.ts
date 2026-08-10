export type AuthScreen =
  | "landing"
  | "login"
  | "signup"
  | "create_org"
  | "join_org"
  | "pending_approval"
  | "app";

export type Role = "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE";

export type View =
  | "dashboard"
  | "tasks"
  | "clients"
  | "team"
  | "reimbursements"
  | "analytics"
  | "configuration";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "WAITING_CLIENT" | "REVIEW" | "COMPLETED" | "CANCELLED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ReimbStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

export type AuthMode = "login" | "signup" | "create_org" | "join_org";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  orgName: string;
  orgId: string;
  orgSubdomain: string;
  initials: string;
}

export type JoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface JoinRequest {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  status: JoinRequestStatus;
  assigned_role?: Role | null;
  responded_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PendingMember {
  id: string;
  name: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  assignedRole?: Role;
}

// Backend-aligned interfaces

export interface Task {
  id: string;
  tenant_id: string;
  title: string;
  description?: string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  assigned_to_employee_id?: string | null;
  client_id?: string | null;
  client_group_id?: string | null;
  created_by: string;
  status: TaskStatus;
  priority: Priority;
  due_date?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  // Included relations from TASK_INCLUDES
  client?: { id: string; name: string } | null;
  users_task_assigned_to_employee_idTousers?: { id: string; name: string; email: string } | null;
  users_task_created_byTousers?: { id: string; name: string } | null;
  categories?: { id: string; name: string } | null;
  sub_categories?: { id: string; name: string } | null;
}

export interface ClientGroup {
  id: string;
  tenant_id: string;
  client_id: string;
  group_name: string;
  email?: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  client_group?: ClientGroup[];
}

export interface TeamMember {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  position?: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reimbursement {
  id: string;
  tenant_id: string;
  task_id: string;
  amount: number;
  proof_file?: string | null;
  description?: string | null;
  status: ReimbStatus;
  created_at: string;
  updated_at: string;
  // Included relation
  task?: { id: string; title: string } | null;
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  sub_categories: SubCategory[];
}

export interface SubCategory {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
}

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export interface TaskPayment {
  id: string;
  tenant_id: string;
  task_id: string;
  payment_type: string;
  amount: number;
  payment_status: PaymentStatus;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
  task?: {
    id: string;
    title: string;
    status: TaskStatus;
    client_id?: string | null;
    client?: { id: string; name: string } | null;
  } | null;
}

export interface TaskHistory {
  id: string;
  tenant_id: string;
  task_id: string;
  changed_by_user_id?: string | null;
  action: string;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  created_at: string;
  users?: { id: string; name: string } | null;
}

export interface ClientRevenue {
  total_paid: number;
  paid_count: number;
  total_pending: number;
  pending_count: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
