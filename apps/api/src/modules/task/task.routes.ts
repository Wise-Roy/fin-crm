import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/authorization.js';
import { PERMISSIONS } from '../../authorization/permissions.js';
import { taskService } from './task.service.js';
import { ServiceError } from '../tenant/tenant.service.js';

const router = Router();

function handleError(res: Response, err: unknown): void {
  if (err instanceof ServiceError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error("Task error:", err);
  res.status(500).json({ error: "Internal server error" });
}

/**
 * GET /api/tasks/my
 * Tasks assigned to the authenticated employee.
 * Must be before /:id.
 */
router.get("/my", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await taskService.myTasks(req.user!.id, req.tenant!.id, {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      sort: req.query.sort as string | undefined,
      order: req.query.order as "asc" | "desc" | undefined,
      status: req.query.status as string | undefined,
    });
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /api/tasks
 * Paginated, searchable, filterable task list.
 */
router.get(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.TASK_READ),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await taskService.list(req.tenant!.id, {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sort: req.query.sort as string | undefined,
        order: req.query.order as "asc" | "desc" | undefined,
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        priority: req.query.priority as string | undefined,
        category: req.query.category as string | undefined,
        assignedTo: req.query.assignedTo as string | undefined,
        clientId: req.query.clientId as string | undefined,
        createdBy: req.query.createdBy as string | undefined,
        dueFrom: req.query.dueFrom as string | undefined,
        dueTo: req.query.dueTo as string | undefined,
        createdFrom: req.query.createdFrom as string | undefined,
        createdTo: req.query.createdTo as string | undefined,
      });
      res.json(result);
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * GET /api/tasks/:id
 * Task details.
 */
router.get(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.TASK_READ),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const task = await taskService.getById(req.params.id as string, req.tenant!.id);
      res.json({ task });
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * POST /api/tasks
 * Create task.
 */
router.post(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.TASK_CREATE),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const task = await taskService.create(req.tenant!.id, req.body, req.user!.id);
      res.status(201).json({ task });
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * PUT /api/tasks/:id
 * Update task.
 */
router.put(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.TASK_UPDATE),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const task = await taskService.update(req.params.id as string, req.tenant!.id, req.body);
      res.json({ task });
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * PATCH /api/tasks/:id/status
 * Update task status.
 */
router.patch(
  "/:id/status",
  authenticate,
  requirePermission(PERMISSIONS.TASK_UPDATE),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.body as { status: string };
      if (!status) {
        res.status(400).json({ error: "status is required" });
        return;
      }
      const task = await taskService.updateStatus(req.params.id as string, req.tenant!.id, status);
      res.json({ task });
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * PATCH /api/tasks/:id/assign
 * Assign or reassign employee.
 */
router.patch(
  "/:id/assign",
  authenticate,
  requirePermission(PERMISSIONS.TASK_ASSIGN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { assignedTo } = req.body as { assignedTo: string };
      if (!assignedTo) {
        res.status(400).json({ error: "assignedTo is required" });
        return;
      }
      const task = await taskService.assign(req.params.id as string, req.tenant!.id, assignedTo, req.user!.id);
      res.json({ task });
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * DELETE /api/tasks/:id
 * Soft archive (cancel) task.
 */
router.delete(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.TASK_DELETE),
  async (req: Request, res: Response): Promise<void> => {
    try {
      await taskService.softDelete(req.params.id as string, req.tenant!.id);
      res.json({ message: "Task cancelled" });
    } catch (err) {
      handleError(res, err);
    }
  },
);

export default router;
