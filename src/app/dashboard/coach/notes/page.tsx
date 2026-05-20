import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Star } from "lucide-react";
import { T } from "@/components/t";

async function getEvaluations(userId: string) {
  try {
    const coach = await db.coach.findUnique({ where: { userId } });
    if (!coach) return [];

    return await db.evaluation.findMany({
      where: { coachId: coach.id },
      include: {
        player: true,
        session: { include: { group: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch {
    return [];
  }
}

const SCORE_LABELS = ["discipline", "technical", "tactical", "fitness", "teamwork"] as const;

export default async function CoachEvaluationsPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!role || !([Role.ADMIN, Role.COACH] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const evaluations = userId ? await getEvaluations(userId) : [];

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Evaluation History" subtitle={`${evaluations.length} evaluations recorded`} />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {evaluations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="mx-auto mb-4 h-10 w-10" style={{ color: "var(--muted-foreground)" }} />
              <p className="font-semibold" style={{ color: "var(--foreground)" }}><T k="no_evaluations" /></p>
              <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
                Complete a session and submit evaluations to see them here.
              </p>
            </CardContent>
          </Card>
        ) : (
          evaluations.map((ev) => {
            const avg = Math.round(
              (ev.discipline + ev.technical + ev.tactical + ev.fitness + ev.teamwork) / 5 * 10
            ) / 10;

            return (
              <Card key={ev.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                      >
                        {ev.player.firstName[0]}{ev.player.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                          {ev.player.firstName} {ev.player.lastName}
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {ev.session?.group?.name ?? "—"} · {ev.player.ageGroup} · {new Date(ev.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5" style={{ color: "var(--foreground)" }} />
                        <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{avg}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{ev.attendance}</Badge>
                    </div>
                  </div>

                  {/* Score bars */}
                  <div className="mt-3 grid grid-cols-5 gap-3">
                    {SCORE_LABELS.map((key) => {
                      const val = ev[key];
                      return (
                        <div key={key} className="text-center">
                          <div className="mx-auto mb-1 h-1 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${val * 10}%`,
                                background: val >= 8 ? "#ffffff" : val >= 5 ? "#aaaaaa" : "#666666",
                              }}
                            />
                          </div>
                          <p className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>
                            <T k={key} />
                          </p>
                          <p className="text-xs font-bold" style={{ color: "var(--foreground)" }}>{val}</p>
                        </div>
                      );
                    })}
                  </div>

                  {(ev.notes || ev.recommendation) && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t pt-2" style={{ borderColor: "var(--border)" }}>
                      {ev.recommendation && (
                        <Badge variant="outline" className="text-[10px]">
                          <T k="recommendation" />
                        </Badge>
                      )}
                      {ev.notes && (
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {ev.notes}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
