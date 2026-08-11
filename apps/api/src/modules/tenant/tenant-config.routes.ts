import { Router } from "express";
import type { Request, Response } from "express";
import { prisma, supabase } from "@repo/db";
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

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * POST /api/config/logo
 * Upload a logo to Supabase storage. OWNER only.
 * Body: { file: string (base64 data URL), mimeType: string }
 */
router.post("/logo", authenticate, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  if (user.role !== "OWNER") {
    res.status(403).json({ error: "Only the owner can upload a logo" });
    return;
  }

  const { file, mimeType } = req.body;

  if (!file || !mimeType) {
    res.status(400).json({ error: "file (base64) and mimeType are required" });
    return;
  }

  if (!ALLOWED_MIME.includes(mimeType)) {
    res.status(400).json({ error: "Allowed formats: PNG, JPG, SVG, WebP" });
    return;
  }

  // Strip data URL prefix if present
  const base64Data = file.includes(",") ? file.split(",")[1] : file;
  const buffer = Buffer.from(base64Data, "base64");

  if (buffer.length > MAX_SIZE) {
    res.status(400).json({ error: "File too large. Max 2MB." });
    return;
  }

  const ext = mimeType.split("/")[1]?.replace("svg+xml", "svg") || "png";
  const filePath = `${user.tenantId}/logo.${ext}`;

  // Delete old logos for this tenant
  const { data: existing } = await supabase.storage.from("logos").list(user.tenantId);
  if (existing && existing.length > 0) {
    await supabase.storage.from("logos").remove(existing.map((f) => `${user.tenantId}/${f.name}`));
  }

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    res.status(500).json({ error: `Upload failed: ${uploadError.message}` });
    return;
  }

  const { data: urlData } = supabase.storage.from("logos").getPublicUrl(filePath);
  const logoUrl = urlData.publicUrl;

  // Update theme config with logoUrl
  const configRow = await prisma.tenant_config.findUnique({
    where: { tenant_id_config_key: { tenant_id: user.tenantId, config_key: "theme" } },
  });

  const currentTheme = (configRow?.config_value as Record<string, unknown>) ?? {};
  const updatedTheme = { ...currentTheme, logoUrl };

  await prisma.tenant_config.upsert({
    where: { tenant_id_config_key: { tenant_id: user.tenantId, config_key: "theme" } },
    create: { tenant_id: user.tenantId, config_key: "theme", config_value: updatedTheme },
    update: { config_value: updatedTheme, updated_at: new Date() },
  });

  res.json({ logoUrl });
});

/**
 * DELETE /api/config/logo
 * Remove the logo. OWNER only.
 */
router.delete("/logo", authenticate, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  if (user.role !== "OWNER") {
    res.status(403).json({ error: "Only the owner can remove the logo" });
    return;
  }

  // Delete all files in tenant's logo folder
  const { data: existing } = await supabase.storage.from("logos").list(user.tenantId);
  if (existing && existing.length > 0) {
    await supabase.storage.from("logos").remove(existing.map((f) => `${user.tenantId}/${f.name}`));
  }

  // Remove logoUrl from theme config
  const configRow = await prisma.tenant_config.findUnique({
    where: { tenant_id_config_key: { tenant_id: user.tenantId, config_key: "theme" } },
  });

  if (configRow) {
    const currentTheme = (configRow.config_value as Record<string, unknown>) ?? {};
    delete currentTheme.logoUrl;
    await prisma.tenant_config.update({
      where: { tenant_id_config_key: { tenant_id: user.tenantId, config_key: "theme" } },
      data: { config_value: currentTheme as any, updated_at: new Date() },
    });
  }

  res.json({ success: true });
});

export default router;
