import type { Worksheet } from "exceljs";

export interface RowError {
  row: number;
  column: string;
  message: string;
}

export interface ValidationResult<T> {
  valid: boolean;
  errors: RowError[];
  rows: T[];
}

// ─── Task Import ────────────────────────────────────────────────────────────────

export const TASK_COLUMNS = [
  "title",
  "description",
  "category",
  "subcategory",
  "client_name",
  "client_group_name",
  "assigned_to_email",
  "priority",
  "status",
  "due_date",
] as const;

export interface TaskRow {
  title: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  client_name: string | null;
  client_group_name: string | null;
  assigned_to_email: string | null;
  priority: string;
  status: string;
  due_date: Date | null;
}

const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const VALID_STATUSES = ["TODO", "IN_PROGRESS", "WAITING_CLIENT", "REVIEW", "COMPLETED", "CANCELLED"];

export function validateTaskSheet(sheet: Worksheet, maxRows = 1000): ValidationResult<TaskRow> {
  const errors: RowError[] = [];
  const rows: TaskRow[] = [];

  // Validate header row
  const headerRow = sheet.getRow(1);
  const headers = TASK_COLUMNS.map((_, i) => {
    const cell = headerRow.getCell(i + 1);
    return String(cell.value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  });

  for (let i = 0; i < TASK_COLUMNS.length; i++) {
    if (headers[i] !== TASK_COLUMNS[i]) {
      errors.push({ row: 1, column: TASK_COLUMNS[i], message: `Expected column header "${TASK_COLUMNS[i]}" but found "${headers[i]}"` });
    }
  }

  if (errors.length > 0) return { valid: false, errors, rows: [] };

  const dataRowCount = sheet.rowCount - 1;
  if (dataRowCount <= 0) {
    errors.push({ row: 2, column: "title", message: "No data rows found" });
    return { valid: false, errors, rows: [] };
  }
  if (dataRowCount > maxRows) {
    errors.push({ row: 1, column: "-", message: `Too many rows (${dataRowCount}). Maximum allowed: ${maxRows}` });
    return { valid: false, errors, rows: [] };
  }

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);

    // Skip completely empty rows
    const allEmpty = TASK_COLUMNS.every((_, i) => {
      const v = row.getCell(i + 1).value;
      return v === null || v === undefined || String(v).trim() === "";
    });
    if (allEmpty) continue;

    const cellStr = (col: number): string | null => {
      const v = row.getCell(col).value;
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      return s === "" ? null : s;
    };

    const title = cellStr(1);
    if (!title) {
      errors.push({ row: r, column: "title", message: "title is required" });
    }

    const priority = cellStr(8)?.toUpperCase() || "MEDIUM";
    if (!VALID_PRIORITIES.includes(priority)) {
      errors.push({ row: r, column: "priority", message: `Invalid priority "${priority}". Must be one of: ${VALID_PRIORITIES.join(", ")}` });
    }

    const status = cellStr(9)?.toUpperCase() || "TODO";
    if (!VALID_STATUSES.includes(status)) {
      errors.push({ row: r, column: "status", message: `Invalid status "${status}". Must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    let dueDate: Date | null = null;
    const dueDateRaw = row.getCell(10).value;
    if (dueDateRaw !== null && dueDateRaw !== undefined && String(dueDateRaw).trim() !== "") {
      if (dueDateRaw instanceof Date) {
        dueDate = dueDateRaw;
      } else {
        const parsed = new Date(String(dueDateRaw));
        if (isNaN(parsed.getTime())) {
          errors.push({ row: r, column: "due_date", message: `Invalid date "${dueDateRaw}"` });
        } else {
          dueDate = parsed;
        }
      }
    }

    const subcategory = cellStr(4);
    const category = cellStr(3);
    if (subcategory && !category) {
      errors.push({ row: r, column: "subcategory", message: "subcategory requires a category" });
    }

    const clientGroupName = cellStr(6);
    const clientName = cellStr(5);
    if (clientGroupName && !clientName) {
      errors.push({ row: r, column: "client_group_name", message: "client_group_name requires a client_name" });
    }

    const assignedEmail = cellStr(7);
    if (assignedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assignedEmail)) {
      errors.push({ row: r, column: "assigned_to_email", message: `Invalid email "${assignedEmail}"` });
    }

    rows.push({
      title: title || "",
      description: cellStr(2),
      category,
      subcategory,
      client_name: clientName,
      client_group_name: clientGroupName,
      assigned_to_email: assignedEmail,
      priority,
      status,
      due_date: dueDate,
    });
  }

  return { valid: errors.length === 0, errors, rows };
}

// ─── Client Import ──────────────────────────────────────────────────────────────

export const CLIENT_COLUMNS = [
  "name",
  "email",
  "phone",
  "group_name",
  "group_email",
  "group_phone",
  "business_pan",
  "address_line1",
  "address_line2",
  "city",
  "state",
  "country",
  "pincode",
  "llpin",
  "din",
  "cin",
  "gst_number",
  "gst_state_code",
  "gst_dest_address",
] as const;

export interface ClientRow {
  name: string;
  email: string | null;
  phone: string | null;
  group_name: string | null;
  group_email: string | null;
  group_phone: string | null;
  business_pan: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  llpin: string | null;
  din: string | null;
  cin: string | null;
  gst_number: string | null;
  gst_state_code: string | null;
  gst_dest_address: string | null;
}

export function validateClientSheet(sheet: Worksheet, maxRows = 1000): ValidationResult<ClientRow> {
  const errors: RowError[] = [];
  const rows: ClientRow[] = [];

  const headerRow = sheet.getRow(1);
  const headers = CLIENT_COLUMNS.map((_, i) => {
    const cell = headerRow.getCell(i + 1);
    return String(cell.value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  });

  for (let i = 0; i < CLIENT_COLUMNS.length; i++) {
    if (headers[i] !== CLIENT_COLUMNS[i]) {
      errors.push({ row: 1, column: CLIENT_COLUMNS[i], message: `Expected column header "${CLIENT_COLUMNS[i]}" but found "${headers[i]}"` });
    }
  }

  if (errors.length > 0) return { valid: false, errors, rows: [] };

  const dataRowCount = sheet.rowCount - 1;
  if (dataRowCount <= 0) {
    errors.push({ row: 2, column: "name", message: "No data rows found" });
    return { valid: false, errors, rows: [] };
  }
  if (dataRowCount > maxRows) {
    errors.push({ row: 1, column: "-", message: `Too many rows (${dataRowCount}). Maximum allowed: ${maxRows}` });
    return { valid: false, errors, rows: [] };
  }

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);

    const allEmpty = CLIENT_COLUMNS.every((_, i) => {
      const v = row.getCell(i + 1).value;
      return v === null || v === undefined || String(v).trim() === "";
    });
    if (allEmpty) continue;

    const cellStr = (col: number): string | null => {
      const v = row.getCell(col).value;
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      return s === "" ? null : s;
    };

    const name = cellStr(1);
    if (!name) {
      errors.push({ row: r, column: "name", message: "name is required" });
    }

    const email = cellStr(2);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ row: r, column: "email", message: `Invalid email "${email}"` });
    }

    const groupEmail = cellStr(5);
    if (groupEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(groupEmail)) {
      errors.push({ row: r, column: "group_email", message: `Invalid email "${groupEmail}"` });
    }

    const groupName = cellStr(4);
    if (!name && groupName) {
      errors.push({ row: r, column: "group_name", message: "group_name requires a client name" });
    }

    const pan = cellStr(7);
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.toUpperCase())) {
      errors.push({ row: r, column: "business_pan", message: `Invalid PAN format "${pan}"` });
    }

    const gst = cellStr(17);
    if (gst && !/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]$/.test(gst.toUpperCase())) {
      errors.push({ row: r, column: "gst_number", message: `Invalid GST format "${gst}"` });
    }

    rows.push({
      name: name || "",
      email,
      phone: cellStr(3),
      group_name: groupName,
      group_email: groupEmail,
      group_phone: cellStr(6),
      business_pan: pan?.toUpperCase() || null,
      address_line1: cellStr(8),
      address_line2: cellStr(9),
      city: cellStr(10),
      state: cellStr(11),
      country: cellStr(12),
      pincode: cellStr(13),
      llpin: cellStr(14),
      din: cellStr(15),
      cin: cellStr(16),
      gst_number: gst?.toUpperCase() || null,
      gst_state_code: cellStr(18),
      gst_dest_address: cellStr(19),
    });
  }

  return { valid: errors.length === 0, errors, rows };
}
