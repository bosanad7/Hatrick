import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getAge, formatDate } from "@/lib/utils";
import { averageEvaluations, computeOverall, ratingLabel, mapToCardStat } from "@/lib/player-rating";
import { Calendar, CreditCard, Star, TrendingUp, User } from "lucide-react";

async function getChildData(playerId: string, userId: string) {
  const parent = await db.parent.findUnique({ where: { userId } });
  if (!parent) return null;

  const player = await db.player.findUnique({
    where: { id: playerId, parentId: parent.id },
    include: {
      subscriptions: { orderBy: { createdAt: "desc" }, take: 3 },
      evaluations: { orderBy: { createdAt: "desc" }, take: 10 },
      groupPlayers: { include: { group: true } },
    },
  });

  return player;
}

const STAT_LABELS = [
  { key: "discipline" as const, short: "DIS", label: "Discipline" },
  { key: "technical" as const, short: "TEC", label: "Technical" },
  { key: "tactical" as const, short: "TAC", label: "Tactical" },
  { key: "fitness" as const, short: "FIT", label: "Fitness" },
  { key: "teamwork" as const, short: "TWK", label: "Teamwork" },
];

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!role || !([Role.ADMIN, Role.PARENT] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const { id } = await params;
  const player = userId ? await getChildData(id, userId) : null;
  if (!player) notFound();

  const evalStats = averageEvaluations(player.evaluations);
  const overall = computeOverall(evalStats);
  const label = ratingLabel(overall);
  const activeSub = player.subscriptions.find((s) => s.status === "ACTIVE");

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header
        title={`${player.firstName} ${player.lastName}`}
        subtitle={`${player.ageGroup} · ${player.playerType} · #${player.jerseyNumber ?? "—"}`}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* FIFA Card */}
          <Card className="lg:col-span-1">
            <CardContent className="flex flex-col items-center p-6">
              <div className="w-full max-w-[220px] rounded-2xl border p-5 space-y-3"
                style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)", borderColor: "rgba(255,255,255,0.12)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-4xl font-black leading-none" style={{ color: "var(--foreground)" }}>{overall}</p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
                      {player.position || (player.playerType === "GOALKEEPER" ? "GK" : "MID")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{player.ageGroup}</p>
                    {player.jerseyNumber && <p className="text-lg font-black" style={{ color: "rgba(255,255,255,0.2)" }}>#{player.jerseyNumber}</p>}
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black"
                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))", color: "var(--foreground)", border: "2px solid rgba(255,255,255,0.15)" }}>
                    {player.firstName[0]}{player.lastName[0]}
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-base font-black uppercase tracking-wide" style={{ color: "var(--foreground)" }}>{player.lastName}</p>
                  <p className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>{player.firstName} · {label}</p>
                </div>

                <div className="border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <div className="grid grid-cols-5 gap-2">
                    {STAT_LABELS.map(({ key, short }) => (
                      <div key={key} className="text-center">
                        <p className="text-base font-black" style={{ color: "var(--foreground)" }}>{mapToCardStat(evalStats[key])}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>{short}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                Based on {player.evaluations.length} evaluation{player.evaluations.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          {/* Player Info + Subscription */}
          <div className="space-y-6 lg:col-span-2">
            {/* Info */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Player Info</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { icon: User, label: "Age", value: `${getAge(player.dateOfBirth)} years` },
                    { icon: Calendar, label: "Enrolled", value: formatDate(player.enrollmentDate) },
                    { icon: Star, label: "Status", value: player.status },
                    { icon: TrendingUp, label: "Groups", value: player.groupPlayers.map((g) => g.group.name).join(", ") || "None" },
                  ].map(({ icon: Icon, label: l, value }) => (
                    <div key={l}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="h-3 w-3" style={{ color: "var(--muted-foreground)" }} />
                        <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>{l}</p>
                      </div>
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Subscription */}
            {activeSub ? (
              <Card>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Active Subscription</h3>
                    <Badge variant="outline">{activeSub.type.replace(/_/g, " ")}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Sessions Used</p>
                      <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                        {activeSub.usedSessions}/{activeSub.totalSessions ?? "∞"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Postponements</p>
                      <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                        {activeSub.usedPostponements}/{activeSub.maxPostponements}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Expires</p>
                      <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                        {new Date(activeSub.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  {activeSub.totalSessions && (
                    <div>
                      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full" style={{
                          width: `${Math.min(100, (activeSub.usedSessions / activeSub.totalSessions) * 100)}%`,
                          background: "var(--foreground)",
                        }} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-5 text-center">
                  <CreditCard className="mx-auto mb-2 h-8 w-8" style={{ color: "var(--muted-foreground)" }} />
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No active subscription</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Evaluations */}
        {player.evaluations.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Recent Evaluations</h3>
                <Link href={`/dashboard/parent/children/${player.id}/development`}>
                  <Button variant="ghost" size="sm">View Progress</Button>
                </Link>
              </div>
              <div className="space-y-3">
                {player.evaluations.slice(0, 5).map((ev) => {
                  const avg = Math.round((ev.discipline + ev.technical + ev.tactical + ev.fitness + ev.teamwork) / 5 * 10) / 10;
                  return (
                    <div key={ev.id} className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          Session Evaluation
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {new Date(ev.createdAt).toLocaleDateString()} · {ev.attendance}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="grid grid-cols-5 gap-2 text-center">
                          {STAT_LABELS.map(({ key, short }) => (
                            <div key={key}>
                              <p className="text-xs font-bold" style={{ color: "var(--foreground)" }}>{ev[key]}</p>
                              <p className="text-[8px] uppercase" style={{ color: "var(--muted-foreground)" }}>{short}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                          style={{ background: "rgba(255,255,255,0.08)", color: "var(--foreground)" }}>
                          {avg}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
