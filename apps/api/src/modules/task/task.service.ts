import { taskRepository, type UpdateTaskData } from './task.repository.js';
import { employeeRepository } from '../employee/employee.repository.js';
import { clientRepository } from '../client/client.repository.js';
import { ServiceError } from '../tenant/tenant.service.js';

interface CreateTaskInput {
  title: string;
  description?: string;
  clientId?: string;
  assignedTo?: string;
  priority?: "low" | "medium" | "high" | "critical";
  category?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
}

interface ListTasksInput {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  clientId?: string;
  createdBy?: string;
  dueFrom?: string;
  dueTo?: string;
  createdFrom?: string;
  createdTo?: string;
}

/**
 * Valid status transitions.
 * Key = current status, value = allowed next statuses.
 */
const STATUS_TRANSITIONS: Record<string, string[]> = {
  todo: ["in_progress", "cancelled"],
  in_progress: ["blocked", "review", "completed", "cancelled"],
  blocked: ["in_progress", "cancelled"],
  review: ["in_progress", "completed", "cancelled"],
  completed: [], // no going back
  cancelled: [], // terminal
};

const VALID_SORT_FIELDS = ["title", "taskCode", "priority", "status", "dueDate", "createdAt", "updatedAt"];

export const taskService = {
  async create(tenantId: string, input: CreateTaskInput, createdByUserId?: string) {
    if (!input.title?.trim()) throw new ServiceError(400, "title is required");

    const startDate = input.startDate ? new Date(input.startDate) : undefined;
    const dueDate = input.dueDate ? new Date(input.dueDate) : undefined;

    if (startDate && dueDate && dueDate < startDate) {
      throw new ServiceError(400, "Due date cannot be before start date");
    }

    // Validate client
    if (input.clientId) {
      const client = await clientRepository.findById(input.clientId, tenantId);
      if (!client) throw new ServiceError(400, "Client not found in this organization");
      if (client.status === "archived") throw new ServiceError(400, "Cannot assign task to archived client");
    }

    // Validate assignee
    let assignedBy: string | undefined;
    if (input.assignedTo) {
      const assignee = await employeeRepository.findById(input.assignedTo, tenantId);
      if (!assignee) throw new ServiceError(400, "Assigned employee not found in this organization");
      if (assignee.status !== "active") throw new ServiceError(400, "Cannot assign task to inactive employee");
      assignedBy = createdByUserId;
    }

    // Resolve createdBy employee ID
    let createdByEmployeeId: string | undefined;
    if (createdByUserId) {
      const creator = await employeeRepository.findByUserId(createdByUserId, tenantId);
      if (creator) createdByEmployeeId = creator.id;
    }

    const taskCode = await taskRepository.getNextTaskCode(tenantId);

    return taskRepository.create({
      tenantId,
      taskCode,
      title: input.title.trim(),
      description: input.description?.trim(),
      clientId: input.clientId,
      assignedTo: input.assignedTo,
      assignedBy: assignedBy ? createdByEmployeeId : undefined,
      priority: input.priority,
      category: input.category,
      startDate,
      dueDate,
      estimatedHours: input.estimatedHours,
      createdBy: createdByEmployeeId,
    });
  },

  async getById(id: string, tenantId: string) {
    const task = await taskRepository.findById(id, tenantId);
    if (!task) throw new ServiceError(404, "Task not found");
    return task;
  },

  async update(id: string, tenantId: string, input: UpdateTaskData) {
    const task = await taskRepository.findById(id, tenantId);
    if (!task) throw new ServiceError(404, "Task not found");

    if (task.status === "cancelled") throw new ServiceError(400, "Cannot update cancelled task");

    if (input.title !== undefined && !input.title?.trim()) {
      throw new ServiceError(400, "title cannot be empty");
    }

    // Validate dates
    const startDate = input.startDate !== undefined ? input.startDate : task.startDate;
    const dueDate = input.dueDate !== undefined ? input.dueDate : task.dueDate;
    if (startDate && dueDate && dueDate < startDate) {
      throw new ServiceError(400, "Due date cannot be before start date");
    }

    // Validate client change
    if (input.clientId) {
      const client = await clientRepository.findById(input.clientId, tenantId);
      if (!client) throw new ServiceError(400, "Client not found in this organization");
      if (client.status === "archived") throw new ServiceError(400, "Cannot assign task to archived client");
    }

    return taskRepository.updateByIdAndTenant(id, tenantId, input as Record<string, unknown>);
  },

  async updateStatus(id: string, tenantId: string, newStatus: string) {
    const validStatuses = Object.keys(STATUS_TRANSITIONS);
    if (!validStatuses.includes(newStatus)) {
      throw new ServiceError(400, `Invalid status. Must be: ${validStatuses.join(", ")}`);
    }

    const task = await taskRepository.findById(id, tenantId);
    if (!task) throw new ServiceError(404, "Task not found");

    const allowed = STATUS_TRANSITIONS[task.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new ServiceError(409, `Cannot transition from "${task.status}" to "${newStatus}"`);
    }

    const data: Record<string, unknown> = { status: newStatus };
    if (newStatus === "completed") {
      data.completedAt = new Date();
    }

    return taskRepository.updateByIdAndTenant(id, tenantId, data);
  },

  async assign(id: string, tenantId: string, assignedTo: string, assignedByUserId?: string) {
    const task = await taskRepository.findById(id, tenantId);
    if (!task) throw new ServiceError(404, "Task not found");

    if (task.status === "completed" || task.status === "cancelled") {
      throw new ServiceError(400, `Cannot reassign a ${task.status} task`);
    }

    const assignee = await employeeRepository.findById(assignedTo, tenantId);
    if (!assignee) throw new ServiceError(400, "Employee not found in this organization");
    if (assignee.status !== "active") throw new ServiceError(400, "Cannot assign task to inactive employee");

    let assignedByEmployeeId: string | undefined;
    if (assignedByUserId) {
      const assigner = await employeeRepository.findByUserId(assignedByUserId, tenantId);
      if (assigner) assignedByEmployeeId = assigner.id;
    }

    return taskRepository.updateByIdAndTenant(id, tenantId, {
      assignedTo,
      assignedBy: assignedByEmployeeId,
    });
  },

  async softDelete(id: string, tenantId: string) {
    const task = await taskRepository.findById(id, tenantId);
    if (!task) throw new ServiceError(404, "Task not found");
    return taskRepository.updateByIdAndTenant(id, tenantId, { status: "cancelled" });
  },

  async list(tenantId: string, input: ListTasksInput) {
    const page = Math.max(1, input.page || 1);
    const limit = Math.min(100, Math.max(1, input.limit || 20));
    const sort = VALID_SORT_FIELDS.includes(input.sort || "") ? input.sort! : "createdAt";
    const order = input.order === "asc" ? "asc" : "desc";

    return taskRepository.list({
      tenantId,
      page,
      limit,
      sort,
      order,
      search: input.search,
      status: input.status,
      priority: input.priority,
      category: input.category,
      assignedTo: input.assignedTo,
      clientId: input.clientId,
      createdBy: input.createdBy,
      dueFrom: input.dueFrom ? new Date(input.dueFrom) : undefined,
      dueTo: input.dueTo ? new Date(input.dueTo) : undefined,
      createdFrom: input.createdFrom ? new Date(input.createdFrom) : undefined,
      createdTo: input.createdTo ? new Date(input.createdTo) : undefined,
    });
  },

  async myTasks(userId: string, tenantId: string, input: { page?: number; limit?: number; sort?: string; order?: "asc" | "desc"; status?: string }) {
    const employee = await employeeRepository.findByUserId(userId, tenantId);
    if (!employee) throw new ServiceError(404, "Employee profile not found");

    const page = Math.max(1, input.page || 1);
    const limit = Math.min(100, Math.max(1, input.limit || 20));
    const sort = VALID_SORT_FIELDS.includes(input.sort || "") ? input.sort! : "dueDate";
    const order = input.order === "asc" ? "asc" : "desc";

    return taskRepository.findByAssignee(employee.id, tenantId, { page, limit, sort, order, status: input.status });
  },
};
