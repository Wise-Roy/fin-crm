import { Router } from "express";
import type { Request, Response } from "express";
import { prisma as _prisma } from "@repo/db";
import { authenticate } from "../../middleware/auth.js";
import { notifyRole } from "../notification/notify.js";

// Cast needed until migration runs and Prisma adapter types refresh
const prisma = _prisma as any;

const router = Router();

const DSC_INCLUDES = {
  client: { select: { id: true, name: true } },
  client_group: { select: { id: true, group_name: true } },
  created_by_user: { select: { id: true, name: true } },
} as const;

/** GET /api/dsc — list all DSC entries for tenant */
router.get("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { tenant_id: req.tenant!.id };

  if (req.query.status === "ACTIVE") {
    where.valid_till_date = { gt: new Date() };
  } else if (req.query.status === "EXPIRED") {
    where.valid_till_date = { lte: new Date() };
  }

  const [data, total] = await Promise.all([
    prisma.dsc.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { valid_till_date: "asc" },
      include: DSC_INCLUDES,
    }),
    prisma.dsc.count({ where: where as any }),
  ]);

  res.json({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

/** GET /api/dsc/:id — get single DSC */
router.get("/:id", authenticate, async (req: Request, res: Response): Promise<void> => {
  const dsc = await prisma.dsc.findFirst({
    where: { id: req.params.id as string, tenant_id: req.tenant!.id },
    include: DSC_INCLUDES,
  });
  if (!dsc) { res.status(404).json({ error: "DSC not found" }); return; }
  res.json({ dsc });
});

/** POST /api/dsc — create DSC entry */
router.post("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const {
    pan_number, name, related_company, issue_date, valid_till_date,
    issuing_authority, client_id, client_group_id, password,
    position, mobile_number,
  } = req.body as Record<string, string | undefined>;

  if (!pan_number || !name || !related_company || !issue_date || !valid_till_date || !issuing_authority || !password) {
    res.status(400).json({ error: "pan_number, name, related_company, issue_date, valid_till_date, issuing_authority, and password are required" });
    return;
  }

  // Validate PAN format
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan_number)) {
    res.status(400).json({ error: "Invalid PAN number format" });
    return;
  }

  // Validate client belongs to tenant if provided
  if (client_id) {
    const client = await prisma.client.findFirst({
      where: { id: client_id, tenant_id: req.tenant!.id },
    });
    if (!client) { res.status(404).json({ error: "Client not found" }); return; }
  }

  const dsc = await prisma.dsc.create({
    data: {
      tenant_id: req.tenant!.id,
      pan_number,
      name,
      related_company,
      issue_date: new Date(issue_date),
      valid_till_date: new Date(valid_till_date),
      issuing_authority,
      client_id: client_id || null,
      client_group_id: client_group_id || null,
      password,
      position: position || null,
      mobile_number: mobile_number || null,
      created_by: req.user!.id,
    },
    include: DSC_INCLUDES,
  });

  // Notify owner about new DSC
  notifyRole({
    tenantId: req.tenant!.id,
    roles: ["OWNER"],
    title: "DSC Added",
    message: `New DSC "${dsc.name}" (${dsc.pan_number}) added by ${req.user!.name}`,
    excludeUserId: req.user!.id,
  });

  res.status(201).json({ dsc });
});

/** PUT /api/dsc/:id — update DSC entry */
router.put("/:id", authenticate, async (req: Request, res: Response): Promise<void> => {
  const existing = await prisma.dsc.findFirst({
    where: { id: req.params.id as string, tenant_id: req.tenant!.id },
  });
  if (!existing) { res.status(404).json({ error: "DSC not found" }); return; }

  const {
    pan_number, name, related_company, issue_date, valid_till_date,
    issuing_authority, client_id, client_group_id, password,
    position, mobile_number,
  } = req.body as Record<string, string | undefined>;

  const updateData: Record<string, unknown> = { updated_at: new Date() };

  if (pan_number !== undefined) {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan_number)) {
      res.status(400).json({ error: "Invalid PAN number format" });
      return;
    }
    updateData.pan_number = pan_number;
  }
  if (name !== undefined) updateData.name = name;
  if (related_company !== undefined) updateData.related_company = related_company;
  if (issue_date !== undefined) updateData.issue_date = new Date(issue_date);
  if (valid_till_date !== undefined) updateData.valid_till_date = new Date(valid_till_date);
  if (issuing_authority !== undefined) updateData.issuing_authority = issuing_authority;
  if (client_id !== undefined) updateData.client_id = client_id || null;
  if (client_group_id !== undefined) updateData.client_group_id = client_group_id || null;
  if (password !== undefined) updateData.password = password;
  if (position !== undefined) updateData.position = position || null;
  if (mobile_number !== undefined) updateData.mobile_number = mobile_number || null;

  const dsc = await prisma.dsc.update({
    where: { id: req.params.id as string },
    data: updateData,
    include: DSC_INCLUDES,
  });

  // Notify owner about DSC update
  notifyRole({
    tenantId: req.tenant!.id,
    roles: ["OWNER"],
    title: "DSC Updated",
    message: `DSC "${dsc.name}" (${dsc.pan_number}) updated by ${req.user!.name}`,
    excludeUserId: req.user!.id,
  });

  res.json({ dsc });
});

/** DELETE /api/dsc/:id — delete DSC entry */
router.delete("/:id", authenticate, async (req: Request, res: Response): Promise<void> => {
  const existing = await prisma.dsc.findFirst({
    where: { id: req.params.id as string, tenant_id: req.tenant!.id },
  });
  if (!existing) { res.status(404).json({ error: "DSC not found" }); return; }

  await prisma.dsc.delete({ where: { id: req.params.id as string } });
  res.json({ message: "DSC deleted" });
});

export default router;
