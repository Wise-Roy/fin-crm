import type { User, Tenant, Role } from "@repo/db";

export interface AuthenticatedUser {
  id: string;
  authUserId: string;
  email: string;
  status: string;
  tenant: Tenant;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      tenant?: Tenant;
      role?: Role;
      permissions?: string[];
    }
  }
}
