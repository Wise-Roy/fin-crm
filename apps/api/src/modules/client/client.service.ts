import { clientRepository, type UpdateClientData } from './client.repository.js';
import { employeeRepository } from '../employee/employee.repository.js';
import { ServiceError } from '../tenant/tenant.service.js';

interface CreateClientInput {
  legalName: string;
  tradeName?: string;
  clientType?: "company" | "individual" | "partnership" | "llp" | "trust" | "ngo" | "government";
  pan?: string;
  gstin?: string;
  cin?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  accountManagerId?: string;
  onboardingDate?: string;
  tags?: string[];
  remarks?: string;
}

interface ListClientsInput {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  status?: string;
  clientType?: string;
  accountManagerId?: string;
  state?: string;
  country?: string;
  createdFrom?: string;
  createdTo?: string;
  onboardedFrom?: string;
  onboardedTo?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][Z][0-9A-Z]$/;
const URL_REGEX = /^https?:\/\/.+/;
const VALID_SORT_FIELDS = ["legalName", "clientCode", "clientType", "createdAt", "onboardingDate", "status"];

function validateRegistration(input: { pan?: string; gstin?: string }, context: string = "") {
  if (input.pan && !PAN_REGEX.test(input.pan)) {
    throw new ServiceError(400, "Invalid PAN format (e.g. ABCDE1234F)");
  }
  if (input.gstin && !GSTIN_REGEX.test(input.gstin)) {
    throw new ServiceError(400, "Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)");
  }
}

function validateContact(input: { primaryEmail?: string | null; primaryPhone?: string | null; website?: string | null }) {
  if (input.primaryEmail && !EMAIL_REGEX.test(input.primaryEmail)) {
    throw new ServiceError(400, "Invalid email format");
  }
  if (input.primaryPhone && !PHONE_REGEX.test(input.primaryPhone)) {
    throw new ServiceError(400, "Invalid phone format");
  }
  if (input.website && !URL_REGEX.test(input.website)) {
    throw new ServiceError(400, "Website must start with http:// or https://");
  }
}

export const clientService = {
  async create(tenantId: string, input: CreateClientInput, createdBy?: string) {
    if (!input.legalName?.trim()) throw new ServiceError(400, "legalName is required");

    validateRegistration(input);
    validateContact(input);

    // Check PAN uniqueness
    if (input.pan) {
      const existing = await clientRepository.findByPan(input.pan, tenantId);
      if (existing) throw new ServiceError(409, "Client with this PAN already exists");
    }

    // Check GSTIN uniqueness
    if (input.gstin) {
      const existing = await clientRepository.findByGstin(input.gstin, tenantId);
      if (existing) throw new ServiceError(409, "Client with this GSTIN already exists");
    }

    // Validate account manager
    if (input.accountManagerId) {
      const manager = await employeeRepository.findById(input.accountManagerId, tenantId);
      if (!manager) throw new ServiceError(400, "Account manager not found in this organization");
      if (manager.status !== "active") throw new ServiceError(400, "Account manager is not active");
    }

    const clientCode = await clientRepository.getNextClientCode(tenantId);

    return clientRepository.create({
      tenantId,
      clientCode,
      legalName: input.legalName.trim(),
      tradeName: input.tradeName?.trim(),
      clientType: input.clientType,
      pan: input.pan?.toUpperCase(),
      gstin: input.gstin?.toUpperCase(),
      cin: input.cin?.toUpperCase(),
      primaryEmail: input.primaryEmail?.trim().toLowerCase(),
      primaryPhone: input.primaryPhone,
      website: input.website,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      state: input.state,
      country: input.country,
      postalCode: input.postalCode,
      accountManagerId: input.accountManagerId,
      onboardingDate: input.onboardingDate ? new Date(input.onboardingDate) : undefined,
      tags: input.tags,
      remarks: input.remarks,
      createdBy,
    });
  },

  async getById(id: string, tenantId: string) {
    const client = await clientRepository.findById(id, tenantId);
    if (!client) throw new ServiceError(404, "Client not found");
    return client;
  },

  async update(id: string, tenantId: string, input: UpdateClientData & { pan?: string | null; gstin?: string | null }) {
    const existing = await clientRepository.findById(id, tenantId);
    if (!existing) throw new ServiceError(404, "Client not found");

    if (input.legalName !== undefined && !input.legalName?.trim()) {
      throw new ServiceError(400, "legalName cannot be empty");
    }

    if (input.pan) validateRegistration({ pan: input.pan });
    if (input.gstin) validateRegistration({ gstin: input.gstin });
    validateContact(input);

    // Check PAN uniqueness on change
    if (input.pan && input.pan !== existing.pan) {
      const dup = await clientRepository.findByPan(input.pan, tenantId);
      if (dup && dup.id !== id) throw new ServiceError(409, "Client with this PAN already exists");
      input.pan = input.pan.toUpperCase();
    }

    // Check GSTIN uniqueness on change
    if (input.gstin && input.gstin !== existing.gstin) {
      const dup = await clientRepository.findByGstin(input.gstin, tenantId);
      if (dup && dup.id !== id) throw new ServiceError(409, "Client with this GSTIN already exists");
      input.gstin = input.gstin.toUpperCase();
    }

    return clientRepository.updateByIdAndTenant(id, tenantId, input);
  },

  async updateStatus(id: string, tenantId: string, status: string) {
    const validStatuses = ["active", "inactive", "archived"] as const;
    if (!validStatuses.includes(status as typeof validStatuses[number])) {
      throw new ServiceError(400, "Invalid status. Must be: active, inactive, or archived");
    }

    const client = await clientRepository.findById(id, tenantId);
    if (!client) throw new ServiceError(404, "Client not found");

    return clientRepository.updateStatus(id, tenantId, status as "active" | "inactive" | "archived");
  },

  async assignAccountManager(id: string, tenantId: string, accountManagerId: string | null) {
    const client = await clientRepository.findById(id, tenantId);
    if (!client) throw new ServiceError(404, "Client not found");

    if (accountManagerId) {
      const manager = await employeeRepository.findById(accountManagerId, tenantId);
      if (!manager) throw new ServiceError(400, "Account manager not found in this organization");
      if (manager.status !== "active") throw new ServiceError(400, "Account manager is not active");
    }

    return clientRepository.updateAccountManager(id, tenantId, accountManagerId);
  },

  async softDelete(id: string, tenantId: string) {
    const client = await clientRepository.findById(id, tenantId);
    if (!client) throw new ServiceError(404, "Client not found");
    return clientRepository.updateStatus(id, tenantId, "archived");
  },

  async list(tenantId: string, input: ListClientsInput) {
    const page = Math.max(1, input.page || 1);
    const limit = Math.min(100, Math.max(1, input.limit || 20));
    const sort = VALID_SORT_FIELDS.includes(input.sort || "") ? input.sort! : "createdAt";
    const order = input.order === "asc" ? "asc" : "desc";

    return clientRepository.list({
      tenantId,
      page,
      limit,
      sort,
      order,
      search: input.search,
      status: input.status,
      clientType: input.clientType,
      accountManagerId: input.accountManagerId,
      state: input.state,
      country: input.country,
      createdFrom: input.createdFrom ? new Date(input.createdFrom) : undefined,
      createdTo: input.createdTo ? new Date(input.createdTo) : undefined,
      onboardedFrom: input.onboardedFrom ? new Date(input.onboardedFrom) : undefined,
      onboardedTo: input.onboardedTo ? new Date(input.onboardedTo) : undefined,
    });
  },
};
