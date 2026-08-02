import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/authorization.js';
import { PERMISSIONS } from '../../authorization/permissions.js';
import { employeeService } from './employee.service.js';
import { ServiceError } from '../tenant/tenant.service.js';

const router = Router();

function handleError(res: Response, err: unknown): void {
  if (err instanceof ServiceError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error("Employee error:", err);
  res.status(500).json({ error: "Internal server error" });
}

/**
 * GET /api/employees/me
 * Current employee profile. Any authenticated user.
 * Must be before /:id to avoid matching "me" as an id.
 */
router.get("/me", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const employee = await employeeService.getMyProfile(req.user!.id, req.tenant!.id);
    res.json({ employee });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * PATCH /api/employees/me
 * Update own profile (phone, profileImage only).
 */
router.patch("/me", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, profileImage } = req.body as { phone?: string | null; profileImage?: string | null };
    const employee = await employeeService.updateOwnProfile(req.user!.id, req.tenant!.id, {
      phone,
      profileImage,
    });
    res.json({ employee });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /api/employees
 * Paginated, searchable, filterable employee list.
 */
router.get(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_READ),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await employeeService.list(req.tenant!.id, {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sort: req.query.sort as string | undefined,
        order: req.query.order as "asc" | "desc" | undefined,
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        department: req.query.department as string | undefined,
        designation: req.query.designation as string | undefined,
        employmentType: req.query.employmentType as string | undefined,
        reportingManagerId: req.query.reportingManagerId as string | undefined,
        joinedFrom: req.query.joinedFrom as string | undefined,
        joinedTo: req.query.joinedTo as string | undefined,
      });
      res.json(result);
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * GET /api/employees/:id
 * Employee details.
 */
router.get(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_READ),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const employee = await employeeService.getById(req.params.id as string, req.tenant!.id);
      res.json({ employee });
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * POST /api/employees
 * Create employee.
 */
router.post(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_CREATE),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const employee = await employeeService.create(req.tenant!.id, req.body, req.user!.id);
      res.status(201).json({ employee });
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * PUT /api/employees/:id
 * Update employee.
 */
router.put(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_UPDATE),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const employee = await employeeService.update(req.params.id as string, req.tenant!.id, req.body);
      res.json({ employee });
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * PATCH /api/employees/:id/status
 * Update employee status.
 */
router.patch(
  "/:id/status",
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_UPDATE),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.body as { status: string };
      if (!status) {
        res.status(400).json({ error: "status is required" });
        return;
      }
      const employee = await employeeService.updateStatus(req.params.id as string, req.tenant!.id, status);
      res.json({ employee });
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * DELETE /api/employees/:id
 * Soft delete (set status to resigned).
 */
router.delete(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_DELETE),
  async (req: Request, res: Response): Promise<void> => {
    try {
      await employeeService.softDelete(req.params.id as string, req.tenant!.id);
      res.json({ message: "Employee removed" });
    } catch (err) {
      handleError(res, err);
    }
  },
);

export default router;
