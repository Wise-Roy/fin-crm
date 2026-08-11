import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@repo/db";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

/**
 * GET /api/team
 * Authenticated — lists all users in the current tenant.
 */
router.get("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.user!.tenantId;

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where: { tenantId } }),
  ]);

  res.json({
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * POST /api/team
 * Owner adds a new team member directly (no join request needed).
 * Body: { name, email, password, role, position?, phone? }
 */
router.post("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  if (user.role !== "OWNER") {
    res.status(403).json({ error: "Only the owner can add team members" });
    return;
  }

  const { name, email, password, role, position, phone } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    position?: string;
    phone?: string;
  };

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "name, email, password, and role are required" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const validRoles = ["ADMIN", "MANAGER", "EMPLOYEE"];
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: `Role must be one of: ${validRoles.join(", ")}` });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: user.tenantId, email: normalizedEmail } },
  });

  if (existing) {
    res.status(409).json({ error: "A member with this email already exists" });
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);

  const member = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password_hash,
      tenantId: user.tenantId,
      role: role as any,
      position: position?.trim() || null,
      phone: phone?.trim() || null,
    },
  });

  res.status(201).json({ member });
});

export default router;
