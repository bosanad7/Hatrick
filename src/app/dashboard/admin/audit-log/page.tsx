import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { ACTION_LABELS } from "@/lib/audit";
import { AuditLogContent } from "@/components/admin/audit-log-content";

async function getAuditLogs(page: number, search?: string) {
  const limit = 50;
  const where = search
    ? {
        OR: [
          { action: { contains: search } },
          { entity: { contains: search } },
          { details: { contains: search } },
        ],
      }
    : {};

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  return { logs, total, totalPages: Math.ceil(total / limit) };
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (role !== Role.ADMIN) redirect("/dashboard/access-denied");

  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const search = params.search ?? undefined;
  const { logs, total, totalPages } = await getAuditLogs(page, search);

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Audit Log" subtitle={`${total} total entries`} />

      <AuditLogContent
        logs={logs.map((log) => ({
          id: log.id,
          action: log.action,
          entity: log.entity,
          entityId: log.entityId,
          details: log.details,
          createdAt: log.createdAt.toISOString(),
          user: log.user
            ? { id: log.user.id, name: log.user.name, email: log.user.email, role: log.user.role }
            : null,
        }))}
        total={total}
        totalPages={totalPages}
        page={page}
        search={search}
        actionLabels={ACTION_LABELS}
      />
    </div>
  );
}
