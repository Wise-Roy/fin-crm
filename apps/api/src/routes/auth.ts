import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@repo/db";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const JWT_EXPIRES_IN = "7d";

/**
 * POST /api/auth/signup
 *
 * Creates a new organization (tenant) and owner user.
 *
 * Body: { name, email, password, organizationName }
 */
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, organizationName } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    organizationName?: string;
  };

  if (!name || !email || !password || !organizationName) {
    res
      .status(400)
      .json({ error: "name, email, password, and organizationName are required" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const subdomain = organizationName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (subdomain.length < 3) {
    res.status(400).json({ error: "Organization name must produce a subdomain of at least 3 characters" });
    return;
  }

  const existingTenant = await prisma.tenant.findUnique({ where: { subdomain } });
  if (existingTenant) {
    res.status(409).json({ error: "Organization subdomain already exists" });
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create tenant
    const newTenant = await tx.tenant.create({
      data: { name: organizationName, subdomain },
    });

    // 2. Create owner user
    const user = await tx.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password_hash,
        tenantId: newTenant.id,
        role: "OWNER",
      },
    });

    return tx.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { tenant: true },
    });
  });

  const token = jwt.sign({ userId: result.id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  res.status(201).json({
    token,
    user: {
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.role,
      is_active: result.is_active,
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        subdomain: result.tenant.subdomain,
      },
    },
  });
});

/**
 * POST /api/auth/login
 *
 * Authenticates user with email + password.
 * Optional `subdomain` to disambiguate multi-tenant emails.
 *
 * Body: { email, password, subdomain? }
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password, subdomain } = req.body as {
    email?: string;
    password?: string;
    subdomain?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Build query — scope to tenant if subdomain provided
  const where: Record<string, unknown> = { email: normalizedEmail };
  if (subdomain) {
    const tenant = await prisma.tenant.findUnique({ where: { subdomain } });
    if (!tenant) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    where.tenantId = tenant.id;
  }

  const users = await prisma.user.findMany({
    where: where as any,
    include: { tenant: true },
  });

  if (users.length === 0) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  // If multiple matches and no subdomain, ask client to specify
  if (users.length > 1) {
    const subdomains = users.map((u) => u.tenant.subdomain);
    res.status(409).json({
      error: "Email exists in multiple organizations. Provide subdomain.",
      tenants: subdomains,
    });
    return;
  }

  const user = users[0]!;

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (!user.is_active) {
    res.status(403).json({ error: "Account is inactive" });
    return;
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        subdomain: user.tenant.subdomain,
      },
    },
  });
});

/**
 * GET /api/auth/me
 *
 * Returns the current authenticated user's profile.
 */
router.get("/me", authenticate, async (req: Request, res: Response): Promise<void> => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user!.id },
    include: { tenant: true },
  });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      phone: user.phone,
      position: user.position,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        subdomain: user.tenant.subdomain,
      },
    },
  });
});

export default router;
