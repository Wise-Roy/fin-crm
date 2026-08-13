import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "@repo/db";
import { authenticate } from "../middleware/auth.js";
import { sendEmail } from "../config/email.config.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const JWT_EXPIRES_IN = "7d";

// In-memory OTP store: email -> { otp, expiresAt, userId }
const otpStore = new Map<string, { otp: string; expiresAt: number; userId: string }>();
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * POST /api/auth/signup
 *
 * Creates a new organization (tenant) and owner user.
 *
 * Body: { name, email, password, organizationName }
 */
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, organizationName, phone } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    organizationName?: string;
    phone?: string;
  };

  if (!name || !email || !password || !organizationName || !phone) {
    res
      .status(400)
      .json({ error: "name, email, password, phone, and organizationName are required" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const subdomain = organizationName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (subdomain.length < 3) {
    res.status(400).json({ error: "Organization name must produce a subdomain of at least 3 characters" });
    return;
  }

  const existingTenant = await prisma.tenant.findUnique({ where: { subdomain } });
  if (existingTenant) {
    res.status(409).json({ error: "Organization subdomain already exists" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Block signup if email already exists in any tenant
  const existingUser = await prisma.user.findFirst({ where: { email: normalizedEmail } });
  if (existingUser) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create tenant
    const newTenant = await tx.tenant.create({
      data: { name: organizationName, subdomain },
    });

    // 2. Create owner user (inactive until OTP verified)
    const user = await tx.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        password_hash,
        tenantId: newTenant.id,
        role: "OWNER",
        is_active: false,
      },
    });

    return user;
  });

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  otpStore.set(normalizedEmail, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    userId: result.id,
  });

  // Send welcome email with OTP
  try {
    await sendEmail({
      to: normalizedEmail,
      subject: "Thanks for using FinCRM services",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 8px;">Welcome to FinCRM!</h1>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">Thank you for choosing FinCRM to manage your business. We're excited to have you on board.</p>
          </div>
          <div style="background: #f9fafb; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 13px; color: #6b7280; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">Your Onboarding OTP</p>
            <p style="font-size: 36px; font-weight: 700; color: #111827; letter-spacing: 8px; margin: 0;">${otp}</p>
            <p style="font-size: 12px; color: #9ca3af; margin: 8px 0 0;">Valid for 10 minutes</p>
          </div>
          <p style="font-size: 13px; color: #9ca3af; text-align: center; margin: 0;">If you didn't create this account, please ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send OTP email:", err);
  }

  res.status(201).json({
    message: "Account created. Please verify the OTP sent to your email.",
    email: normalizedEmail,
  });
});

/**
 * POST /api/auth/verify-otp
 *
 * Validates the OTP sent during signup and activates the account.
 *
 * Body: { email, otp }
 */
router.post("/verify-otp", async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body as { email?: string; otp?: string };

  if (!email || !otp) {
    res.status(400).json({ error: "email and otp are required" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const stored = otpStore.get(normalizedEmail);

  if (!stored) {
    res.status(400).json({ error: "No OTP found for this email. Please sign up again." });
    return;
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(normalizedEmail);
    res.status(400).json({ error: "OTP has expired. Please sign up again." });
    return;
  }

  if (stored.otp !== otp) {
    res.status(400).json({ error: "Invalid OTP. Please try again." });
    return;
  }

  // OTP valid — activate user and return token
  otpStore.delete(normalizedEmail);

  const user = await prisma.user.update({
    where: { id: stored.userId },
    data: { is_active: true },
    include: { tenant: true },
  });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        subdomain: user.tenant.subdomain,
      },
    },
  });
});

/**
 * POST /api/auth/login
 *
 * Authenticates user with email + password.
 * Optional `subdomain` to disambiguate multi-tenant emails.
 *
 * Body: { email, password, subdomain? }
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password, subdomain } = req.body as {
    email?: string;
    password?: string;
    subdomain?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Build query — scope to tenant if subdomain provided
  const where: Record<string, unknown> = { email: normalizedEmail };
  if (subdomain) {
    const tenant = await prisma.tenant.findUnique({ where: { subdomain } });
    if (!tenant) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    where.tenantId = tenant.id;
  }

  const users = await prisma.user.findMany({
    where: where as any,
    include: { tenant: true },
  });

  if (users.length === 0) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  // If multiple matches and no subdomain, ask client to specify
  if (users.length > 1) {
    const subdomains = users.map((u) => u.tenant.subdomain);
    res.status(409).json({
      error: "Email exists in multiple organizations. Provide subdomain.",
      tenants: subdomains,
    });
    return;
  }

  const user = users[0]!;

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (!user.is_active) {
    res.status(403).json({ error: "Account is inactive" });
    return;
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        subdomain: user.tenant.subdomain,
      },
    },
  });
});

const RESET_TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * POST /api/auth/forgot-password
 *
 * Sends a password reset email. Never reveals whether the email exists.
 *
 * Body: { email }
 */
router.post("/forgot-password", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };

  // Always return success to not reveal email existence
  const successMsg = "If an account with that email exists, a reset link has been sent.";

  if (!email) {
    res.json({ message: successMsg });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findFirst({ where: { email: normalizedEmail } });

  if (!user) {
    res.json({ message: successMsg });
    return;
  }

  // Invalidate previous active tokens for this user
  await prisma.password_reset_token.updateMany({
    where: { user_id: user.id, used_at: null },
    data: { used_at: new Date() },
  });

  // Generate cryptographically secure token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  await prisma.password_reset_token.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
    },
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: "Reset your FinCRM password",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 8px;">Password Reset</h1>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">We received a request to reset your FinCRM password.</p>
          </div>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${resetLink}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600;">Reset Password</a>
          </div>
          <p style="font-size: 13px; color: #9ca3af; text-align: center; margin: 0 0 8px;">This link expires in 30 minutes.</p>
          <p style="font-size: 13px; color: #9ca3af; text-align: center; margin: 0;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send reset email:", err);
  }

  res.json({ message: successMsg });
});

/**
 * POST /api/auth/reset-password
 *
 * Resets the user's password using a valid token.
 *
 * Body: { token, password }
 */
router.post("/reset-password", async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body as { token?: string; password?: string };

  if (!token || !password) {
    res.status(400).json({ error: "token and password are required" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const resetToken = await prisma.password_reset_token.findFirst({
    where: { token_hash: tokenHash },
  });

  if (!resetToken) {
    res.status(400).json({ error: "Invalid or expired reset link" });
    return;
  }

  if (resetToken.used_at) {
    res.status(400).json({ error: "This reset link has already been used" });
    return;
  }

  if (new Date() > resetToken.expires_at) {
    res.status(400).json({ error: "This reset link has expired" });
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    // Update password
    prisma.user.update({
      where: { id: resetToken.user_id },
      data: { password_hash },
    }),
    // Mark token as used
    prisma.password_reset_token.update({
      where: { id: resetToken.id },
      data: { used_at: new Date() },
    }),
    // Invalidate other active tokens for this user
    prisma.password_reset_token.updateMany({
      where: { user_id: resetToken.user_id, used_at: null },
      data: { used_at: new Date() },
    }),
  ]);

  res.json({ message: "Password has been reset successfully" });
});

/**
 * GET /api/auth/me
 *
 * Returns the current authenticated user's profile.
 */
router.get("/me", authenticate, async (req: Request, res: Response): Promise<void> => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user!.id },
    include: { tenant: true },
  });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      phone: user.phone,
      position: user.position,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        subdomain: user.tenant.subdomain,
      },
    },
  });
});

export default router;
