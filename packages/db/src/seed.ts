import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

/**
 * All CRM permissions following the <module>.<action> convention.
 */
const PERMISSION_DEFINITIONS = [
  { key: "employee.read", module: "employee", action: "read", description: "View employees" },
  { key: "employee.create", module: "employee", action: "create", description: "Create employees" },
  { key: "employee.update", module: "employee", action: "update", description: "Update employees" },
  { key: "employee.delete", module: "employee", action: "delete", description: "Delete employees" },

  { key: "client.read", module: "client", action: "read", description: "View clients" },
  { key: "client.create", module: "client", action: "create", description: "Create clients" },
  { key: "client.update", module: "client", action: "update", description: "Update clients" },
  { key: "client.delete", module: "client", action: "delete", description: "Delete clients" },

  { key: "task.read", module: "task", action: "read", description: "View tasks" },
  { key: "task.create", module: "task", action: "create", description: "Create tasks" },
  { key: "task.assign", module: "task", action: "assign", description: "Assign tasks" },
  { key: "task.delete", module: "task", action: "delete", description: "Delete tasks" },

  { key: "tenant.manage", module: "tenant", action: "manage", description: "Manage tenant settings" },
  { key: "role.manage", module: "role", action: "manage", description: "Manage roles and permissions" },
  { key: "user.manage", module: "user", action: "manage", description: "Manage users" },

  { key: "audit.read", module: "audit", action: "read", description: "View audit logs" },
  { key: "dashboard.read", module: "dashboard", action: "read", description: "View dashboard" },
];

/**
 * Default role-to-permission mappings.
 * Owner: all permissions
 * Admin: operational permissions (no tenant.manage)
 * Manager: business permissions
 * Employee: daily work only
 */
const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: PERMISSION_DEFINITIONS.map((p) => p.key),

  admin: [
    "employee.read", "employee.create", "employee.update", "employee.delete",
    "client.read", "client.create", "client.update", "client.delete",
    "task.read", "task.create", "task.assign", "task.delete",
    "user.manage", "role.manage",
    "audit.read", "dashboard.read",
  ],

  manager: [
    "employee.read", "employee.create", "employee.update",
    "client.read", "client.create", "client.update",
    "task.read", "task.create", "task.assign",
    "dashboard.read",
  ],

  employee: [
    "employee.read",
    "client.read",
    "task.read", "task.create",
    "dashboard.read",
  ],
};

async function seed() {
  console.log("Seeding permissions...");

  // Upsert all permissions
  for (const perm of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { module: perm.module, action: perm.action, description: perm.description },
      create: perm,
    });
  }

  console.log(`Seeded ${PERMISSION_DEFINITIONS.length} permissions.`);

  // Load all permissions for mapping
  const allPermissions = await prisma.permission.findMany();
  const permissionByKey = new Map(allPermissions.map((p) => [p.key, p]));

  // Get all roles across all tenants
  const allRoles = await prisma.role.findMany();

  console.log("Seeding role-permission mappings...");

  for (const role of allRoles) {
    const permissionKeys = DEFAULT_ROLE_PERMISSIONS[role.name];
    if (!permissionKeys) continue;

    for (const key of permissionKeys) {
      const permission = permissionByKey.get(key);
      if (!permission) {
        console.warn(`Permission "${key}" not found, skipping.`);
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }

    console.log(`  ${role.name}: ${permissionKeys.length} permissions assigned.`);
  }

  console.log("Seed complete.");
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
