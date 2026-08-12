// Input validation utilities

export const PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^[0-9]{10}$/,
  NAME: /^[a-zA-Z0-9 _-]+$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  GSTIN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][Z][0-9A-Z]$/,
  GST_STATE_CODE: /^[0-9]{2}$/,
  LLPIN: /^[A-Z]{3}-[0-9]{4}$/,
  DIN: /^[0-9]{8}$/,
  CIN: /^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
  PINCODE: /^[0-9]{6}$/,
} as const;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateEmail(value: string): ValidationResult {
  if (!value) return { valid: true };
  if (!PATTERNS.EMAIL.test(value)) return { valid: false, error: "Invalid email format" };
  return { valid: true };
}

export function validatePhone(value: string): ValidationResult {
  if (!value) return { valid: true };
  const digits = value.replace(/\s/g, "");
  if (!PATTERNS.PHONE.test(digits)) return { valid: false, error: "Phone must be 10 digits" };
  return { valid: true };
}

export function validateName(value: string): ValidationResult {
  if (!value) return { valid: true };
  if (!PATTERNS.NAME.test(value)) return { valid: false, error: "Only letters, numbers, spaces, _ and - allowed" };
  return { valid: true };
}

export function validatePAN(value: string): ValidationResult {
  if (!value) return { valid: true };
  if (!PATTERNS.PAN.test(value.toUpperCase())) return { valid: false, error: "PAN format: ABCDE1234F" };
  return { valid: true };
}

export function validateGSTIN(value: string): ValidationResult {
  if (!value) return { valid: true };
  if (!PATTERNS.GSTIN.test(value.toUpperCase())) return { valid: false, error: "Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)" };
  return { valid: true };
}

export function validateGSTStateCode(value: string): ValidationResult {
  if (!value) return { valid: true };
  if (!PATTERNS.GST_STATE_CODE.test(value)) return { valid: false, error: "GST state code must be 2 digits" };
  return { valid: true };
}

export function validateLLPIN(value: string): ValidationResult {
  if (!value) return { valid: true };
  if (!PATTERNS.LLPIN.test(value.toUpperCase())) return { valid: false, error: "LLPIN format: AAA-0000" };
  return { valid: true };
}

export function validateDIN(value: string): ValidationResult {
  if (!value) return { valid: true };
  if (!PATTERNS.DIN.test(value)) return { valid: false, error: "DIN must be 8 digits" };
  return { valid: true };
}

export function validateCIN(value: string): ValidationResult {
  if (!value) return { valid: true };
  if (!PATTERNS.CIN.test(value.toUpperCase())) return { valid: false, error: "Invalid CIN format (e.g. U12345AB1234ABC123456)" };
  return { valid: true };
}

export function validatePincode(value: string): ValidationResult {
  if (!value) return { valid: true };
  if (!PATTERNS.PINCODE.test(value)) return { valid: false, error: "Pincode must be 6 digits" };
  return { valid: true };
}

/** Validate a field, return error string or empty */
export function getFieldError(field: "name" | "email" | "phone", value: string): string {
  if (!value) return "";
  switch (field) {
    case "name": return validateName(value).error || "";
    case "email": return validateEmail(value).error || "";
    case "phone": return validatePhone(value).error || "";
  }
}
