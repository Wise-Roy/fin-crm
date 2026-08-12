import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "@repo/db";
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/authorization.js';
import { requireRole } from '../../middleware/authorization.js';
import { PERMISSIONS } from '../../authorization/permissions.js';
import { notifyRole } from '../notification/notify.js';

const router = Router();

/** GET /api/clients — list clients for tenant */
router.get(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.CLIENT_READ),
  async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search as string | undefined;

    const where: Record<string, unknown> = { tenant_id: req.tenant!.id };
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    // Date range filtering on created_at
    if (req.query.startDate || req.query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (req.query.startDate) {
        const sd = new Date(req.query.startDate as string);
        if (isNaN(sd.getTime())) { res.status(400).json({ error: "Invalid startDate" }); return; }
        dateFilter.gte = sd;
      }
      if (req.query.endDate) {
        const ed = new Date(req.query.endDate as string);
        if (isNaN(ed.getTime())) { res.status(400).json({ error: "Invalid endDate" }); return; }
        ed.setDate(ed.getDate() + 1);
        dateFilter.lt = ed;
      }
      where.created_at = dateFilter;
    }

    const [data, total] = await Promise.all([
      prisma.client.findMany({
        where: where as any,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: { client_group: { where: { is_active: true }, orderBy: { group_name: "asc" } } },
      }),
      prisma.client.count({ where: where as any }),
    ]);

    res.json({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  },
);

/** GET /api/clients/:id */
router.get(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.CLIENT_READ),
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const client = await prisma.client.findFirst({
      where: { id, tenant_id: req.tenant!.id },
      include: { client_group: { where: { is_active: true }, orderBy: { group_name: "asc" } } },
    });
    if (!client) { res.status(404).json({ error: "Client not found" }); return; }
    res.json({ client });
  },
);

/** POST /api/clients — create client */
router.post(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.CLIENT_CREATE),
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, phone } = req.body as Record<string, string | undefined>;
    if (!name) { res.status(400).json({ error: "name is required" }); return; }

    const kycData: Record<string, unknown> = {};
    const kycKeys = ["business_pan", "address_line1", "address_line2", "city", "state", "country", "pincode", "llpin", "din", "cin", "gst_number", "gst_state_code", "gst_dest_address"] as const;
    for (const k of kycKeys) {
      const v = (req.body as Record<string, string | undefined>)[k];
      if (v) kycData[k] = v;
    }
    const client = await prisma.client.create({
      data: {
        tenant_id: req.tenant!.id,
        name,
        email: email || null,
        phone: phone || null,
        ...kycData,
      } as any,
      include: { client_group: true },
    });

    // Notify owner about new client
    notifyRole({
      tenantId: req.tenant!.id,
      roles: ["OWNER"],
      title: "Client Added",
      message: `New client "${client.name}" added by ${req.user!.name}`,
      excludeUserId: req.user!.id,
    });

    res.status(201).json({ client });
  },
);

/** POST /api/clients/quick — adhoc quick-create client (minimal, name only) */
router.post(
  "/quick",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { name } = req.body as { name?: string };
    if (!name || !name.trim()) { res.status(400).json({ error: "name is required" }); return; }

    const tenantId = req.tenant!.id;
    const trimmed = name.trim();

    // Return existing if found (idempotent)
    const existing = await prisma.client.findFirst({
      where: { tenant_id: tenantId, name: { equals: trimmed, mode: "insensitive" } },
      include: { client_group: { where: { is_active: true }, orderBy: { group_name: "asc" } } },
    });

    if (existing) {
      res.json({ client: existing });
      return;
    }

    const client = await prisma.client.create({
      data: { tenant_id: tenantId, name: trimmed },
      include: { client_group: true },
    });
    res.status(201).json({ client });
  },
);

/** POST /api/clients/:clientId/groups — create client group */
router.post(
  "/:clientId/groups",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const clientId = req.params.clientId as string;
    const { group_name, email, phone } = req.body as { group_name?: string; email?: string; phone?: string };
    if (!group_name || !group_name.trim()) { res.status(400).json({ error: "group_name is required" }); return; }

    const tenantId = req.tenant!.id;
    const trimmed = group_name.trim();

    // Verify client belongs to tenant
    const client = await prisma.client.findFirst({ where: { id: clientId, tenant_id: tenantId } });
    if (!client) { res.status(404).json({ error: "Client not found" }); return; }

    // Idempotent
    const existing = await prisma.client_group.findFirst({
      where: { client_id: clientId, group_name: { equals: trimmed, mode: "insensitive" } },
    });
    if (existing) { res.json({ group: existing }); return; }

    const group = await prisma.client_group.create({
      data: {
        tenant_id: tenantId,
        client_id: clientId,
        group_name: trimmed,
        email: email || null,
        phone: phone || null,
      },
    });
    res.status(201).json({ group });
  },
);

/** PUT /api/clients/:id — update client */
router.put(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.CLIENT_UPDATE),
  async (req: Request, res: Response): Promise<void> => {
    const existing = await prisma.client.findFirst({ where: { id: req.params.id as string, tenant_id: req.tenant!.id } });
    if (!existing) { res.status(404).json({ error: "Client not found" }); return; }

    const body = req.body as Record<string, string | boolean | undefined>;
    const kycKeys = ["business_pan", "address_line1", "address_line2", "city", "state", "country", "pincode", "llpin", "din", "cin", "gst_number", "gst_state_code", "gst_dest_address"] as const;
    const data: Record<string, unknown> = { updated_at: new Date() };
    if (body.name !== undefined) data.name = body.name;
    if (body.email !== undefined) data.email = body.email;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.is_active !== undefined) data.is_active = body.is_active;
    for (const k of kycKeys) {
      if (body[k] !== undefined) data[k] = body[k] || null;
    }
    const client = await prisma.client.update({
      where: { id: req.params.id as string },
      data: data as any,
    });
    res.json({ client });
  },
);

/** DELETE /api/clients/:id — deactivate */
router.delete(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.CLIENT_DELETE),
  async (req: Request, res: Response): Promise<void> => {
    const existing = await prisma.client.findFirst({ where: { id: req.params.id as string, tenant_id: req.tenant!.id } });
    if (!existing) { res.status(404).json({ error: "Client not found" }); return; }

    await prisma.client.update({ where: { id: req.params.id as string }, data: { is_active: false, updated_at: new Date() } });
    res.json({ message: "Client deactivated" });
  },
);

/** GET /api/clients/:id/revenue — client revenue from task payments (OWNER only) */
router.get(
  "/:id/revenue",
  authenticate,
  requireRole("OWNER"),
  async (req: Request, res: Response): Promise<void> => {
    const clientId = req.params.id as string;
    const client = await prisma.client.findFirst({
      where: { id: clientId, tenant_id: req.tenant!.id },
    });
    if (!client) { res.status(404).json({ error: "Client not found" }); return; }

    // Sum all SUCCESS payments for tasks belonging to this client
    const result = await prisma.task_payment.aggregate({
      where: {
        tenant_id: req.tenant!.id,
        payment_status: "SUCCESS",
        task: { client_id: clientId },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Also get pending payments
    const pending = await prisma.task_payment.aggregate({
      where: {
        tenant_id: req.tenant!.id,
        payment_status: "PENDING",
        task: { client_id: clientId },
      },
      _sum: { amount: true },
      _count: true,
    });

    res.json({
      revenue: {
        total_paid: Number(result._sum.amount || 0),
        paid_count: result._count,
        total_pending: Number(pending._sum.amount || 0),
        pending_count: pending._count,
      },
    });
  },
);

/** PUT /api/clients/:clientId/groups/:groupId — update group */
router.put(
  "/:clientId/groups/:groupId",
  authenticate,
  requirePermission(PERMISSIONS.CLIENT_UPDATE),
  async (req: Request, res: Response): Promise<void> => {
    const group = await prisma.client_group.findFirst({
      where: { id: req.params.groupId as string, client_id: req.params.clientId as string, tenant_id: req.tenant!.id },
    });
    if (!group) { res.status(404).json({ error: "Group not found" }); return; }

    const { group_name, email, phone, is_active } = req.body as {
      group_name?: string;
      email?: string;
      phone?: string;
      is_active?: boolean;
    };

    const updated = await prisma.client_group.update({
      where: { id: req.params.groupId as string },
      data: {
        ...(group_name !== undefined && { group_name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(is_active !== undefined && { is_active }),
        updated_at: new Date(),
      },
    });
    res.json({ group: updated });
  },
);

/** DELETE /api/clients/:clientId/groups/:groupId — deactivate group */
router.delete(
  "/:clientId/groups/:groupId",
  authenticate,
  requirePermission(PERMISSIONS.CLIENT_DELETE),
  async (req: Request, res: Response): Promise<void> => {
    const group = await prisma.client_group.findFirst({
      where: { id: req.params.groupId as string, client_id: req.params.clientId as string, tenant_id: req.tenant!.id },
    });
    if (!group) { res.status(404).json({ error: "Group not found" }); return; }

    await prisma.client_group.update({
      where: { id: req.params.groupId as string },
      data: { is_active: false, updated_at: new Date() },
    });
    res.json({ message: "Group deactivated" });
  },
);

export default router;
