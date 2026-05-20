import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Baby, CalendarDays, CreditCard, CheckSquare,
  AlertCircle, Clock, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { T } from "@/components/t";

async function getParentData(userId: string) {
  try {
    const parent = await db.parent.findUnique({ where: { userId }, include: { user: true } });
    if (!parent) return null;

    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [children, payments, upcomingSessions, monthAttendance, announcements] = await Promise.all([
      db.player.findMany({ where: { parentId: parent.id }, orderBy: { firstName: "asc" } }),
      db.payment.findMany({
        where: { parentId: parent.id },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
        take: 6,
      }),
      db.trainingSession.findMany({
        where: {
          status: "SCHEDULED",
          startTime: { gte: now, lte: sevenDaysLater },
          group: { groupPlayers: { some: { player: { parentId: parent.id } } } },
        },
        include: { group: true, coach: { include: { user: true } } },
        orderBy: { startTime: "asc" },
        take: 5,
      }),
      db.attendance.findMany({
        where: {
          player: { parentId: parent.id },
          createdAt: { gte: monthStart },
        },
        select: { status: true },
      }),
      db.announcement.findMany({
        where: { target: { in: ["ALL", "PARENTS"] } },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: 3,
      }),
    ]);

    const overdueCount = payments.filter((p) => p.status === "OVERDUE").length;
    const pendingCount = payments.filter((p) => p.status === "PENDING").length;
    const paidCount    = payments.filter((p) => p.status === "PAID").length;

    const presentCount = monthAttendance.filter((a) => a.status === "PRESENT").length;
    const absentCount  = monthAttendance.filter((a) => a.status === "ABSENT").length;
    const lateCount    = monthAttendance.filter((a) => a.status === "LATE").length;
    const totalAttendance = monthAttendance.length;
    const attendancePct = totalAttendance > 0
      ? Math.round((presentCount / totalAttendance) * 100)
      : null;

    return {
      parent, children, payments, upcomingSessions, announcements,
      overdueCount, pendingCount, paidCount,
      presentCount, absentCount, lateCount, totalAttendance, attendancePct,
    };
  } catch { return null; }
}

export default async function ParentDashboardPage() {
  const session = await auth();
  const role    = (session?.user as { role?: Role })?.role;
  const userId  = (session?.user as { id?: string })?.id;
  if (!role || !([Role.ADMIN, Role.PARENT] as Role[]).includes(role)) redirect("/dashboard/access-denied");

  const data       = userId ? await getParentData(userId) : null;
  const parentName = session?.user?.name ?? "Parent";

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title={`Hello, ${parentName.split(" ")[0]}`} subtitle="Your children's academy overview" />
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Overdue alert banner */}
        {(data?.overdueCount ?? 0) > 0 && (
          <div
            className="flex items-center gap-3 rounded-xl border px-4 py-3"
            style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <p className="text-sm" style={{ color: "var(--foreground)" }}>
              You have{" "}
              <strong>{data?.overdueCount} overdue payment{(data?.overdueCount ?? 0) > 1 ? "s" : ""}</strong>{" "}
              that need attention.{" "}
              <Link href="/dashboard/parent/payments" className="ml-1 underline text-red-400">
                View payments
              </Link>
            </p>
          </div>
        )}

        {/* KPI stats row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {([
            {
              tKey: "my_children" as const,
              value: data?.children.length ?? 0,
              icon: Baby,
              href:  "/dashboard/parent/children",
              color: "#ffffff",
            },
            {
              tKey: "upcoming_sessions" as const,
              value: data?.upcomingSessions.length ?? 0,
              icon: CalendarDays,
              href:  "/dashboard/parent/schedule",
              color: "#ffffff",
            },
            {
              tKey: "pending" as const,
              value: `${data?.pendingCount ?? 0} / ${data?.overdueCount ?? 0}`,
              icon: CreditCard,
              href:  "/dashboard/parent/payments",
              color: (data?.overdueCount ?? 0) > 0 ? "#ef4444" : "#f59e0b",
              isString: true,
            },
            {
              tKey: "attendance_rate" as const,
              value: data?.attendancePct != null ? `${data.attendancePct}%` : "—",
              icon: CheckSquare,
              href:  "/dashboard/parent/attendance",
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

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Child profile cards */}
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
                  <T k="my_children" />
                </p>
                <Link
                  href="/dashboard/parent/children"
                  className="text-xs"
                  style={{ color: "#cccccc" }}
                >
                  <T k="view_all" />
                </Link>
              </div>
              {!data?.children.length ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                  No children linked to your account yet.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {data.children.map((c) => (
                    <li key={c.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: "var(--primary)" }}
                        >
                          {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                        </div>
                        <div>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: "var(--foreground)" }}
                          >
                            {c.firstName} {c.lastName}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {c.ageGroup.replace("U", "Under ")}
                            {c.position ? ` · ${c.position}` : ""}
                            {c.jerseyNumber ? ` · #${c.jerseyNumber}` : ""}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={c.status === "ACTIVE" ? "default" : "secondary"}
                      >
                        {c.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Upcoming training sessions (next 7 days) */}
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
                  <T k="upcoming_sessions" />
                </p>
                <Link
                  href="/dashboard/parent/schedule"
                  className="text-xs"
                  style={{ color: "#cccccc" }}
                >
                  <T k="view_all" />
                </Link>
              </div>
              {!data?.upcomingSessions.length ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                  No upcoming sessions in the next 7 days.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {data.upcomingSessions.map((s) => (
                    <li key={s.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {s.title}
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {s.group.name}
                          {s.coach?.user?.name ? ` · Coach ${s.coach.user.name.split(" ")[0]}` : ""}
                          {" · "}
                          {s.pitch.replace("_", " ")}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-xs font-medium" style={{ color: "#cccccc" }}>
                          {new Intl.DateTimeFormat("en-GB", {
                            weekday: "short", day: "2-digit", month: "short",
                          }).format(s.startTime)}
                        </p>
                        <p className="text-xs flex items-center gap-0.5 justify-end" style={{ color: "var(--muted-foreground)" }}>
                          <Clock className="h-2.5 w-2.5" />
                          {new Intl.DateTimeFormat("en-GB", {
                            hour: "2-digit", minute: "2-digit", hour12: false,
                          }).format(s.startTime)}
                          {" – "}
                          {new Intl.DateTimeFormat("en-GB", {
                            hour: "2-digit", minute: "2-digit", hour12: false,
                          }).format(s.endTime)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Payment status summary */}
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
                  <T k="payments" />
                </p>
                <Link
                  href="/dashboard/parent/payments"
                  className="text-xs"
                  style={{ color: "#cccccc" }}
                >
                  <T k="view_all" />
                </Link>
              </div>

              {/* Summary pills */}
              <div className="flex gap-3 px-4 pt-4 pb-3">
                {[
                  { tKey: "paid" as const,    count: data?.paidCount ?? 0,    bg: "rgba(16,185,129,0.12)",  color: "#34d399" },
                  { tKey: "pending" as const, count: data?.pendingCount ?? 0,  bg: "rgba(245,158,11,0.12)",  color: "#fbbf24" },
                  { tKey: "overdue" as const, count: data?.overdueCount ?? 0, bg: "rgba(239,68,68,0.12)",   color: "#f87171" },
                ].map((p) => (
                  <div
                    key={p.tKey}
                    className="flex flex-1 flex-col items-center rounded-xl py-3"
                    style={{ background: p.bg }}
                  >
                    <span className="text-lg font-bold" style={{ color: p.color }}>{p.count}</span>
                    <span className="text-[10px] font-medium" style={{ color: p.color }}><T k={p.tKey} /></span>
                  </div>
                ))}
              </div>

              {/* Most recent payments */}
              {data?.payments.length ? (
                <ul className="divide-y divide-[var(--border)]">
                  {data.payments.slice(0, 3).map((p) => (
                    <li key={p.id} className="flex items-center justify-between px-4 py-2.5">
                      <div>
                        <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                          {p.type.charAt(0) + p.type.slice(1).toLowerCase()} Fee
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                          Due{" "}
                          {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(p.dueDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                          {formatCurrency(p.amount, p.currency)}
                        </span>
                        <Badge
                          variant={
                            p.status === "PAID"    ? "default" :
                            p.status === "OVERDUE" ? "destructive" : "warning"
                          }
                        >
                          {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-4 text-center text-xs text-[var(--muted-foreground)]">No payment records.</p>
              )}
            </CardContent>
          </Card>

          {/* Attendance summary */}
          <Card>
            <CardContent className="p-0">
              <div
                className="border-b px-4 py-3"
                style={{ borderColor: "var(--border)" }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <T k="attendance" />
                </p>
              </div>
              <div className="p-4">
                {data?.totalAttendance === 0 ? (
                  <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">No attendance records this month.</p>
                ) : (
                  <>
                    {/* Big % */}
                    <div className="mb-4 flex items-end gap-2">
                      <span
                        className="text-4xl font-extrabold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {data?.attendancePct ?? "—"}
                        {data?.attendancePct != null ? "%" : ""}
                      </span>
                      <span className="mb-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        present rate
                      </span>
                    </div>

                    {/* Progress bar */}
                    {data?.attendancePct != null && (
                      <div
                        className="mb-4 h-2 w-full overflow-hidden rounded-full"
                        style={{ background: "var(--muted)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${data.attendancePct}%`,
                            background: data.attendancePct >= 80
                              ? "#34d399"
                              : data.attendancePct >= 60
                                ? "#fbbf24"
                                : "#f87171",
                          }}
                        />
                      </div>
                    )}

                    {/* Breakdown */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { tKey: "present" as const, count: data?.presentCount ?? 0, color: "#34d399" },
                        { tKey: "absent" as const,  count: data?.absentCount  ?? 0, color: "#f87171" },
                        { tKey: "late" as const,    count: data?.lateCount    ?? 0, color: "#fbbf24" },
                      ].map((item) => (
                        <div
                          key={item.tKey}
                          className="rounded-lg py-2"
                          style={{ background: "var(--muted)" }}
                        >
                          <p className="text-base font-bold" style={{ color: item.color }}>
                            {item.count}
                          </p>
                          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                            <T k={item.tKey} />
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coach Notes placeholder (no player_note model — graceful empty state) */}
        <Card>
          <CardContent className="p-0">
            <div
              className="border-b px-4 py-3"
              style={{ borderColor: "var(--border)" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--muted-foreground)" }}
              >
                <T k="notes" />
              </p>
            </div>
            <p className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
              No notes from coaches yet.
            </p>
          </CardContent>
        </Card>

        {/* Announcements */}
        {(data?.announcements.length ?? 0) > 0 && (
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
                  <T k="announcements" />
                </p>
                <Link
                  href="/dashboard/parent/announcements"
                  className="text-xs"
                  style={{ color: "#cccccc" }}
                >
                  <T k="view_all" />
                </Link>
              </div>
              <ul className="divide-y divide-[var(--border)]">
                {data!.announcements.map((a) => (
                  <li key={a.id} className="px-4 py-3">
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      {a.title}
                    </p>
                    <p
                      className="mt-0.5 text-xs truncate max-w-lg"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {a.body}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
