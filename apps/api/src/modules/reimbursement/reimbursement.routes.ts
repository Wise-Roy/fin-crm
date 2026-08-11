import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "@repo/db";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/authorization.js";
import { notifyRole } from "../notification/notify.js";

const router = Router();

/** GET /api/reimbursements — list reimbursements.
 *  OWNER/ADMIN see all, others see only their own task reimbursements */
router.get("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;
  const role = req.user!.role;

  const where: Record<string, unknown> = { tenant_id: req.tenant!.id };

  // Employees see only reimbursements for tasks assigned to them
  if (role !== "OWNER" && role !== "ADMIN" && role !== "MANAGER") {
    where.task = { assigned_to_employee_id: req.user!.id };
  }

  if (req.query.status) where.status = req.query.status;

  const [data, total] = await Promise.all([
    prisma.task_reimbursement.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      include: {
        task: { select: { id: true, title: true } },
      },
    }),
    prisma.task_reimbursement.count({ where: where as any }),
  ]);

  res.json({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

/** POST /api/reimbursements — submit reimbursement */
router.post("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const { task_id, amount, description } = req.body as {
    task_id?: string;
    amount?: number;
    description?: string;
  };

  if (!task_id || amount == null) {
    res.status(400).json({ error: "task_id and amount are required" });
    return;
  }
  if (typeof amount !== "number" || amount <= 0) {
    res.status(400).json({ error: "amount must be a positive number" });
    return;
  }

  // Verify task belongs to tenant
  const task = await prisma.task.findFirst({
    where: { id: task_id, tenant_id: req.tenant!.id },
  });
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }

  const reimb = await prisma.task_reimbursement.create({
    data: {
      tenant_id: req.tenant!.id,
      task_id,
      amount,
      description: description || null,
      status: "PENDING",
    },
    include: {
      task: { select: { id: true, title: true } },
    },
  });
  // Notify owner about new reimbursement
  notifyRole({
    tenantId: req.tenant!.id,
    roles: ["OWNER"],
    title: "Reimbursement Submitted",
    message: `Reimbursement of ₹${amount} submitted by ${req.user!.name} for "${task.title}"`,
    taskId: task_id,
    excludeUserId: req.user!.id,
  });

  res.status(201).json({ reimbursement: reimb });
});

/** PATCH /api/reimbursements/:id/approve — OWNER/ADMIN approve */
router.patch(
  "/:id/approve",
  authenticate,
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response): Promise<void> => {
    const reimb = await prisma.task_reimbursement.findFirst({
      where: { id: req.params.id as string, tenant_id: req.tenant!.id },
    });
    if (!reimb) { res.status(404).json({ error: "Reimbursement not found" }); return; }
    if (reimb.status !== "PENDING") {
      res.status(400).json({ error: "Only pending reimbursements can be approved" });
      return;
    }

    const updated = await prisma.task_reimbursement.update({
      where: { id: req.params.id as string },
      data: { status: "APPROVED", updated_at: new Date() },
      include: { task: { select: { id: true, title: true } } },
    });
    res.json({ reimbursement: updated });
  },
);

/** PATCH /api/reimbursements/:id/reject — OWNER/ADMIN reject */
router.patch(
  "/:id/reject",
  authenticate,
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response): Promise<void> => {
    const reimb = await prisma.task_reimbursement.findFirst({
      where: { id: req.params.id as string, tenant_id: req.tenant!.id },
    });
    if (!reimb) { res.status(404).json({ error: "Reimbursement not found" }); return; }
    if (reimb.status !== "PENDING") {
      res.status(400).json({ error: "Only pending reimbursements can be rejected" });
      return;
    }

    const updated = await prisma.task_reimbursement.update({
      where: { id: req.params.id as string },
      data: { status: "REJECTED", updated_at: new Date() },
      include: { task: { select: { id: true, title: true } } },
    });
    res.json({ reimbursement: updated });
  },
);

export default router;
