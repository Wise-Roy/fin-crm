import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "@repo/db";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

/**
 * GET /api/categories
 * Lists categories for current tenant. Includes subcategories.
 */
router.get("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.tenant!.id;

  const data = await prisma.categories.findMany({
    where: { tenant_id: tenantId },
    include: { sub_categories: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });

  res.json({ data });
});

/**
 * POST /api/categories
 * Create a new category for tenant.
 * Body: { name }
 */
router.post("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.tenant!.id;
  const { name } = req.body as { name?: string };

  if (!name || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const trimmed = name.trim();

  // Check duplicate
  const existing = await prisma.categories.findFirst({
    where: { tenant_id: tenantId, name: { equals: trimmed, mode: "insensitive" } },
  });

  if (existing) {
    // Return existing instead of error — combobox "create" is idempotent
    res.json({ category: existing });
    return;
  }

  const category = await prisma.categories.create({
    data: { tenant_id: tenantId, name: trimmed },
    include: { sub_categories: true },
  });

  res.status(201).json({ category });
});

/**
 * POST /api/categories/:categoryId/subcategories
 * Create a subcategory under a category.
 * Body: { name }
 */
router.post("/:categoryId/subcategories", authenticate, async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.tenant!.id;
  const categoryId = req.params.categoryId as string;
  const { name } = req.body as { name?: string };

  if (!name || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  // Verify category belongs to tenant
  const category = await prisma.categories.findFirst({
    where: { id: categoryId, tenant_id: tenantId },
  });

  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  const trimmed = name.trim();

  // Check duplicate
  const existing = await prisma.sub_categories.findFirst({
    where: { category_id: categoryId, name: { equals: trimmed, mode: "insensitive" } },
  });

  if (existing) {
    res.json({ subcategory: existing });
    return;
  }

  const subcategory = await prisma.sub_categories.create({
    data: {
      tenant_id: tenantId,
      category_id: categoryId,
      name: trimmed,
    },
  });

  res.status(201).json({ subcategory });
});

export default router;
