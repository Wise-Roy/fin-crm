import { prisma } from "@repo/db";
import { employeeRepository, type UpdateEmployeeData } from './employee.repository.js';
import { ServiceError } from '../tenant/tenant.service.js';

interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  department?: string;
  designation?: string;
  reportingManagerId?: string;
  joinedAt?: string;
  employmentType?: "full_time" | "part_time" | "contract" | "intern" | "consultant";
  userId?: string;
}

interface ListEmployeesInput {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  status?: string;
  department?: string;
  designation?: string;
  employmentType?: string;
  reportingManagerId?: string;
  joinedFrom?: string;
  joinedTo?: string;
}

const VALID_SORT_FIELDS = ["fullName", "employeeCode", "email", "department", "joinedAt", "createdAt"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;

export const employeeService = {
  async create(tenantId: string, input: CreateEmployeeInput, createdBy?: string) {
    // Validate required fields
    if (!input.firstName?.trim()) throw new ServiceError(400, "firstName is required");
    if (!input.lastName?.trim()) throw new ServiceError(400, "lastName is required");
    if (!input.email?.trim()) throw new ServiceError(400, "email is required");
    if (!EMAIL_REGEX.test(input.email)) throw new ServiceError(400, "Invalid email format");
    if (input.phone && !PHONE_REGEX.test(input.phone)) throw new ServiceError(400, "Invalid phone format");

    // Check duplicate email within tenant
    const existingEmail = await employeeRepository.findByEmail(input.email, tenantId);
    if (existingEmail) throw new ServiceError(409, "Employee with this email already exists");

    // Validate reporting manager
    if (input.reportingManagerId) {
      await this.validateManager(input.reportingManagerId, tenantId);
    }

    // Generate employee code
    const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } });
    const prefix = settings?.employeeIdPrefix || "EMP";
    const employeeCode = await employeeRepository.getNextEmployeeCode(tenantId, prefix);

    const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`;

    return employeeRepository.create({
      tenantId,
      userId: input.userId,
      employeeCode,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      fullName,
      email: input.email.trim().toLowerCase(),
      phone: input.phone,
      profileImage: input.profileImage,
      department: input.department,
      designation: input.designation,
      reportingManagerId: input.reportingManagerId,
      joinedAt: input.joinedAt ? new Date(input.joinedAt) : undefined,
      employmentType: input.employmentType,
      createdBy,
    });
  },

  async getById(id: string, tenantId: string) {
    const employee = await employeeRepository.findById(id, tenantId);
    if (!employee) throw new ServiceError(404, "Employee not found");
    return employee;
  },

  async getMyProfile(userId: string, tenantId: string) {
    const employee = await employeeRepository.findByUserId(userId, tenantId);
    if (!employee) throw new ServiceError(404, "Employee profile not found");
    return employee;
  },

  async update(id: string, tenantId: string, input: UpdateEmployeeData) {
    const existing = await employeeRepository.findById(id, tenantId);
    if (!existing) throw new ServiceError(404, "Employee not found");

    if (input.email) {
      if (!EMAIL_REGEX.test(input.email)) throw new ServiceError(400, "Invalid email format");
      const emailOwner = await employeeRepository.findByEmail(input.email, tenantId);
      if (emailOwner && emailOwner.id !== id) {
        throw new ServiceError(409, "Employee with this email already exists");
      }
      input.email = input.email.trim().toLowerCase();
    }

    if (input.phone !== undefined && input.phone !== null && !PHONE_REGEX.test(input.phone)) {
      throw new ServiceError(400, "Invalid phone format");
    }

    if (input.reportingManagerId) {
      await this.validateManager(input.reportingManagerId, tenantId, id);
    }

    // Recompute fullName if name changed
    if (input.firstName || input.lastName) {
      const firstName = input.firstName?.trim() || existing.firstName;
      const lastName = input.lastName?.trim() || existing.lastName;
      input.fullName = `${firstName} ${lastName}`;
    }

    return employeeRepository.updateByIdAndTenant(id, tenantId, input);
  },

  async updateOwnProfile(userId: string, tenantId: string, input: Pick<UpdateEmployeeData, "phone" | "profileImage">) {
    const employee = await employeeRepository.findByUserId(userId, tenantId);
    if (!employee) throw new ServiceError(404, "Employee profile not found");

    if (input.phone !== undefined && input.phone !== null && !PHONE_REGEX.test(input.phone)) {
      throw new ServiceError(400, "Invalid phone format");
    }

    return employeeRepository.updateByIdAndTenant(employee.id, tenantId, input);
  },

  async updateStatus(id: string, tenantId: string, status: string) {
    const validStatuses = ["active", "inactive", "suspended", "resigned"] as const;
    if (!validStatuses.includes(status as typeof validStatuses[number])) {
      throw new ServiceError(400, "Invalid status. Must be: active, inactive, suspended, or resigned");
    }

    const employee = await employeeRepository.findById(id, tenantId);
    if (!employee) throw new ServiceError(404, "Employee not found");

    if (employee.status === "resigned") {
      throw new ServiceError(400, "Resigned employees cannot change status");
    }

    return employeeRepository.updateStatus(id, tenantId, status as "active" | "inactive" | "suspended" | "resigned");
  },

  async softDelete(id: string, tenantId: string) {
    const employee = await employeeRepository.findById(id, tenantId);
    if (!employee) throw new ServiceError(404, "Employee not found");

    // Check if has direct reports
    const reportCount = await employeeRepository.countByManager(id, tenantId);
    if (reportCount > 0) {
      throw new ServiceError(400, "Cannot remove employee who has direct reports. Reassign them first.");
    }

    return employeeRepository.updateStatus(id, tenantId, "resigned");
  },

  async list(tenantId: string, input: ListEmployeesInput) {
    const page = Math.max(1, input.page || 1);
    const limit = Math.min(100, Math.max(1, input.limit || 20));
    const sort = VALID_SORT_FIELDS.includes(input.sort || "") ? input.sort! : "createdAt";
    const order = input.order === "asc" ? "asc" : "desc";

    return employeeRepository.list({
      tenantId,
      page,
      limit,
      sort,
      order,
      search: input.search,
      status: input.status,
      department: input.department,
      designation: input.designation,
      employmentType: input.employmentType,
      reportingManagerId: input.reportingManagerId,
      joinedFrom: input.joinedFrom ? new Date(input.joinedFrom) : undefined,
      joinedTo: input.joinedTo ? new Date(input.joinedTo) : undefined,
    });
  },

  async validateManager(managerId: string, tenantId: string, employeeId?: string) {
    if (employeeId && managerId === employeeId) {
      throw new ServiceError(400, "Employee cannot report to themselves");
    }

    const manager = await employeeRepository.findById(managerId, tenantId);
    if (!manager) throw new ServiceError(400, "Reporting manager not found in this organization");
    if (manager.status !== "active") throw new ServiceError(400, "Reporting manager is not active");

    // Prevent circular: walk up the chain from manager
    if (employeeId) {
      let current = manager;
      const visited = new Set<string>([employeeId]);
      while (current.reportingManagerId) {
        if (visited.has(current.reportingManagerId)) {
          throw new ServiceError(400, "Circular reporting relationship detected");
        }
        visited.add(current.reportingManagerId);
        const next = await employeeRepository.findById(current.reportingManagerId, tenantId);
        if (!next) break;
        current = next;
      }
    }
  },
};
