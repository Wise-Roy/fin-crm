import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "@repo/db";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

/** GET /api/notifications — list notifications for current user */
router.get("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

  const data = await prisma.notifications.findMany({
    where: { user_id: req.user!.id, tenant_id: req.tenant!.id },
    orderBy: { created_at: "desc" },
    take: limit,
  });

  res.json({ data });
});

/** PATCH /api/notifications/mark-all-read */
router.patch("/mark-all-read", authenticate, async (req: Request, res: Response): Promise<void> => {
  await prisma.notifications.updateMany({
    where: { user_id: req.user!.id, tenant_id: req.tenant!.id, is_read: false },
    data: { is_read: true },
  });
  res.json({ success: true });
});

/** PATCH /api/notifications/:id/read */
router.patch("/:id/read", authenticate, async (req: Request, res: Response): Promise<void> => {
  const notif = await prisma.notifications.findFirst({
    where: { id: req.params.id as string, user_id: req.user!.id },
  });
  if (!notif) { res.status(404).json({ error: "Notification not found" }); return; }

  await prisma.notifications.update({
    where: { id: req.params.id as string },
    data: { is_read: true },
  });
  res.json({ success: true });
});

export default router;
