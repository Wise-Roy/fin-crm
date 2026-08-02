import type { Request, Response, NextFunction } from "express";
import type { PermissionKey } from '../authorization/permissions.js';
import type { RoleName } from "@repo/db";

/**
 * Middleware that checks if the authenticated user has a specific permission.
 * Must be used after the authenticate middleware.
 *
 * Usage: router.get("/clients", authenticate, requirePermission("client.read"), handler)
 */
export function requirePermission(permission: PermissionKey) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.permissions) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!req.permissions.includes(permission)) {
      res.status(403).json({ error: "Permission denied" });
      return;
    }

    next();
  };
}

/**
 * Middleware that checks if the authenticated user has a specific role.
 * Must be used after the authenticate middleware.
 *
 * Usage: router.post("/admin/settings", authenticate, requireRole("owner"), handler)
 */
export function requireRole(...roles: RoleName[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.role) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!roles.includes(req.role.name)) {
      res.status(403).json({ error: "Permission denied" });
      return;
    }

    next();
  };
}
