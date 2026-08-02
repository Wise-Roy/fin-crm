export { prisma, PrismaClient } from "./prisma";
export { supabase } from "./supabase";
export type { Tenant, TenantSettings, Role, User, Permission, RolePermission } from "../generated/prisma/client";
export type { RoleName, TenantStatus, TenantPlan } from "../generated/prisma/client";
