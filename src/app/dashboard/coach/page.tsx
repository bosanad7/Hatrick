import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays, Users, CalendarCheck, BookOpen, Clock, ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { T } from "@/components/t";

async function getCoachData(userId: string) {
  try {
    const coach = await db.coach.findUnique({ where: { userId }, include: { user: true } });
    if (!coach) return null;

    const now   = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todaySessions,
      upcomingWeekSessions,
      myGroups,
      assessmentCount,
    ] = await Promise.all([
      db.trainingSession.findMany({
        where: {
          coachId: coach.id,
          startTime: { gte: todayStart, lte: todayEnd },
        },
        include: {
          group: {
            include: { _count: { select: { groupPlayers: true } } },
          },
        },
        orderBy: { startTime: "asc" },
      }),
      db.trainingSession.findMany({
        where: {
          coachId: coach.id,
          startTime: { gte: now, lte: weekEnd },
          status: "SCHEDULED",
        },
        select: { id: true },
      }),
      db.group.findMany({
        where: {
          sessions: { some: { coachId: coach.id } },
        },
        include: {
          _count: { select: { groupPlayers: true } },
        },
        orderBy: { name: "asc" },
      }),
      db.assessment.count({ where: { coachId: coach.id } }),
    ]);

    // Total players across assigned groups (unique via groupPlayers)
    const totalPlayers = myGroups.reduce(
      (acc, g) => acc + g._count.groupPlayers,
      0,
    );

    // Pending evaluations count
    const completedWithoutEval = await db.trainingSession.count({
      where: {
        coachId: coach.id,
        OR: [{ status: "COMPLETED" }, { endTime: { lt: now } }],
        evaluations: { none: {} },
      },
    });

    // Attendance rate this month for coach's sessions
    const [totalAttendance, presentAttendance] = await Promise.all([
      db.attendance.count({
        where: { session: { coachId: coach.id, startTime: { gte: monthStart } } },
      }),
      db.attendance.count({
        where: {
          session: { coachId: coach.id, startTime: { gte: monthStart } },
          status: "PRESENT",
        },
      }),
    ]);

    const attendanceRate = totalAttendance > 0
      ? Math.round((presentAttendance / totalAttendance) * 100)
      : null;

    // Sessions needing attendance today (no attendance records yet)
    const todayNeedingAttendance = await Promise.all(
      todaySessions.map(async (s) => {
        const count = await db.attendance.count({ where: { sessionId: s.id } });
        return count === 0 ? s : null;
      }),
    );
    const attendanceTodo = todayNeedingAttendance.filter(Boolean).length;

    return {
      coach,
      todaySessions,
      myGroups,
      totalPlayers,
      upcomingWeekCount: upcomingWeekSessions.length,
      assessmentCount,
      attendanceRate,
      attendanceTodo,
      pendingEvaluations: completedWithoutEval,
    };
  } catch { return null; }
}

export default async function CoachDashboardPage() {
  const session = await auth();
  const role    = (session?.user as { role?: Role })?.role;
  const userId  = (session?.user as { id?: string })?.id;
  if (!role || !([Role.ADMIN, Role.COACH] as Role[]).includes(role)) redirect("/dashboard/access-denied");

  const data      = userId ? await getCoachData(userId) : null;
  const coachName = session?.user?.name ?? "Coach";

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title={`Welcome, ${coachName.split(" ")[0]}`} subtitle="Your coaching dashboard" />
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {([
            {
              tKey: "my_groups" as const,
              value: data?.myGroups.length ?? 0,
              icon: Users,
              href:  "/dashboard/coach/groups",
              color: "#ffffff",
            },
            {
              tKey: "total_players" as const,
              value: data?.totalPlayers ?? 0,
              icon: Users,
              href:  "/dashboard/coach/groups",
              color: "#ffffff",
            },
            {
              tKey: "upcoming_sessions" as const,
              value: data?.upcomingWeekCount ?? 0,
              icon: CalendarDays,
              href:  "/dashboard/coach/sessions",
              color: "#cccccc",
            },
            {
              tKey: "attendance_rate" as const,
              value: data?.attendanceRate != null ? `${data.attendanceRate}%` : "—",
              icon: CalendarCheck,
              href:  "/dashboard/coach/attendance",
              color: "#10b981",
              isString: true,
            },
          ]).map((c) => (
            <Link key={c.tKey} href={c.href}>
              <Card className="card-brand cursor-pointer hover:scale-[1.01] transition-transform">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-xs font-medium uppercase tracking-wide"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        <T k={c.tKey} />
                      </p>
                      <p
                        className="mt-1 text-2xl font-bold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {c.value}
                      </p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: `${c.color}1a` }}>
                      <c.icon className="h-5 w-5" style={{ color: c.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Today's sessions */}
        <Card>
          <CardContent className="p-0">
            <div
              className="flex items-center justify-between border-b px-4 py-3"
              style={{ borderColor: "var(--border)" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--muted-foreground)" }}
              >
                <T k="todays_sessions" />
              </p>
              <Link
                href="/dashboard/coach/sessions"
                className="text-xs"
                style={{ color: "#cccccc" }}
              >
                <T k="view_all" />
              </Link>
            </div>
            {!data?.todaySessions.length ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                <T k="no_sessions_today" />
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {data.todaySessions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
                        style={{ background: "rgba(255,255,255,0.08)", color: "#cccccc" }}
                      >
                        {s.group.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {s.title}
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {s.group.name}
                          {" · "}
                          {s.pitch.replace("_", " ")}
                          {" · "}
                          {s.group._count.groupPlayers} players
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p
                          className="text-xs font-medium flex items-center gap-1"
                          style={{ color: "#cccccc" }}
                        >
                          <Clock className="h-2.5 w-2.5" />
                          {new Intl.DateTimeFormat("en-GB", {
                            hour: "2-digit", minute: "2-digit", hour12: false,
                          }).format(s.startTime)}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                          ends{" "}
                          {new Intl.DateTimeFormat("en-GB", {
                            hour: "2-digit", minute: "2-digit", hour12: false,
                          }).format(s.endTime)}
                        </p>
                      </div>
                      <Link
                        href="/dashboard/coach/attendance"
                        className="rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors"
                        style={{ background: "rgba(255,255,255,0.08)", color: "#cccccc" }}
                      >
                        Mark
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Assigned groups */}
          <Card>
            <CardContent className="p-0">
              <div
                className="flex items-center justify-between border-b px-4 py-3"
                style={{ borderColor: "var(--border)" }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <T k="my_groups" />
                </p>
                <Link
                  href="/dashboard/coach/groups"
                  className="text-xs"
                  style={{ color: "#cccccc" }}
                >
                  <T k="view_all" />
                </Link>
              </div>
              {!data?.myGroups.length ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                  <T k="no_data" />
                </p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {data.myGroups.map((g) => {
                    const pct = Math.round((g._count.groupPlayers / (g.maxCapacity || 20)) * 100);
                    return (
                      <li key={g.id} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="flex h-7 w-7 items-center justify-center rounded text-[11px] font-bold"
                              style={{
                                background: "rgba(26,58,143,0.15)",
                                color: "#cccccc",
                              }}
                            >
                              {g.name.charAt(0)}
                            </div>
                            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                              {g.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge>{g.ageGroup.replace("U", "U")}</Badge>
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                              {g._count.groupPlayers}/{g.maxCapacity}
                            </span>
                          </div>
                        </div>
                        {/* Capacity bar */}
                        <div
                          className="h-1.5 w-full overflow-hidden rounded-full"
                          style={{ background: "var(--muted)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(pct, 100)}%`,
                              background: pct >= 90 ? "#f87171" : pct >= 70 ? "#fbbf24" : "#cccccc",
                            }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Shortcut cards */}
          <div className="flex flex-col gap-4">
            {/* Mark attendance shortcut */}
            <Link href="/dashboard/coach/attendance">
              <Card className="cursor-pointer hover:scale-[1.01] transition-transform">
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: "rgba(16,185,129,0.12)" }}
                  >
                    <CalendarCheck className="h-5 w-5" style={{ color: "#34d399" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      <T k="attendance" />
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {data?.attendanceTodo
                        ? `${data.attendanceTodo} session${data.attendanceTodo > 1 ? "s" : ""} need attendance today`
                        : "All attendance up to date"}
                    </p>
                  </div>
                  {(data?.attendanceTodo ?? 0) > 0 && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: "rgba(16,185,129,0.15)", color: "#34d399" }}
                    >
                      {data!.attendanceTodo}
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>

            {/* Evaluate sessions shortcut */}
            <Link href="/dashboard/coach/evaluate">
              <Card className="cursor-pointer hover:scale-[1.01] transition-transform">
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <ClipboardList className="h-5 w-5" style={{ color: "#ffffff" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      <T k="evaluate_sessions" />
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {data?.pendingEvaluations
                        ? `${data.pendingEvaluations} session${data.pendingEvaluations !== 1 ? "s" : ""} pending evaluation`
                        : "All sessions evaluated"}
                    </p>
                  </div>
                  {(data?.pendingEvaluations ?? 0) > 0 && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: "rgba(255,255,255,0.15)", color: "#ffffff" }}
                    >
                      {data!.pendingEvaluations}
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>

            {/* Player notes shortcut */}
            <Link href="/dashboard/coach/notes">
              <Card className="cursor-pointer hover:scale-[1.01] transition-transform">
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: "rgba(245,158,11,0.12)" }}
                  >
                    <BookOpen className="h-5 w-5" style={{ color: "#fbbf24" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      <T k="evaluation" />
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {data?.assessmentCount
                        ? `${data.assessmentCount} assessment${data.assessmentCount !== 1 ? "s" : ""} recorded`
                        : "No assessments yet"}
                    </p>
                  </div>
                  {(data?.assessmentCount ?? 0) > 0 && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}
                    >
                      {data!.assessmentCount}
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
