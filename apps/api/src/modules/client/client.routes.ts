import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/authorization.js';
import { PERMISSIONS } from '../../authorization/permissions.js';
import { clientService } from './client.service.js';
import { ServiceError } from '../tenant/tenant.service.js';

const router = Router();

function handleError(res: Response, err: unknown): void {
  if (err instanceof ServiceError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error("Client error:", err);
  res.status(500).json({ error: "Internal server error" });
}

/**
 * GET /api/clients
 * Paginated, searchable, filterable client list.
 */
router.get(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.CLIENT_READ),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await clientService.list(req.tenant!.id, {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sort: req.query.sort as string | undefined,
        order: req.query.order as "asc" | "desc" | undefined,
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        clientType: req.query.clientType as string | undefined,
        accountManagerId: req.query.accountManagerId as string | undefined,
        state: req.query.state as string | undefined,
        country: req.query.country as string | undefined,
        createdFrom: req.query.createdFrom as string | undefined,
        createdTo: req.query.createdTo as string | undefined,
        onboardedFrom: req.query.onboardedFrom as string | undefined,
        onboardedTo: req.query.onboardedTo as string | undefined,
      });
      res.json(result);
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * GET /api/clients/:id
 * Client details.
 */
router.get(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.CLIENT_READ),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const client = await clientService.getById(req.params.id as string, req.tenant!.id);
      res.json({ client });
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * POST /api/clients
 * Create client.
 */
router.post(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.CLIENT_CREATE),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const client = await clientService.create(req.tenant!.id, req.body, req.user!.id);
      res.status(201).json({ client });
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * PUT /api/clients/:id
 * Update client.
 */
router.put(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.CLIENT_UPDATE),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const client = await clientService.update(req.params.id as string, req.tenant!.id, req.body);
      res.json({ client });
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * PATCH /api/clients/:id/status
 * Update client status.
 */
router.patch(
  "/:id/status",
  authenticate,
  requirePermission(PERMISSIONS.CLIENT_UPDATE),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.body as { status: string };
      if (!status) {
        res.status(400).json({ error: "status is required" });
        return;
      }
      const client = await clientService.updateStatus(req.params.id as string, req.tenant!.id, status);
      res.json({ client });
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * PATCH /api/clients/:id/account-manager
 * Assign or change account manager.
 */
router.patch(
  "/:id/account-manager",
  authenticate,
  requirePermission(PERMISSIONS.CLIENT_UPDATE),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { accountManagerId } = req.body as { accountManagerId: string | null };
      const client = await clientService.assignAccountManager(
        req.params.id as string,
        req.tenant!.id,
        accountManagerId,
      );
      res.json({ client });
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * DELETE /api/clients/:id
 * Soft archive client.
 */
router.delete(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.CLIENT_DELETE),
  async (req: Request, res: Response): Promise<void> => {
    try {
      await clientService.softDelete(req.params.id as string, req.tenant!.id);
      res.json({ message: "Client archived" });
    } catch (err) {
      handleError(res, err);
    }
  },
);

export default router;
