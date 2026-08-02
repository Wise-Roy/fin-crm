import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@repo/db";
import type { AuthenticatedUser } from '../types/auth.js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !authUser) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const appUser = await prisma.user.findUnique({
    where: { authUserId: authUser.id },
    include: { tenant: true, role: true },
  });

  if (!appUser) {
    res.status(404).json({ error: "User not provisioned" });
    return;
  }

  if (appUser.status !== "active") {
    res.status(403).json({ error: "Account is inactive" });
    return;
  }

  if (appUser.tenant.status !== "active") {
    res.status(403).json({ error: "Tenant is inactive" });
    return;
  }

  if (!appUser.role.isActive) {
    res.status(403).json({ error: "Role is inactive" });
    return;
  }

  // Load permissions once per request
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId: appUser.role.id },
    include: { permission: true },
  });

  const permissions = rolePermissions.map((rp) => rp.permission.key);

  const authenticatedUser: AuthenticatedUser = {
    id: appUser.id,
    authUserId: appUser.authUserId,
    email: appUser.email,
    status: appUser.status,
    tenant: appUser.tenant,
    role: appUser.role,
  };

  req.user = authenticatedUser;
  req.tenant = appUser.tenant;
  req.role = appUser.role;
  req.permissions = permissions;

  next();
}
