import { prisma } from "@repo/db";

export interface CreateEmployeeData {
  tenantId: string;
  userId?: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  department?: string;
  designation?: string;
  reportingManagerId?: string;
  joinedAt?: Date;
  employmentType?: "full_time" | "part_time" | "contract" | "intern" | "consultant";
  createdBy?: string;
}

export interface UpdateEmployeeData {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string | null;
  profileImage?: string | null;
  department?: string | null;
  designation?: string | null;
  reportingManagerId?: string | null;
  employmentType?: "full_time" | "part_time" | "contract" | "intern" | "consultant";
}

export interface EmployeeListParams {
  tenantId: string;
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
  search?: string;
  status?: string;
  department?: string;
  designation?: string;
  employmentType?: string;
  reportingManagerId?: string;
  joinedFrom?: Date;
  joinedTo?: Date;
}

const includeRelations = {
  reportingManager: {
    select: { id: true, fullName: true, employeeCode: true },
  },
  user: {
    select: { id: true, email: true },
  },
};

export const employeeRepository = {
  async create(data: CreateEmployeeData) {
    return prisma.employee.create({
      data,
      include: includeRelations,
    });
  },

  async findById(id: string, tenantId: string) {
    return prisma.employee.findFirst({
      where: { id, tenantId },
      include: {
        ...includeRelations,
        directReports: {
          select: { id: true, fullName: true, employeeCode: true },
          where: { status: { not: "resigned" } },
        },
      },
    });
  },

  async findByUserId(userId: string, tenantId: string) {
    return prisma.employee.findFirst({
      where: { userId, tenantId },
      include: includeRelations,
    });
  },

  async findByEmail(email: string, tenantId: string) {
    return prisma.employee.findFirst({
      where: { email, tenantId },
    });
  },

  async findByCode(employeeCode: string, tenantId: string) {
    return prisma.employee.findFirst({
      where: { employeeCode, tenantId },
    });
  },

  async update(id: string, tenantId: string, data: UpdateEmployeeData) {
    return prisma.employee.update({
      where: { id, tenantId_email: undefined },
      data,
      include: includeRelations,
    });
  },

  async updateByIdAndTenant(id: string, tenantId: string, data: UpdateEmployeeData) {
    // First verify tenant ownership
    const employee = await prisma.employee.findFirst({ where: { id, tenantId } });
    if (!employee) return null;

    return prisma.employee.update({
      where: { id },
      data,
      include: includeRelations,
    });
  },

  async updateStatus(id: string, tenantId: string, status: "active" | "inactive" | "suspended" | "resigned") {
    const employee = await prisma.employee.findFirst({ where: { id, tenantId } });
    if (!employee) return null;

    return prisma.employee.update({
      where: { id },
      data: { status },
      include: includeRelations,
    });
  },

  async list(params: EmployeeListParams) {
    const {
      tenantId, page, limit, sort, order,
      search, status, department, designation,
      employmentType, reportingManagerId, joinedFrom, joinedTo,
    } = params;

    const where: Record<string, unknown> = { tenantId };

    // Exclude resigned from default listing
    if (status) {
      where.status = status;
    } else {
      where.status = { not: "resigned" };
    }

    if (department) where.department = department;
    if (designation) where.designation = designation;
    if (employmentType) where.employmentType = employmentType;
    if (reportingManagerId) where.reportingManagerId = reportingManagerId;

    if (joinedFrom || joinedTo) {
      where.joinedAt = {
        ...(joinedFrom && { gte: joinedFrom }),
        ...(joinedTo && { lte: joinedTo }),
      };
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.employee.findMany({
        where: where as any,
        include: includeRelations,
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.employee.count({ where: where as any }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getNextEmployeeCode(tenantId: string, prefix: string): Promise<string> {
    const lastEmployee = await prisma.employee.findFirst({
      where: { tenantId, employeeCode: { startsWith: prefix } },
      orderBy: { employeeCode: "desc" },
      select: { employeeCode: true },
    });

    if (!lastEmployee) {
      return `${prefix}-0001`;
    }

    const lastNumber = parseInt(lastEmployee.employeeCode.split("-").pop() || "0", 10);
    return `${prefix}-${String(lastNumber + 1).padStart(4, "0")}`;
  },

  async countByManager(managerId: string, tenantId: string): Promise<number> {
    return prisma.employee.count({
      where: { reportingManagerId: managerId, tenantId, status: { not: "resigned" } },
    });
  },
};
