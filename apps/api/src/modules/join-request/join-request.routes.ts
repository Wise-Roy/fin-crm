import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@repo/db";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/authorization.js";

const router = Router();

/**
 * POST /api/join-requests
 * Public — anyone can request to join an existing org.
 * Body: { organizationName, name, email, password }
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { organizationName, name, email, password } = req.body as {
    organizationName?: string;
    name?: string;
    email?: string;
    password?: string;
  };

  if (!organizationName || !name || !email || !password) {
    res.status(400).json({ error: "organizationName, name, email, and password are required" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  // Find tenant by name (case-insensitive)
  const tenant = await prisma.tenant.findFirst({
    where: { name: { equals: organizationName, mode: "insensitive" } },
  });

  if (!tenant) {
    res.status(404).json({ error: "Organisation not found" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists in this tenant
  const existingUser = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email: normalizedEmail } },
  });

  if (existingUser) {
    res.status(409).json({ error: "A user with this email already exists in this organisation" });
    return;
  }

  // Check for existing pending request
  const existingRequest = await prisma.join_request.findUnique({
    where: { tenant_id_email: { tenant_id: tenant.id, email: normalizedEmail } },
  });

  if (existingRequest) {
    if (existingRequest.status === "PENDING") {
      res.status(409).json({ error: "A join request is already pending for this email" });
      return;
    }
    if (existingRequest.status === "REJECTED") {
      // Allow re-request after rejection — update existing record
      const password_hash = await bcrypt.hash(password, 12);
      const updated = await prisma.join_request.update({
        where: { id: existingRequest.id },
        data: {
          name: name.trim(),
          password_hash,
          status: "PENDING",
          assigned_role: null,
          responded_by: null,
          updated_at: new Date(),
        },
      });
      res.status(201).json({ joinRequest: { id: updated.id, status: updated.status } });
      return;
    }
  }

  const password_hash = await bcrypt.hash(password, 12);

  const joinRequest = await prisma.join_request.create({
    data: {
      tenant_id: tenant.id,
      name: name.trim(),
      email: normalizedEmail,
      password_hash,
    },
  });

  res.status(201).json({ joinRequest: { id: joinRequest.id, status: joinRequest.status } });
});

/**
 * GET /api/join-requests
 * Authenticated — OWNER only. Lists requests for current tenant.
 */
router.get("/", authenticate, requireRole("OWNER"), async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.user!.tenantId;
  const status = req.query.status as string | undefined;

  const where: Record<string, unknown> = { tenant_id: tenantId };
  if (status) {
    where.status = status.toUpperCase();
  }

  const requests = await prisma.join_request.findMany({
    where: where as any,
    orderBy: { created_at: "desc" },
  });

  res.json({ data: requests });
});

/**
 * PATCH /api/join-requests/:id/approve
 * Authenticated — OWNER/ADMIN. Approves request and creates user.
 * Body: { role: "ADMIN" | "MANAGER" | "EMPLOYEE" }
 */
router.patch("/:id/approve", authenticate, requireRole("OWNER"), async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { role } = req.body as { role?: string };
  const tenantId = req.user!.tenantId;

  if (!role || !["ADMIN", "MANAGER", "EMPLOYEE"].includes(role)) {
    res.status(400).json({ error: "role must be ADMIN, MANAGER, or EMPLOYEE" });
    return;
  }

  const joinRequest = await prisma.join_request.findFirst({
    where: { id, tenant_id: tenantId },
  });

  if (!joinRequest) {
    res.status(404).json({ error: "Join request not found" });
    return;
  }

  if (joinRequest.status !== "PENDING") {
    res.status(400).json({ error: `Request already ${joinRequest.status.toLowerCase()}` });
    return;
  }

  // Transaction: update request + create user
  await prisma.$transaction(async (tx) => {
    await tx.join_request.update({
      where: { id },
      data: {
        status: "APPROVED",
        assigned_role: role as any,
        responded_by: req.user!.id,
        updated_at: new Date(),
      },
    });

    await tx.user.create({
      data: {
        tenantId,
        name: joinRequest.name,
        email: joinRequest.email,
        password_hash: joinRequest.password_hash,
        role: role as any,
      },
    });

    // Create notification for the approver's record
    await tx.notifications.create({
      data: {
        tenant_id: tenantId,
        user_id: req.user!.id,
        title: "Member Approved",
        message: `${joinRequest.name} has been approved as ${role}.`,
      },
    });
  });

  res.json({ message: "Request approved and user created" });
});

/**
 * PATCH /api/join-requests/:id/reject
 * Authenticated — OWNER/ADMIN.
 */
router.patch("/:id/reject", authenticate, requireRole("OWNER"), async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const tenantId = req.user!.tenantId;

  const joinRequest = await prisma.join_request.findFirst({
    where: { id, tenant_id: tenantId },
  });

  if (!joinRequest) {
    res.status(404).json({ error: "Join request not found" });
    return;
  }

  if (joinRequest.status !== "PENDING") {
    res.status(400).json({ error: `Request already ${joinRequest.status.toLowerCase()}` });
    return;
  }

  await prisma.join_request.update({
    where: { id },
    data: {
      status: "REJECTED",
      responded_by: req.user!.id,
      updated_at: new Date(),
    },
  });

  res.json({ message: "Request rejected" });
});

export default router;
