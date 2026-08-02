export const PERMISSIONS = {
  // Employee module
  EMPLOYEE_READ: "employee.read",
  EMPLOYEE_CREATE: "employee.create",
  EMPLOYEE_UPDATE: "employee.update",
  EMPLOYEE_DELETE: "employee.delete",

  // Client module
  CLIENT_READ: "client.read",
  CLIENT_CREATE: "client.create",
  CLIENT_UPDATE: "client.update",
  CLIENT_DELETE: "client.delete",

  // Task module
  TASK_READ: "task.read",
  TASK_CREATE: "task.create",
  TASK_UPDATE: "task.update",
  TASK_ASSIGN: "task.assign",
  TASK_DELETE: "task.delete",

  // Administration
  TENANT_MANAGE: "tenant.manage",
  ROLE_MANAGE: "role.manage",
  USER_MANAGE: "user.manage",

  // Reporting
  AUDIT_READ: "audit.read",
  DASHBOARD_READ: "dashboard.read",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * All permission definitions for seeding.
 * Each entry: [key, module, action, description]
 */
export const PERMISSION_DEFINITIONS: Array<{
  key: string;
  module: string;
  action: string;
  description: string;
}> = [
  { key: PERMISSIONS.EMPLOYEE_READ, module: "employee", action: "read", description: "View employees" },
  { key: PERMISSIONS.EMPLOYEE_CREATE, module: "employee", action: "create", description: "Create employees" },
  { key: PERMISSIONS.EMPLOYEE_UPDATE, module: "employee", action: "update", description: "Update employees" },
  { key: PERMISSIONS.EMPLOYEE_DELETE, module: "employee", action: "delete", description: "Delete employees" },

  { key: PERMISSIONS.CLIENT_READ, module: "client", action: "read", description: "View clients" },
  { key: PERMISSIONS.CLIENT_CREATE, module: "client", action: "create", description: "Create clients" },
  { key: PERMISSIONS.CLIENT_UPDATE, module: "client", action: "update", description: "Update clients" },
  { key: PERMISSIONS.CLIENT_DELETE, module: "client", action: "delete", description: "Delete clients" },

  { key: PERMISSIONS.TASK_READ, module: "task", action: "read", description: "View tasks" },
  { key: PERMISSIONS.TASK_CREATE, module: "task", action: "create", description: "Create tasks" },
  { key: PERMISSIONS.TASK_UPDATE, module: "task", action: "update", description: "Update tasks" },
  { key: PERMISSIONS.TASK_ASSIGN, module: "task", action: "assign", description: "Assign tasks" },
  { key: PERMISSIONS.TASK_DELETE, module: "task", action: "delete", description: "Delete tasks" },

  { key: PERMISSIONS.TENANT_MANAGE, module: "tenant", action: "manage", description: "Manage tenant settings" },
  { key: PERMISSIONS.ROLE_MANAGE, module: "role", action: "manage", description: "Manage roles and permissions" },
  { key: PERMISSIONS.USER_MANAGE, module: "user", action: "manage", description: "Manage users" },

  { key: PERMISSIONS.AUDIT_READ, module: "audit", action: "read", description: "View audit logs" },
  { key: PERMISSIONS.DASHBOARD_READ, module: "dashboard", action: "read", description: "View dashboard" },
];

/**
 * Default role-to-permission mappings.
 * Owner gets all. Admin gets operational. Manager gets business. Employee gets daily work.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: Object.values(PERMISSIONS),

  admin: [
    PERMISSIONS.EMPLOYEE_READ,
    PERMISSIONS.EMPLOYEE_CREATE,
    PERMISSIONS.EMPLOYEE_UPDATE,
    PERMISSIONS.EMPLOYEE_DELETE,
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.CLIENT_CREATE,
    PERMISSIONS.CLIENT_UPDATE,
    PERMISSIONS.CLIENT_DELETE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.ROLE_MANAGE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.DASHBOARD_READ,
  ],

  manager: [
    PERMISSIONS.EMPLOYEE_READ,
    PERMISSIONS.EMPLOYEE_CREATE,
    PERMISSIONS.EMPLOYEE_UPDATE,
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.CLIENT_CREATE,
    PERMISSIONS.CLIENT_UPDATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.DASHBOARD_READ,
  ],

  employee: [
    PERMISSIONS.EMPLOYEE_READ,
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.DASHBOARD_READ,
  ],
};
