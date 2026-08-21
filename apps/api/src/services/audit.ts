import { prisma } from "../lib/prisma.js";

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId || null,
        action: entry.action,
        resource: entry.resource || null,
        resourceId: entry.resourceId || null,
        details: entry.details || undefined,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
      },
    });
  } catch (err) {
    // Don't let audit logging failures break the main flow
    console.error("[AUDIT] Failed to write audit log:", err);
  }
}

export async function getAuditLogs(params: {
  userId?: string;
  action?: string;
  resource?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  if (params.userId) where.userId = params.userId;
  if (params.action) where.action = params.action;
  if (params.resource) where.resource = params.resource;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: params.limit || 50,
      skip: params.offset || 0,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}
