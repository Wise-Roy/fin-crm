import { prisma } from "@repo/db";
import type { Tenant, TenantSettings } from "@repo/db";

export interface UpdateTenantData {
  name?: string;
  slug?: string;
}

export interface UpdateBrandingData {
  logoUrl?: string | null;
  primaryColor?: string | null;
  timezone?: string;
  currency?: string;
  locale?: string;
}

export interface UpdateSettingsData {
  dateFormat?: string;
  timeFormat?: string;
  weekStartsOn?: number;
  fiscalYearStartMonth?: number;
  invoicePrefix?: string;
  employeeIdPrefix?: string;
}

export const tenantRepository = {
  async findById(id: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({ where: { id } });
  },

  async findBySlug(slug: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({ where: { slug } });
  },

  async findByIdWithSettings(id: string) {
    return prisma.tenant.findUnique({
      where: { id },
      include: { settings: true },
    });
  },

  async update(id: string, data: UpdateTenantData): Promise<Tenant> {
    return prisma.tenant.update({ where: { id }, data });
  },

  async updateStatus(id: string, status: "active" | "suspended" | "archived"): Promise<Tenant> {
    return prisma.tenant.update({ where: { id }, data: { status } });
  },

  async updateBranding(id: string, data: UpdateBrandingData): Promise<Tenant> {
    return prisma.tenant.update({ where: { id }, data });
  },

  async getSettings(tenantId: string): Promise<TenantSettings | null> {
    return prisma.tenantSettings.findUnique({ where: { tenantId } });
  },

  async upsertSettings(tenantId: string, data: UpdateSettingsData): Promise<TenantSettings> {
    return prisma.tenantSettings.upsert({
      where: { tenantId },
      update: data,
      create: { tenantId, ...data },
    });
  },

  async countUsers(tenantId: string): Promise<number> {
    return prisma.user.count({ where: { tenantId } });
  },
};
