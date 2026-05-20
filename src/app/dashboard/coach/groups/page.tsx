import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { T } from "@/components/t";

async function getCoachGroups(userId: string) {
  try {
    const coach = await db.coach.findUnique({ where: { userId } });
    if (!coach) return [];
    const sessionGroups = await db.trainingSession.findMany({
      where: { coachId: coach.id },
      select: { groupId: true },
      distinct: ["groupId"],
    });
    const groupIds = sessionGroups.map(s => s.groupId);
    return await db.group.findMany({
      where: { id: { in: groupIds } },
      include: {
        _count: { select: { groupPlayers: true } },
        groupPlayers: { include: { player: true }, take: 5 },
      },
    });
  } catch { return []; }
}

export default async function CoachGroupsPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!role || !([ Role.ADMIN, Role.COACH] as Role[]).includes(role)) redirect("/dashboard/access-denied");
  const groups = userId ? await getCoachGroups(userId) : [];

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="My Groups" subtitle={`${groups.length} group${groups.length !== 1 ? "s" : ""} assigned`} />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {groups.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-[var(--muted-foreground)]"><T k="no_data" /></p>
          </div>
        ) : groups.map(g => (
          <Card key={g.id} className="card-brand">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.1)] text-sm font-bold text-[#cccccc]">
                    {g.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: "var(--foreground)" }}>{g.name}</p>
                    {g.description && <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{g.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{g.ageGroup.replace("U","Under ")}</Badge>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{g._count.groupPlayers}/{g.maxCapacity} players</span>
                </div>
              </div>
              {g.groupPlayers.length > 0 && (
                <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}><T k="players" /></p>
                  <div className="flex flex-wrap gap-2">
                    {g.groupPlayers.map(gp => (
                      <span key={gp.player.id} className="rounded-full px-2.5 py-1 text-xs"
                        style={{ background: "rgba(26,58,143,0.1)", color: "var(--foreground)" }}>
                        {gp.player.firstName} {gp.player.lastName}
                      </span>
                    ))}
                    {g._count.groupPlayers > 5 && (
                      <span className="rounded-full px-2.5 py-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        +{g._count.groupPlayers - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
