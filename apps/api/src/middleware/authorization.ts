import type { Request, Response, NextFunction } from "express";
import type { user_role } from "@repo/db";
import type { PermissionKey } from '../authorization/permissions.js';

/**
 * Middleware that checks if the authenticated user has a specific permission.
 * Permissions are derived from role in auth middleware.
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
 */
export function requireRole(...roles: user_role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Permission denied" });
      return;
    }

    next();
  };
}
