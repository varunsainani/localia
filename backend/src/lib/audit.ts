import prisma from "./prisma";

// Best-effort audit logging: never let an audit write break the main request.
export async function logAudit(entry: {
  actorId?: string | null;
  action: string;
  targetId?: string | null;
  meta?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        targetId: entry.targetId ?? null,
        meta: entry.meta as never,
      },
    });
  } catch (err) {
    console.error("audit log failed:", (err as Error).message);
  }
}
