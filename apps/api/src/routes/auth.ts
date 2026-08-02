import { Router } from "express";
import type { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@repo/db";
import type { Tenant } from "@repo/db";
import { authenticate } from '../middleware/auth.js';

const router = Router();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * POST /api/auth/provision
 *
 * Provisions an application user after Supabase signup.
 * Requires a valid Supabase JWT. Creates tenant + default roles if first user,
 * otherwise requires tenantId.
 */
router.post("/provision", async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  const {
    data: { user: authUser },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !authUser) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  if (!authUser.email_confirmed_at) {
    res.status(403).json({ error: "Email not verified" });
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: { authUserId: authUser.id },
  });

  if (existingUser) {
    res.status(409).json({ error: "User already provisioned" });
    return;
  }

  const { tenantName, tenantId } = req.body as {
    tenantName?: string;
    tenantId?: string;
  };

  let tenant: Tenant;
  let roleName: "owner" | "employee";

  if (tenantId) {
    // Joining existing tenant
    const found = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!found) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }
    if (found.status !== "active") {
      res.status(403).json({ error: "Tenant is not active" });
      return;
    }
    tenant = found;
    roleName = "employee";
  } else {
    // Creating new tenant
    if (!tenantName) {
      res.status(400).json({ error: "tenantName is required when creating a new organization" });
      return;
    }

    const slug = tenantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const existingSlug = await prisma.tenant.findUnique({ where: { slug } });
    if (existingSlug) {
      res.status(409).json({ error: "Organization slug already exists" });
      return;
    }

    tenant = await prisma.tenant.create({
      data: { name: tenantName, slug },
    });

    // Create default roles for new tenant
    const roleNames = ["owner", "admin", "manager", "employee"] as const;
    await prisma.role.createMany({
      data: roleNames.map((name) => ({
        name,
        tenantId: tenant.id,
      })),
    });

    roleName = "owner";
  }

  const role = await prisma.role.findUnique({
    where: { tenantId_name: { tenantId: tenant.id, name: roleName } },
  });

  if (!role) {
    res.status(500).json({ error: "Failed to resolve role" });
    return;
  }

  const user = await prisma.user.create({
    data: {
      authUserId: authUser.id,
      email: authUser.email!,
      tenantId: tenant.id,
      roleId: role.id,
    },
    include: { tenant: true, role: true },
  });

  res.status(201).json({ user });
});

/**
 * GET /api/auth/me
 *
 * Returns the current authenticated user's profile.
 */
router.get("/me", authenticate, (req: Request, res: Response): void => {
  res.json({
    user: req.user,
    tenant: req.tenant,
    role: req.role,
  });
});

export default router;
