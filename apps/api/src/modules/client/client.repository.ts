import { prisma } from "@repo/db";

export interface CreateClientData {
  tenantId: string;
  clientCode: string;
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
  onboardingDate?: Date;
  tags?: string[];
  remarks?: string;
  createdBy?: string;
}

export interface UpdateClientData {
  legalName?: string;
  tradeName?: string | null;
  clientType?: "company" | "individual" | "partnership" | "llp" | "trust" | "ngo" | "government";
  pan?: string | null;
  gstin?: string | null;
  cin?: string | null;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  website?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  onboardingDate?: Date | null;
  tags?: string[];
  remarks?: string | null;
}

export interface ClientListParams {
  tenantId: string;
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
  search?: string;
  status?: string;
  clientType?: string;
  accountManagerId?: string;
  state?: string;
  country?: string;
  createdFrom?: Date;
  createdTo?: Date;
  onboardedFrom?: Date;
  onboardedTo?: Date;
}

const includeRelations = {
  accountManager: {
    select: { id: true, fullName: true, employeeCode: true, email: true },
  },
};

export const clientRepository = {
  async create(data: CreateClientData) {
    return prisma.client.create({
      data,
      include: includeRelations,
    });
  },

  async findById(id: string, tenantId: string) {
    return prisma.client.findFirst({
      where: { id, tenantId },
      include: includeRelations,
    });
  },

  async findByPan(pan: string, tenantId: string) {
    return prisma.client.findFirst({
      where: { pan, tenantId },
      select: { id: true },
    });
  },

  async findByGstin(gstin: string, tenantId: string) {
    return prisma.client.findFirst({
      where: { gstin, tenantId },
      select: { id: true },
    });
  },

  async updateByIdAndTenant(id: string, tenantId: string, data: UpdateClientData) {
    const client = await prisma.client.findFirst({ where: { id, tenantId } });
    if (!client) return null;
    return prisma.client.update({
      where: { id },
      data,
      include: includeRelations,
    });
  },

  async updateStatus(id: string, tenantId: string, status: "active" | "inactive" | "archived") {
    const client = await prisma.client.findFirst({ where: { id, tenantId } });
    if (!client) return null;
    return prisma.client.update({
      where: { id },
      data: { status },
      include: includeRelations,
    });
  },

  async updateAccountManager(id: string, tenantId: string, accountManagerId: string | null) {
    const client = await prisma.client.findFirst({ where: { id, tenantId } });
    if (!client) return null;
    return prisma.client.update({
      where: { id },
      data: { accountManagerId },
      include: includeRelations,
    });
  },

  async list(params: ClientListParams) {
    const {
      tenantId, page, limit, sort, order,
      search, status, clientType, accountManagerId,
      state, country, createdFrom, createdTo, onboardedFrom, onboardedTo,
    } = params;

    const where: Record<string, unknown> = { tenantId };

    if (status) {
      where.status = status;
    } else {
      where.status = { not: "archived" };
    }

    if (clientType) where.clientType = clientType;
    if (accountManagerId) where.accountManagerId = accountManagerId;
    if (state) where.state = state;
    if (country) where.country = country;

    if (createdFrom || createdTo) {
      where.createdAt = {
        ...(createdFrom && { gte: createdFrom }),
        ...(createdTo && { lte: createdTo }),
      };
    }

    if (onboardedFrom || onboardedTo) {
      where.onboardingDate = {
        ...(onboardedFrom && { gte: onboardedFrom }),
        ...(onboardedTo && { lte: onboardedTo }),
      };
    }

    if (search) {
      where.OR = [
        { legalName: { contains: search, mode: "insensitive" } },
        { tradeName: { contains: search, mode: "insensitive" } },
        { clientCode: { contains: search, mode: "insensitive" } },
        { pan: { contains: search, mode: "insensitive" } },
        { gstin: { contains: search, mode: "insensitive" } },
        { primaryEmail: { contains: search, mode: "insensitive" } },
        { primaryPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.client.findMany({
        where: where as any,
        include: includeRelations,
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client.count({ where: where as any }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getNextClientCode(tenantId: string): Promise<string> {
    const last = await prisma.client.findFirst({
      where: { tenantId, clientCode: { startsWith: "CLI-" } },
      orderBy: { clientCode: "desc" },
      select: { clientCode: true },
    });

    if (!last) return "CLI-000001";

    const lastNum = parseInt(last.clientCode.split("-").pop() || "0", 10);
    return `CLI-${String(lastNum + 1).padStart(6, "0")}`;
  },
};
