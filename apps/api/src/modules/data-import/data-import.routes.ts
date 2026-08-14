import { Router } from "express";
import type { Request, Response } from "express";
import multer from "multer";
import ExcelJS from "exceljs";
import { prisma } from "@repo/db";
import { authenticate } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/authorization.js";
import { PERMISSIONS } from "../../authorization/permissions.js";
import {
  validateTaskSheet,
  validateClientSheet,
  TASK_COLUMNS,
  CLIENT_COLUMNS,
  type TaskRow,
  type ClientRow,
} from "./validators.js";

const router = Router();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith(".xlsx")) {
      cb(null, true);
    } else {
      cb(new Error("Only .xlsx files are allowed"));
    }
  },
});

// ─── GET /api/import/template/tasks — download task template ────────────────

router.get("/template/tasks", authenticate, async (_req: Request, res: Response): Promise<void> => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Tasks");

  ws.columns = TASK_COLUMNS.map((col) => ({ header: col, key: col, width: 20 }));

  // Add one example row
  ws.addRow({
    title: "Example Task",
    description: "Task description here",
    category: "Accounting",
    subcategory: "GST Filing",
    client_name: "Acme Corp",
    client_group_name: "Mumbai Branch",
    assigned_to_email: "employee@example.com",
    priority: "MEDIUM",
    status: "TODO",
    due_date: "2026-09-01",
  });

  // Style header
  ws.getRow(1).font = { bold: true };

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=task_import_template.xlsx");
  await wb.xlsx.write(res as any);
  res.end();
});

// ─── GET /api/import/template/clients — download client template ────────────

router.get("/template/clients", authenticate, async (_req: Request, res: Response): Promise<void> => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Clients");

  ws.columns = CLIENT_COLUMNS.map((col) => ({ header: col, key: col, width: 20 }));

  ws.addRow({
    name: "Acme Corp",
    email: "info@acme.com",
    phone: "9876543210",
    group_name: "Mumbai Branch",
    group_email: "mumbai@acme.com",
    group_phone: "9876543211",
    business_pan: "ABCDE1234F",
    address_line1: "123 Main Street",
    address_line2: "",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    pincode: "400001",
    llpin: "",
    din: "",
    cin: "",
    gst_number: "27ABCDE1234F1Z5",
    gst_state_code: "27",
    gst_dest_address: "",
  });

  ws.getRow(1).font = { bold: true };

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=client_import_template.xlsx");
  await wb.xlsx.write(res as any);
  res.end();
});

// ─── POST /api/import/tasks — bulk import tasks from Excel ──────────────────

router.post(
  "/tasks",
  authenticate,
  requirePermission(PERMISSIONS.TASK_CREATE),
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded. Send a .xlsx file in the 'file' field." });
      return;
    }

    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    // Parse workbook
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(new Uint8Array(req.file.buffer) as any);
    } catch {
      res.status(400).json({ error: "Failed to parse Excel file. Ensure it is a valid .xlsx file." });
      return;
    }

    const sheet = wb.worksheets[0];
    if (!sheet) {
      res.status(400).json({ error: "Workbook has no worksheets." });
      return;
    }

    // Validate
    const result = validateTaskSheet(sheet);
    if (!result.valid) {
      res.status(422).json({ error: "Validation failed", details: result.errors });
      return;
    }

    // Resolve references within tenant
    const [
      tenantUsers,
      tenantClients,
      tenantCategories,
    ] = await Promise.all([
      prisma.user.findMany({ where: { tenantId, is_active: true }, select: { id: true, email: true } }),
      prisma.client.findMany({
        where: { tenant_id: tenantId, is_active: true },
        select: { id: true, name: true, client_group: { select: { id: true, group_name: true } } },
      }),
      prisma.categories.findMany({
        where: { tenant_id: tenantId },
        select: { id: true, name: true, sub_categories: { select: { id: true, name: true } } },
      }),
    ]);

    const userByEmail = new Map(tenantUsers.map((u) => [u.email.toLowerCase(), u.id]));
    const clientByName = new Map(tenantClients.map((c) => [c.name.toLowerCase(), c]));
    const categoryByName = new Map(tenantCategories.map((c) => [c.name.toLowerCase(), c]));

    // Second-pass: resolve FKs and collect names to auto-create
    const resolveErrors: Array<{ row: number; column: string; message: string }> = [];
    const categoriesToCreate = new Set<string>();
    const subcatsToCreate = new Map<string, Set<string>>(); // category -> set of subcats
    const clientsToCreate = new Set<string>();
    const clientGroupsToCreate = new Map<string, Set<string>>(); // client -> set of groups

    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows[i];
      const excelRow = i + 2;

      // Assigned user must exist (won't auto-create users)
      if (row.assigned_to_email) {
        if (!userByEmail.has(row.assigned_to_email.toLowerCase())) {
          resolveErrors.push({ row: excelRow, column: "assigned_to_email", message: `No active user found with email "${row.assigned_to_email}" in your organization` });
        }
      }

      // Track categories/subcategories to auto-create
      if (row.category) {
        if (!categoryByName.has(row.category.toLowerCase())) {
          categoriesToCreate.add(row.category.trim());
        }
        if (row.subcategory) {
          const cat = categoryByName.get(row.category.toLowerCase());
          if (cat) {
            const hasSub = cat.sub_categories.some((s) => s.name.toLowerCase() === row.subcategory!.toLowerCase());
            if (!hasSub) {
              if (!subcatsToCreate.has(row.category.toLowerCase())) subcatsToCreate.set(row.category.toLowerCase(), new Set());
              subcatsToCreate.get(row.category.toLowerCase())!.add(row.subcategory.trim());
            }
          } else {
            // Category will be created, so subcat also needs creating
            if (!subcatsToCreate.has(row.category.toLowerCase())) subcatsToCreate.set(row.category.toLowerCase(), new Set());
            subcatsToCreate.get(row.category.toLowerCase())!.add(row.subcategory.trim());
          }
        }
      }

      // Track clients/groups to auto-create
      if (row.client_name) {
        if (!clientByName.has(row.client_name.toLowerCase())) {
          clientsToCreate.add(row.client_name.trim());
        }
        if (row.client_group_name) {
          const cl = clientByName.get(row.client_name.toLowerCase());
          if (cl) {
            const hasGroup = cl.client_group.some((g) => g.group_name.toLowerCase() === row.client_group_name!.toLowerCase());
            if (!hasGroup) {
              if (!clientGroupsToCreate.has(row.client_name.toLowerCase())) clientGroupsToCreate.set(row.client_name.toLowerCase(), new Set());
              clientGroupsToCreate.get(row.client_name.toLowerCase())!.add(row.client_group_name.trim());
            }
          } else {
            if (!clientGroupsToCreate.has(row.client_name.toLowerCase())) clientGroupsToCreate.set(row.client_name.toLowerCase(), new Set());
            clientGroupsToCreate.get(row.client_name.toLowerCase())!.add(row.client_group_name.trim());
          }
        }
      }
    }

    if (resolveErrors.length > 0) {
      res.status(422).json({ error: "Reference resolution failed", details: resolveErrors });
      return;
    }

    // Transactional insert
    try {
      const imported = await prisma.$transaction(async (tx) => {
        // 1. Create missing categories
        for (const catName of categoriesToCreate) {
          const created = await tx.categories.create({ data: { tenant_id: tenantId, name: catName } });
          categoryByName.set(catName.toLowerCase(), { id: created.id, name: created.name, sub_categories: [] });
        }

        // 2. Create missing subcategories
        for (const [catKey, subNames] of subcatsToCreate) {
          const cat = categoryByName.get(catKey)!;
          for (const subName of subNames) {
            const created = await tx.sub_categories.create({
              data: { tenant_id: tenantId, category_id: cat.id, name: subName },
            });
            cat.sub_categories.push({ id: created.id, name: created.name });
          }
        }

        // 3. Create missing clients
        for (const clientName of clientsToCreate) {
          const created = await tx.client.create({ data: { tenant_id: tenantId, name: clientName } });
          clientByName.set(clientName.toLowerCase(), { id: created.id, name: created.name, client_group: [] });
        }

        // 4. Create missing client groups
        for (const [clientKey, groupNames] of clientGroupsToCreate) {
          const cl = clientByName.get(clientKey)!;
          for (const groupName of groupNames) {
            const created = await tx.client_group.create({
              data: { tenant_id: tenantId, client_id: cl.id, group_name: groupName },
            });
            cl.client_group.push({ id: created.id, group_name: created.group_name });
          }
        }

        // 5. Insert tasks
        const tasks = [];
        for (const row of result.rows) {
          const categoryId = row.category ? categoryByName.get(row.category.toLowerCase())?.id ?? null : null;
          let subcategoryId: string | null = null;
          if (row.subcategory && categoryId) {
            const cat = categoryByName.get(row.category!.toLowerCase());
            subcategoryId = cat?.sub_categories.find((s) => s.name.toLowerCase() === row.subcategory!.toLowerCase())?.id ?? null;
          }

          const clientObj = row.client_name ? clientByName.get(row.client_name.toLowerCase()) : null;
          const clientId = clientObj?.id ?? null;
          let clientGroupId: string | null = null;
          if (row.client_group_name && clientObj) {
            clientGroupId = clientObj.client_group.find((g) => g.group_name.toLowerCase() === row.client_group_name!.toLowerCase())?.id ?? null;
          }

          const assignedTo = row.assigned_to_email ? userByEmail.get(row.assigned_to_email.toLowerCase()) ?? null : null;

          const task = await tx.task.create({
            data: {
              tenant_id: tenantId,
              title: row.title,
              description: row.description,
              category_id: categoryId,
              subcategory_id: subcategoryId,
              client_id: clientId,
              client_group_id: clientGroupId,
              assigned_to_employee_id: assignedTo,
              created_by: userId,
              priority: row.priority as any,
              status: row.status as any,
              due_date: row.due_date,
            },
          });
          tasks.push(task);
        }

        return tasks;
      });

      res.status(201).json({
        message: `Successfully imported ${imported.length} task(s)`,
        count: imported.length,
        created_categories: categoriesToCreate.size,
        created_subcategories: [...subcatsToCreate.values()].reduce((sum, s) => sum + s.size, 0),
        created_clients: clientsToCreate.size,
        created_client_groups: [...clientGroupsToCreate.values()].reduce((sum, s) => sum + s.size, 0),
      });
    } catch (err: any) {
      console.error("Task import transaction failed:", err);
      res.status(500).json({ error: "Import failed. No data was inserted.", detail: err.message });
    }
  },
);

// ─── POST /api/import/clients — bulk import clients from Excel ──────────────

router.post(
  "/clients",
  authenticate,
  requirePermission(PERMISSIONS.CLIENT_CREATE),
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded. Send a .xlsx file in the 'file' field." });
      return;
    }

    const tenantId = req.tenant!.id;

    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(new Uint8Array(req.file.buffer) as any);
    } catch {
      res.status(400).json({ error: "Failed to parse Excel file. Ensure it is a valid .xlsx file." });
      return;
    }

    const sheet = wb.worksheets[0];
    if (!sheet) {
      res.status(400).json({ error: "Workbook has no worksheets." });
      return;
    }

    const result = validateClientSheet(sheet);
    if (!result.valid) {
      res.status(422).json({ error: "Validation failed", details: result.errors });
      return;
    }

    // Check for duplicate client names within the upload
    const nameCount = new Map<string, number>();
    for (const row of result.rows) {
      const key = row.name.toLowerCase();
      nameCount.set(key, (nameCount.get(key) || 0) + 1);
    }

    // Check which clients already exist in tenant
    const existingClients = await prisma.client.findMany({
      where: { tenant_id: tenantId },
      select: { id: true, name: true, client_group: { select: { id: true, group_name: true } } },
    });
    const existingByName = new Map(existingClients.map((c) => [c.name.toLowerCase(), c]));

    try {
      const imported = await prisma.$transaction(async (tx) => {
        // Group rows by client name for efficient processing
        const clientMap = new Map<string, { row: ClientRow; groups: ClientRow[] }>();

        for (const row of result.rows) {
          const key = row.name.toLowerCase();
          if (!clientMap.has(key)) {
            clientMap.set(key, { row, groups: [] });
          }
          // If this row has a group_name, collect it
          if (row.group_name) {
            clientMap.get(key)!.groups.push(row);
          }
        }

        let clientsCreated = 0;
        let clientsUpdated = 0;
        let groupsCreated = 0;

        for (const [key, { row, groups }] of clientMap) {
          let clientId: string;

          const existing = existingByName.get(key);
          if (existing) {
            // Client exists — update KYC fields if provided
            const kycUpdate: Record<string, unknown> = { updated_at: new Date() };
            const kycKeys = [
              "business_pan", "address_line1", "address_line2", "city", "state",
              "country", "pincode", "llpin", "din", "cin", "gst_number",
              "gst_state_code", "gst_dest_address",
            ] as const;
            for (const k of kycKeys) {
              if (row[k] !== null) kycUpdate[k] = row[k];
            }
            if (row.email) kycUpdate.email = row.email;
            if (row.phone) kycUpdate.phone = row.phone;

            await tx.client.update({ where: { id: existing.id }, data: kycUpdate as any });
            clientId = existing.id;
            clientsUpdated++;
          } else {
            // Create new client
            const kycData: Record<string, unknown> = {};
            const kycKeys = [
              "business_pan", "address_line1", "address_line2", "city", "state",
              "country", "pincode", "llpin", "din", "cin", "gst_number",
              "gst_state_code", "gst_dest_address",
            ] as const;
            for (const k of kycKeys) {
              if (row[k] !== null) kycData[k] = row[k];
            }

            const created = await tx.client.create({
              data: {
                tenant_id: tenantId,
                name: row.name,
                email: row.email,
                phone: row.phone,
                ...kycData,
              } as any,
            });
            clientId = created.id;
            existingByName.set(key, { id: clientId, name: row.name, client_group: [] });
            clientsCreated++;
          }

          // Create groups that don't already exist
          for (const g of groups) {
            const existingGroups = existingByName.get(key)!.client_group;
            const groupExists = existingGroups.some(
              (eg) => eg.group_name.toLowerCase() === g.group_name!.toLowerCase(),
            );
            if (!groupExists) {
              const created = await tx.client_group.create({
                data: {
                  tenant_id: tenantId,
                  client_id: clientId,
                  group_name: g.group_name!,
                  email: g.group_email,
                  phone: g.group_phone,
                },
              });
              existingByName.get(key)!.client_group.push({ id: created.id, group_name: created.group_name });
              groupsCreated++;
            }
          }
        }

        return { clientsCreated, clientsUpdated, groupsCreated };
      });

      res.status(201).json({
        message: `Import complete: ${imported.clientsCreated} client(s) created, ${imported.clientsUpdated} updated, ${imported.groupsCreated} group(s) created`,
        ...imported,
      });
    } catch (err: any) {
      console.error("Client import transaction failed:", err);
      res.status(500).json({ error: "Import failed. No data was inserted.", detail: err.message });
    }
  },
);

export default router;
