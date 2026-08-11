import { prisma } from "@repo/db";

/**
 * Create a notification for a specific user.
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function notify(params: {
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  taskId?: string | null;
}): Promise<void> {
  try {
    await prisma.notifications.create({
      data: {
        tenant_id: params.tenantId,
        user_id: params.userId,
        title: params.title,
        message: params.message,
        task_id: params.taskId || null,
      },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

/**
 * Notify all users with a given role in a tenant.
 */
export async function notifyRole(params: {
  tenantId: string;
  roles: string[];
  title: string;
  message: string;
  taskId?: string | null;
  excludeUserId?: string;
}): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      where: {
        tenantId: params.tenantId,
        role: { in: params.roles as any },
        is_active: true,
        ...(params.excludeUserId ? { id: { not: params.excludeUserId } } : {}),
      },
      select: { id: true },
    });

    if (users.length === 0) return;

    await prisma.notifications.createMany({
      data: users.map((u) => ({
        tenant_id: params.tenantId,
        user_id: u.id,
        title: params.title,
        message: params.message,
        task_id: params.taskId || null,
      })),
    });
  } catch (err) {
    console.error("Failed to create role notifications:", err);
  }
}
