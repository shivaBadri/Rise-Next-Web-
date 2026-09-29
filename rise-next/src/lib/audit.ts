import { prisma } from "./db";
import type { SessionUser } from "./auth";

export async function audit(opts: {
  user: SessionUser | null;
  projectId?: string | null;
  entity: string;
  entityId: string;
  entityLabel?: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "PUBLISH" | "ASSIGN";
  before?: unknown;
  after?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      projectId: opts.projectId ?? undefined,
      userId: opts.user?.id,
      userName: opts.user?.name ?? "system",
      entity: opts.entity,
      entityId: opts.entityId,
      entityLabel: opts.entityLabel,
      action: opts.action,
      before: opts.before as never,
      after: opts.after as never,
    },
  });
}
