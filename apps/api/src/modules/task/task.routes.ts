import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "@repo/db";
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/authorization.js';
import { PERMISSIONS } from '../../authorization/permissions.js';

const router = Router();

const TASK_INCLUDES = {
  client: { select: { id: true, name: true } },
  users_task_assigned_to_employee_idTousers: { select: { id: true, name: true, email: true } },
  users_task_created_byTousers: { select: { id: true, name: true } },
  categories: { select: { id: true, name: true } },
  sub_categories: { select: { id: true, name: true } },
} as const;

/** GET /api/tasks/my — tasks assigned to me */
router.get("/my", authenticate, async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    tenant_id: req.tenant!.id,
    assigned_to_employee_id: req.user!.id,
  };
  if (req.query.status) where.status = req.query.status;

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
      // Use next day for exclusive upper bound
      ed.setDate(ed.getDate() + 1);
      dateFilter.lt = ed;
    }
    where.created_at = dateFilter;
  }

  const [data, total] = await Promise.all([
    prisma.task.findMany({ where: where as any, skip, take: limit, orderBy: { created_at: "desc" }, include: TASK_INCLUDES }),
    prisma.task.count({ where: where as any }),
  ]);

  res.json({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

/** GET /api/tasks — all tasks for tenant */
router.get(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.TASK_READ),
  async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenant_id: req.tenant!.id };
    if (req.query.status) where.status = req.query.status;
    if (req.query.priority) where.priority = req.query.priority;
    if (req.query.assignedTo) where.assigned_to_employee_id = req.query.assignedTo;
    if (req.query.clientId) where.client_id = req.query.clientId;
    if (req.query.search) {
      where.title = { contains: req.query.search as string, mode: "insensitive" };
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
        // Use next day for exclusive upper bound
        ed.setDate(ed.getDate() + 1);
        dateFilter.lt = ed;
      }
      where.created_at = dateFilter;
    }

    const [data, total] = await Promise.all([
      prisma.task.findMany({ where: where as any, skip, take: limit, orderBy: { created_at: "desc" }, include: TASK_INCLUDES }),
      prisma.task.count({ where: where as any }),
    ]);

    res.json({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  },
);

/** GET /api/tasks/:id */
router.get(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.TASK_READ),
  async (req: Request, res: Response): Promise<void> => {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id as string, tenant_id: req.tenant!.id },
      include: TASK_INCLUDES,
    });
    if (!task) { res.status(404).json({ error: "Task not found" }); return; }
    res.json({ task });
  },
);

/** GET /api/tasks/:id/history — task status change history */
router.get(
  "/:id/history",
  authenticate,
  requirePermission(PERMISSIONS.TASK_READ),
  async (req: Request, res: Response): Promise<void> => {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id as string, tenant_id: req.tenant!.id },
    });
    if (!task) { res.status(404).json({ error: "Task not found" }); return; }

    const history = await prisma.task_history.findMany({
      where: { task_id: req.params.id as string },
      orderBy: { created_at: "desc" },
      include: {
        users: { select: { id: true, name: true } },
      },
    });
    res.json({ data: history });
  },
);

/** POST /api/tasks — create task */
router.post(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.TASK_CREATE),
  async (req: Request, res: Response): Promise<void> => {
    const { title, description, client_id, assigned_to_employee_id, priority, due_date, category_id, subcategory_id, client_group_id } = req.body as {
      title?: string;
      description?: string;
      client_id?: string;
      assigned_to_employee_id?: string;
      priority?: string;
      due_date?: string;
      category_id?: string;
      subcategory_id?: string;
      client_group_id?: string;
    };

    if (!title) { res.status(400).json({ error: "title is required" }); return; }

    const task = await prisma.task.create({
      data: {
        tenant_id: req.tenant!.id,
        title,
        description: description || null,
        client_id: client_id || null,
        assigned_to_employee_id: assigned_to_employee_id || null,
        created_by: req.user!.id,
        priority: (priority as any) || "MEDIUM",
        status: "TODO",
        due_date: due_date ? new Date(due_date) : null,
        category_id: category_id || null,
        subcategory_id: subcategory_id || null,
        client_group_id: client_group_id || null,
      },
      include: TASK_INCLUDES,
    });
    res.status(201).json({ task });
  },
);

/** PATCH /api/tasks/:id/status — update task status */
router.patch(
  "/:id/status",
  authenticate,
  requirePermission(PERMISSIONS.TASK_UPDATE),
  async (req: Request, res: Response): Promise<void> => {
    const { status } = req.body as { status?: string };
    if (!status) { res.status(400).json({ error: "status is required" }); return; }

    const existing = await prisma.task.findFirst({ where: { id: req.params.id as string, tenant_id: req.tenant!.id } });
    if (!existing) { res.status(404).json({ error: "Task not found" }); return; }

    const data: Record<string, unknown> = { status, updated_at: new Date() };
    if (status === "COMPLETED") data.completed_at = new Date();

    const [task] = await Promise.all([
      prisma.task.update({
        where: { id: req.params.id as string },
        data: data as any,
        include: TASK_INCLUDES,
      }),
      // Log status change to task_history
      prisma.task_history.create({
        data: {
          tenant_id: req.tenant!.id,
          task_id: req.params.id as string,
          changed_by_user_id: req.user!.id,
          action: "status_change",
          old_value: { status: existing.status },
          new_value: { status },
        },
      }),
    ]);
    res.json({ task });
  },
);

/** PUT /api/tasks/:id — update task */
router.put(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.TASK_UPDATE),
  async (req: Request, res: Response): Promise<void> => {
    const existing = await prisma.task.findFirst({ where: { id: req.params.id as string, tenant_id: req.tenant!.id } });
    if (!existing) { res.status(404).json({ error: "Task not found" }); return; }

    const { title, description, priority, due_date, client_id, assigned_to_employee_id, category_id, subcategory_id } = req.body as Record<string, any>;

    const task = await prisma.task.update({
      where: { id: req.params.id as string },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(priority !== undefined && { priority }),
        ...(due_date !== undefined && { due_date: due_date ? new Date(due_date) : null }),
        ...(client_id !== undefined && { client_id }),
        ...(assigned_to_employee_id !== undefined && { assigned_to_employee_id }),
        ...(category_id !== undefined && { category_id }),
        ...(subcategory_id !== undefined && { subcategory_id }),
        updated_at: new Date(),
      },
      include: TASK_INCLUDES,
    });
    res.json({ task });
  },
);

/** PATCH /api/tasks/:id/assign — assign task */
router.patch(
  "/:id/assign",
  authenticate,
  requirePermission(PERMISSIONS.TASK_ASSIGN),
  async (req: Request, res: Response): Promise<void> => {
    const { assigned_to_employee_id } = req.body as { assigned_to_employee_id?: string };
    if (!assigned_to_employee_id) { res.status(400).json({ error: "assigned_to_employee_id is required" }); return; }

    const existing = await prisma.task.findFirst({ where: { id: req.params.id as string, tenant_id: req.tenant!.id } });
    if (!existing) { res.status(404).json({ error: "Task not found" }); return; }

    const task = await prisma.task.update({
      where: { id: req.params.id as string },
      data: { assigned_to_employee_id, updated_at: new Date() },
      include: TASK_INCLUDES,
    });
    res.json({ task });
  },
);

/** DELETE /api/tasks/:id — cancel task */
router.delete(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.TASK_DELETE),
  async (req: Request, res: Response): Promise<void> => {
    const existing = await prisma.task.findFirst({ where: { id: req.params.id as string, tenant_id: req.tenant!.id } });
    if (!existing) { res.status(404).json({ error: "Task not found" }); return; }

    await prisma.task.update({ where: { id: req.params.id as string }, data: { status: "CANCELLED", updated_at: new Date() } });
    res.json({ message: "Task cancelled" });
  },
);

export default router;
