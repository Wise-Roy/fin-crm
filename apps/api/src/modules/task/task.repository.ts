import { prisma } from "@repo/db";

export interface CreateTaskData {
  tenantId: string;
  taskCode: string;
  title: string;
  description?: string;
  clientId?: string;
  assignedTo?: string;
  assignedBy?: string;
  priority?: "low" | "medium" | "high" | "critical";
  category?: string;
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  createdBy?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  clientId?: string | null;
  priority?: "low" | "medium" | "high" | "critical";
  category?: string | null;
  startDate?: Date | null;
  dueDate?: Date | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
}

export interface TaskListParams {
  tenantId: string;
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  clientId?: string;
  createdBy?: string;
  dueFrom?: Date;
  dueTo?: Date;
  createdFrom?: Date;
  createdTo?: Date;
}

const includeRelations = {
  client: { select: { id: true, legalName: true, clientCode: true } },
  assignee: { select: { id: true, fullName: true, employeeCode: true, email: true } },
  assigner: { select: { id: true, fullName: true, employeeCode: true } },
};

export const taskRepository = {
  async create(data: CreateTaskData) {
    return prisma.task.create({
      data,
      include: includeRelations,
    });
  },

  async findById(id: string, tenantId: string) {
    return prisma.task.findFirst({
      where: { id, tenantId },
      include: includeRelations,
    });
  },

  async updateByIdAndTenant(id: string, tenantId: string, data: Record<string, unknown>) {
    const task = await prisma.task.findFirst({ where: { id, tenantId } });
    if (!task) return null;
    return prisma.task.update({
      where: { id },
      data,
      include: includeRelations,
    });
  },

  async list(params: TaskListParams) {
    const {
      tenantId, page, limit, sort, order,
      search, status, priority, category,
      assignedTo, clientId, createdBy,
      dueFrom, dueTo, createdFrom, createdTo,
    } = params;

    const where: Record<string, unknown> = { tenantId };

    if (status) {
      where.status = status;
    } else {
      where.status = { not: "cancelled" };
    }

    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (assignedTo) where.assignedTo = assignedTo;
    if (clientId) where.clientId = clientId;
    if (createdBy) where.createdBy = createdBy;

    if (dueFrom || dueTo) {
      where.dueDate = {
        ...(dueFrom && { gte: dueFrom }),
        ...(dueTo && { lte: dueTo }),
      };
    }

    if (createdFrom || createdTo) {
      where.createdAt = {
        ...(createdFrom && { gte: createdFrom }),
        ...(createdTo && { lte: createdTo }),
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { taskCode: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where: where as any,
        include: includeRelations,
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where: where as any }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getNextTaskCode(tenantId: string): Promise<string> {
    const last = await prisma.task.findFirst({
      where: { tenantId, taskCode: { startsWith: "TASK-" } },
      orderBy: { taskCode: "desc" },
      select: { taskCode: true },
    });

    if (!last) return "TASK-000001";
    const lastNum = parseInt(last.taskCode.split("-").pop() || "0", 10);
    return `TASK-${String(lastNum + 1).padStart(6, "0")}`;
  },

  async findByAssignee(employeeId: string, tenantId: string, params: { page: number; limit: number; sort: string; order: "asc" | "desc"; status?: string }) {
    const where: Record<string, unknown> = { tenantId, assignedTo: employeeId };
    if (params.status) {
      where.status = params.status;
    } else {
      where.status = { notIn: ["cancelled"] };
    }

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where: where as any,
        include: includeRelations,
        orderBy: { [params.sort]: params.order },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.task.count({ where: where as any }),
    ]);

    return { items, total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) };
  },
};
