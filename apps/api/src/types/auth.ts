import type { tenant, user_role } from "@repo/db";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: user_role;
  is_active: boolean;
  tenantId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      tenant?: tenant;
      permissions?: string[];
    }
  }
}
