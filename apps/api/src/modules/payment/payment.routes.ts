import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "@repo/db";
import { authenticate } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/authorization.js";
import { requireRole } from "../../middleware/authorization.js";
import { PERMISSIONS } from "../../authorization/permissions.js";

const router = Router();

/** GET /api/payments — list payments for tenant (task_read permission) */
router.get(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.TASK_READ),
  async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenant_id: req.tenant!.id };
    if (req.query.taskId) where.task_id = req.query.taskId;
    if (req.query.status) where.payment_status = req.query.status;

    const [data, total] = await Promise.all([
      prisma.task_payment.findMany({
        where: where as any,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              client_id: true,
              client: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.task_payment.count({ where: where as any }),
    ]);

    res.json({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  },
);

/** GET /api/payments/by-task/:taskId — payments for a specific task */
router.get(
  "/by-task/:taskId",
  authenticate,
  requirePermission(PERMISSIONS.TASK_READ),
  async (req: Request, res: Response): Promise<void> => {
    const data = await prisma.task_payment.findMany({
      where: { task_id: req.params.taskId as string, tenant_id: req.tenant!.id },
      orderBy: { created_at: "desc" },
    });
    res.json({ data });
  },
);

/** POST /api/payments — create payment (OWNER/ADMIN only) */
router.post(
  "/",
  authenticate,
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response): Promise<void> => {
    const { task_id, payment_type, amount } = req.body as {
      task_id?: string;
      payment_type?: string;
      amount?: number;
    };

    if (!task_id || !payment_type || amount == null) {
      res.status(400).json({ error: "task_id, payment_type, and amount are required" });
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

    const payment = await prisma.task_payment.create({
      data: {
        tenant_id: req.tenant!.id,
        task_id,
        payment_type,
        amount,
        payment_status: "PENDING",
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            client_id: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
    });
    res.status(201).json({ payment });
  },
);

/** PATCH /api/payments/:id/mark-paid — mark payment as SUCCESS (OWNER only, task must be COMPLETED) */
router.patch(
  "/:id/mark-paid",
  authenticate,
  requireRole("OWNER"),
  async (req: Request, res: Response): Promise<void> => {
    const payment = await prisma.task_payment.findFirst({
      where: { id: req.params.id as string, tenant_id: req.tenant!.id },
      include: { task: { select: { status: true } } },
    });
    if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }

    // Task must be COMPLETED before payment can be marked done
    if (payment.task.status !== "COMPLETED") {
      res.status(400).json({ error: "Task must be completed before marking payment as done" });
      return;
    }

    const updated = await prisma.task_payment.update({
      where: { id: req.params.id as string },
      data: {
        payment_status: "SUCCESS",
        paid_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            client_id: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
    });
    res.json({ payment: updated });
  },
);

/** DELETE /api/payments/:id — delete pending payment (OWNER only) */
router.delete(
  "/:id",
  authenticate,
  requireRole("OWNER"),
  async (req: Request, res: Response): Promise<void> => {
    const payment = await prisma.task_payment.findFirst({
      where: { id: req.params.id as string, tenant_id: req.tenant!.id },
    });
    if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }
    if (payment.payment_status !== "PENDING") {
      res.status(400).json({ error: "Only pending payments can be deleted" });
      return;
    }

    await prisma.task_payment.delete({ where: { id: req.params.id as string } });
    res.json({ message: "Payment deleted" });
  },
);

export default router;
