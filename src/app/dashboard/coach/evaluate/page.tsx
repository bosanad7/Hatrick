import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Clock, MapPin, Users, CheckCircle } from "lucide-react";

async function getCoachSessions(userId: string) {
  try {
    const coach = await db.coach.findUnique({ where: { userId } });
    if (!coach) return { sessions: [], coachId: "" };

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await db.trainingSession.findMany({
      where: {
        coachId: coach.id,
        startTime: { gte: thirtyDaysAgo },
      },
      include: {
        group: { include: { _count: { select: { groupPlayers: true } } } },
        evaluations: { select: { id: true } },
      },
      orderBy: { startTime: "desc" },
    });

    return { sessions, coachId: coach.id };
  } catch {
    return { sessions: [], coachId: "" };
  }
}

export default async function EvaluateSessionsPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!role || !([Role.ADMIN, Role.COACH] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const { sessions } = userId ? await getCoachSessions(userId) : { sessions: [] };

  const now = new Date();
  const completedSessions = sessions.filter(
    (s) => s.status === "COMPLETED" || s.endTime < now
  );
  const pendingSessions = completedSessions.filter(
    (s) => s.evaluations.length === 0
  );
  const evaluatedSessions = completedSessions.filter(
    (s) => s.evaluations.length > 0
  );

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header
        title="Evaluate Sessions"
        subtitle={`${pendingSessions.length} session${pendingSessions.length !== 1 ? "s" : ""} pending evaluation`}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Pending evaluations */}
        {pendingSessions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
              Pending Evaluation
            </h2>
            {pendingSessions.map((s) => (
              <SessionCard key={s.id} session={s} isPending />
            ))}
          </div>
        )}

        {/* Already evaluated */}
        {evaluatedSessions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
              Already Evaluated
            </h2>
            {evaluatedSessions.map((s) => (
              <SessionCard key={s.id} session={s} isPending={false} />
            ))}
          </div>
        )}

        {completedSessions.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="mx-auto mb-4 h-10 w-10" style={{ color: "var(--muted-foreground)" }} />
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                No completed sessions to evaluate yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function SessionCard({
  session: s,
  isPending,
}: {
  session: {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    pitch: string;
    status: string;
    group: { name: string; _count: { groupPlayers: number } };
    evaluations: { id: string }[];
  };
  isPending: boolean;
}) {
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", opts).format(d);

  return (
    <Card className={isPending ? "border-l-2" : ""} style={isPending ? { borderLeftColor: "var(--foreground)" } : {}}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 flex-col items-center justify-center rounded-lg text-center"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <span className="text-[10px] font-medium uppercase" style={{ color: "var(--muted-foreground)" }}>
              {fmt(s.startTime, { month: "short" })}
            </span>
            <span className="text-lg font-bold leading-none" style={{ color: "var(--foreground)" }}>
              {fmt(s.startTime, { day: "2-digit" })}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{s.title}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{s.group.name} ({s.group._count.groupPlayers})</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.pitch.replace("_", " ")}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {fmt(s.startTime, { hour: "2-digit", minute: "2-digit", hour12: false })} – {fmt(s.endTime, { hour: "2-digit", minute: "2-digit", hour12: false })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isPending && (
            <Badge variant="outline" className="gap-1 text-xs">
              <CheckCircle className="h-3 w-3" /> {s.evaluations.length} evals
            </Badge>
          )}
          <Link href={`/dashboard/coach/evaluate/${s.id}`}>
            <Button size="sm" variant={isPending ? "default" : "outline"}>
              {isPending ? "Evaluate" : "View / Edit"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
