import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "@repo/db";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

/**
 * GET /api/config
 * Returns the theme config for the current tenant.
 */
router.get("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.user!.tenantId;

  const config = await prisma.tenant_config.findUnique({
    where: { tenant_id_config_key: { tenant_id: tenantId, config_key: "theme" } },
  });

  res.json({ config: config?.config_value ?? null });
});

/**
 * PUT /api/config
 * Updates the theme config. OWNER only.
 */
router.put("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  if (user.role !== "OWNER") {
    res.status(403).json({ error: "Only the owner can update configuration" });
    return;
  }

  const { theme } = req.body;

  if (!theme || typeof theme !== "object") {
    res.status(400).json({ error: "Invalid theme configuration" });
    return;
  }

  const config = await prisma.tenant_config.upsert({
    where: { tenant_id_config_key: { tenant_id: user.tenantId, config_key: "theme" } },
    create: {
      tenant_id: user.tenantId,
      config_key: "theme",
      config_value: theme,
    },
    update: {
      config_value: theme,
      updated_at: new Date(),
    },
  });

  res.json({ config: config.config_value });
});

export default router;
