import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@repo/db";
import type { AuthenticatedUser } from "../types/auth.js";
import { DEFAULT_ROLE_PERMISSIONS } from "../authorization/permissions.js";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

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

  let payload: { userId: string };
  try {
    payload = jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const appUser = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { tenant: true },
  });

  if (!appUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (!appUser.is_active) {
    res.status(403).json({ error: "Account is inactive" });
    return;
  }

  // Derive permissions from role enum
  const roleName = appUser.role.toLowerCase();
  const permissions = DEFAULT_ROLE_PERMISSIONS[roleName] || [];

  const authenticatedUser: AuthenticatedUser = {
    id: appUser.id,
    email: appUser.email,
    name: appUser.name,
    role: appUser.role,
    is_active: appUser.is_active,
    tenantId: appUser.tenantId,
  };

  req.user = authenticatedUser;
  req.tenant = appUser.tenant;
  req.permissions = permissions;

  next();
}
