// Shared validation patterns (mirrors frontend apps/web/lib/validations.ts)

const PATTERNS = {
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  GSTIN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][Z][0-9A-Z]$/,
  GST_STATE_CODE: /^[0-9]{2}$/,
  LLPIN: /^[A-Z]{3}-[0-9]{4}$/,
  DIN: /^[0-9]{8}$/,
  CIN: /^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
  PINCODE: /^[0-9]{6}$/,
  PHONE: /^[0-9]{10}$/,
  EMAIL: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
} as const;

interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate KYC fields. Returns array of errors (empty = valid).
 * Only validates fields that are present and non-empty.
 */
export function validateKycFields(data: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  const str = (key: string): string | null => {
    const v = data[key];
    if (v === null || v === undefined || v === "") return null;
    return String(v).trim();
  };

  const check = (key: string, pattern: RegExp, msg: string) => {
    const v = str(key);
    if (v && !pattern.test(v.toUpperCase())) {
      errors.push({ field: key, message: msg });
    }
  };

  check("business_pan", PATTERNS.PAN, "Invalid PAN format (e.g. ABCDE1234F)");
  check("gst_number", PATTERNS.GSTIN, "Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)");
  check("gst_state_code", PATTERNS.GST_STATE_CODE, "GST state code must be 2 digits");
  check("llpin", PATTERNS.LLPIN, "Invalid LLPIN format (e.g. AAA-0000)");
  check("din", PATTERNS.DIN, "DIN must be 8 digits");
  check("cin", PATTERNS.CIN, "Invalid CIN format (e.g. U12345AB1234ABC123456)");
  check("pincode", PATTERNS.PINCODE, "Pincode must be 6 digits");

  return errors;
}

/** Validate email if present */
export function validateEmail(value: string | undefined | null): string | null {
  if (!value) return null;
  if (!PATTERNS.EMAIL.test(value.trim())) return "Invalid email format";
  return null;
}

/** Validate phone (10 digits) if present */
export function validatePhone(value: string | undefined | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\s/g, "");
  if (!PATTERNS.PHONE.test(digits)) return "Phone must be 10 digits";
  return null;
}

/** Validate PAN if present */
export function validatePAN(value: string | undefined | null): string | null {
  if (!value) return null;
  if (!PATTERNS.PAN.test(value.toUpperCase())) return "Invalid PAN format (e.g. ABCDE1234F)";
  return null;
}
