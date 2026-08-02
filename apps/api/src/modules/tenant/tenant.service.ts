import {
  tenantRepository,
  type UpdateTenantData,
  type UpdateBrandingData,
  type UpdateSettingsData,
} from './tenant.repository.js';

const VALID_TIMEZONES = Intl.supportedValuesOf("timeZone");

const SUPPORTED_CURRENCIES = [
  "USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD", "CHF", "CNY", "SEK",
  "NZD", "MXN", "SGD", "HKD", "NOK", "KRW", "TRY", "RUB", "BRL", "ZAR",
];

const SUPPORTED_LOCALES = [
  "en-US", "en-GB", "en-AU", "en-IN", "de-DE", "fr-FR", "es-ES",
  "pt-BR", "ja-JP", "zh-CN", "ko-KR", "ar-SA", "hi-IN",
];

export const tenantService = {
  async getTenant(tenantId: string) {
    const tenant = await tenantRepository.findByIdWithSettings(tenantId);
    if (!tenant) throw new ServiceError(404, "Tenant not found");
    return tenant;
  },

  async updateTenant(tenantId: string, data: UpdateTenantData) {
    if (data.slug) {
      const slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (slug.length < 3) {
        throw new ServiceError(400, "Slug must be at least 3 characters");
      }
      const existing = await tenantRepository.findBySlug(slug);
      if (existing && existing.id !== tenantId) {
        throw new ServiceError(409, "Slug already exists");
      }
      data.slug = slug;
    }

    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new ServiceError(400, "Name is required");
    }

    return tenantRepository.update(tenantId, data);
  },

  async updateStatus(tenantId: string, status: string) {
    const validStatuses = ["active", "suspended", "archived"] as const;
    if (!validStatuses.includes(status as typeof validStatuses[number])) {
      throw new ServiceError(400, "Invalid status. Must be: active, suspended, or archived");
    }

    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) throw new ServiceError(404, "Tenant not found");

    if (tenant.status === "archived" && status !== "archived") {
      throw new ServiceError(400, "Archived tenants cannot be reactivated");
    }

    return tenantRepository.updateStatus(tenantId, status as "active" | "suspended" | "archived");
  },

  async updateBranding(tenantId: string, data: UpdateBrandingData) {
    if (data.timezone && !VALID_TIMEZONES.includes(data.timezone)) {
      throw new ServiceError(400, "Invalid timezone");
    }
    if (data.currency && !SUPPORTED_CURRENCIES.includes(data.currency)) {
      throw new ServiceError(400, "Unsupported currency");
    }
    if (data.locale && !SUPPORTED_LOCALES.includes(data.locale)) {
      throw new ServiceError(400, "Unsupported locale");
    }
    if (data.primaryColor && !/^#[0-9a-fA-F]{6}$/.test(data.primaryColor)) {
      throw new ServiceError(400, "Primary color must be a valid hex color (e.g. #FF5733)");
    }

    return tenantRepository.updateBranding(tenantId, data);
  },

  async updateSettings(tenantId: string, data: UpdateSettingsData) {
    if (data.weekStartsOn !== undefined && (data.weekStartsOn < 0 || data.weekStartsOn > 6)) {
      throw new ServiceError(400, "weekStartsOn must be 0 (Sunday) to 6 (Saturday)");
    }
    if (data.fiscalYearStartMonth !== undefined && (data.fiscalYearStartMonth < 1 || data.fiscalYearStartMonth > 12)) {
      throw new ServiceError(400, "fiscalYearStartMonth must be 1-12");
    }

    return tenantRepository.upsertSettings(tenantId, data);
  },

  async getLimits(tenantId: string) {
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) throw new ServiceError(404, "Tenant not found");

    const currentUsers = await tenantRepository.countUsers(tenantId);

    return {
      plan: tenant.plan,
      users: { current: currentUsers, limit: tenant.userLimit },
      storage: { current: 0, limit: tenant.storageLimit },
    };
  },
};

export class ServiceError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}
