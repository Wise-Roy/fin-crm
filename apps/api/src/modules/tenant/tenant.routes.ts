import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/authorization.js';
import { PERMISSIONS } from '../../authorization/permissions.js';
import { tenantService, ServiceError } from './tenant.service.js';

const router = Router();

function handleError(res: Response, err: unknown): void {
  if (err instanceof ServiceError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error("Tenant error:", err);
  res.status(500).json({ error: "Internal server error" });
}

/**
 * GET /api/tenant
 * Returns current tenant with settings. Any authenticated user can view.
 */
router.get("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenant = await tenantService.getTenant(req.tenant!.id);
    res.json({ tenant });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * PUT /api/tenant
 * Update tenant name/slug. Requires tenant.manage.
 */
router.put(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.TENANT_MANAGE),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, slug } = req.body as { name?: string; slug?: string };
      const tenant = await tenantService.updateTenant(req.tenant!.id, { name, slug });
      res.json({ tenant });
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * PATCH /api/tenant/status
 * Suspend or reactivate tenant. Requires tenant.manage.
 */
router.patch(
  "/status",
  authenticate,
  requirePermission(PERMISSIONS.TENANT_MANAGE),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.body as { status: string };
      if (!status) {
        res.status(400).json({ error: "status is required" });
        return;
      }
      const tenant = await tenantService.updateStatus(req.tenant!.id, status);
      res.json({ tenant });
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * PATCH /api/tenant/branding
 * Update branding (logo, color, timezone, currency, locale). Requires tenant.manage.
 */
router.patch(
  "/branding",
  authenticate,
  requirePermission(PERMISSIONS.TENANT_MANAGE),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { logoUrl, primaryColor, timezone, currency, locale } = req.body as {
        logoUrl?: string | null;
        primaryColor?: string | null;
        timezone?: string;
        currency?: string;
        locale?: string;
      };
      const tenant = await tenantService.updateBranding(req.tenant!.id, {
        logoUrl,
        primaryColor,
        timezone,
        currency,
        locale,
      });
      res.json({ tenant });
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * PATCH /api/tenant/settings
 * Update tenant settings. Requires tenant.manage.
 */
router.patch(
  "/settings",
  authenticate,
  requirePermission(PERMISSIONS.TENANT_MANAGE),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const settings = await tenantService.updateSettings(req.tenant!.id, req.body);
      res.json({ settings });
    } catch (err) {
      handleError(res, err);
    }
  },
);

/**
 * GET /api/tenant/limits
 * Returns subscription limits. Any authenticated user can view.
 */
router.get("/limits", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const limits = await tenantService.getLimits(req.tenant!.id);
    res.json({ limits });
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
