import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PostponeForm } from "@/components/parent/postpone-form";
import { Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { T } from "@/components/t";

const statusConfig = {
  PENDING:  { label: "Pending",  icon: Loader2,     style: "text-[#aaaaaa]" },
  APPROVED: { label: "Approved", icon: CheckCircle,  style: "text-[#ffffff]" },
  REJECTED: { label: "Rejected", icon: XCircle,      style: "text-[#666666]" },
} as const;

async function getPostponeData(userId: string) {
  const parent = await db.parent.findUnique({ where: { userId } });
  if (!parent) return null;

  const [children, postponements, upcomingSessions] = await Promise.all([
    db.player.findMany({
      where: { parentId: parent.id, status: "ACTIVE" },
      include: {
        subscriptions: { where: { status: "ACTIVE" }, take: 1 },
      },
    }),
    db.sessionPostponement.findMany({
      where: { player: { parentId: parent.id } },
      include: { player: true, session: { include: { group: true } } },
      orderBy: { requestedAt: "desc" },
      take: 20,
    }),
    db.trainingSession.findMany({
      where: {
        status: "SCHEDULED",
        startTime: { gte: new Date() },
        group: { groupPlayers: { some: { player: { parentId: parent.id } } } },
      },
      include: { group: true },
      orderBy: { startTime: "asc" },
      take: 20,
    }),
  ]);

  return { children, postponements, upcomingSessions };
}

export default async function PostponePage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!role || !([Role.ADMIN, Role.PARENT] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const data = userId ? await getPostponeData(userId) : null;

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Session Postponement" subtitle="Request to postpone upcoming sessions (max 3 per subscription)" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Request form */}
        {data && data.children.length > 0 && data.upcomingSessions.length > 0 && (
          <PostponeForm
            children={data.children.map((c) => ({
              id: c.id,
              name: `${c.firstName} ${c.lastName}`,
              remaining: c.subscriptions[0]
                ? c.subscriptions[0].maxPostponements - c.subscriptions[0].usedPostponements
                : 0,
            }))}
            sessions={data.upcomingSessions.map((s) => ({
              id: s.id,
              title: `${s.title} — ${s.group.name}`,
              date: new Date(s.startTime).toLocaleDateString(),
            }))}
          />
        )}

        {/* History */}
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
              <T k="postpone" />
            </h3>
            {!data?.postponements.length ? (
              <div className="py-8 text-center">
                <Clock className="mx-auto mb-2 h-8 w-8" style={{ color: "var(--muted-foreground)" }} />
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}><T k="no_data" /></p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.postponements.map((p) => {
                  const sc = statusConfig[p.status as keyof typeof statusConfig] ?? statusConfig.PENDING;
                  const StatusIcon = sc.icon;
                  return (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {p.player.firstName} {p.player.lastName}
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {p.session?.title} · {new Date(p.requestedAt).toLocaleDateString()}
                        </p>
                        {p.reason && <p className="mt-1 text-xs italic" style={{ color: "var(--muted-foreground)" }}>{p.reason}</p>}
                      </div>
                      <Badge variant="outline" className={`gap-1 text-xs ${sc.style}`}>
                        <StatusIcon className="h-3 w-3" />
                        {sc.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
