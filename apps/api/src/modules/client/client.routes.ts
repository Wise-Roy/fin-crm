import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "@repo/db";
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/authorization.js';
import { PERMISSIONS } from '../../authorization/permissions.js';

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
    const { name, email, phone } = req.body as { name?: string; email?: string; phone?: string };
    if (!name) { res.status(400).json({ error: "name is required" }); return; }

    const client = await prisma.client.create({
      data: {
        tenant_id: req.tenant!.id,
        name,
        email: email || null,
        phone: phone || null,
      },
      include: { client_group: true },
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

    const { name, email, phone, is_active } = req.body as { name?: string; email?: string; phone?: string; is_active?: boolean };
    const client = await prisma.client.update({
      where: { id: req.params.id as string },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(is_active !== undefined && { is_active }),
        updated_at: new Date(),
      },
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

export default router;
