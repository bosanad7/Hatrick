import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Users, UserCheck, CalendarDays, CreditCard, TrendingUp, AlertCircle, BarChart3 } from "lucide-react";
import Link from "next/link";

async function getManagerStats() {
  try {
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      activePlayers,
      totalCoaches,
      totalGroups,
      sessionsThisMonth,
      paidRevenue,
      pendingRevenue,
      overdueRevenue,
      totalAttendance,
      presentAttendance,
      coachesWithSessions,
    ] = await Promise.all([
      db.player.count({ where: { status: "ACTIVE" } }),
      db.coach.count(),
      db.group.count(),
      db.trainingSession.count({
        where: { startTime: { gte: monthStart, lte: monthEnd } },
      }),
      db.payment.aggregate({
        where: { status: "PAID", paidAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: { status: "OVERDUE" },
        _sum: { amount: true },
      }),
      db.attendance.count({
        where: { session: { startTime: { gte: monthStart } } },
      }),
      db.attendance.count({
        where: {
          status: "PRESENT",
          session: { startTime: { gte: monthStart } },
        },
      }),
      // Coach workload: each coach with session count this month
      db.coach.findMany({
        include: {
          user: { select: { name: true, email: true } },
          _count: {
            select: {
              sessions: {
                where: { startTime: { gte: monthStart, lte: monthEnd } },
              },
            },
          },
        },
        orderBy: { hireDate: "asc" },
      }),
    ]);

    const attendanceRate = totalAttendance > 0
      ? Math.round((presentAttendance / totalAttendance) * 100)
      : null;

    return {
      activePlayers,
      totalCoaches,
      totalGroups,
      sessionsThisMonth,
      paidRevenue:    paidRevenue._sum.amount    ?? 0,
      pendingRevenue: pendingRevenue._sum.amount  ?? 0,
      overdueRevenue: overdueRevenue._sum.amount  ?? 0,
      totalAttendance,
      presentAttendance,
      attendanceRate,
      coachesWithSessions,
    };
  } catch {
    return {
      activePlayers: 0, totalCoaches: 0, totalGroups: 0, sessionsThisMonth: 0,
      paidRevenue: 0, pendingRevenue: 0, overdueRevenue: 0,
      totalAttendance: 0, presentAttendance: 0, attendanceRate: null,
      coachesWithSessions: [],
    };
  }
}

export default async function ManagerDashboardPage() {
  const session = await auth();
  const role    = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) redirect("/dashboard/access-denied");

  const s = await getManagerStats();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Manager Dashboard" subtitle="Academy operations overview" />
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Operational KPIs */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: "Active Players",
              value: s.activePlayers,
              icon: Users,
              href:  "/dashboard/manager/players",
              color: "#ffffff",
            },
            {
              label: "Total Coaches",
              value: s.totalCoaches,
              icon: UserCheck,
              href:  "/dashboard/manager/coaches",
              color: "#cccccc",
            },
            {
              label: "Total Groups",
              value: s.totalGroups,
              icon: BarChart3,
              href:  "/dashboard/manager/groups",
              color: "#ffffff",
            },
            {
              label: "Sessions This Month",
              value: s.sessionsThisMonth,
              icon: CalendarDays,
              href:  "/dashboard/manager/schedule",
              color: "#10b981",
            },
          ].map((c) => (
            <Link key={c.label} href={c.href}>
              <Card className="card-brand cursor-pointer hover:scale-[1.01] transition-transform">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-xs font-medium uppercase tracking-wide"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {c.label}
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

        {/* Revenue summary */}
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
                Revenue Summary
              </p>
              <Link
                href="/dashboard/manager/payments"
                className="text-xs"
                style={{ color: "#cccccc" }}
              >
                View all payments
              </Link>
            </div>
            <div className="grid grid-cols-3 divide-x divide-[var(--border)]">
              {[
                {
                  label: "Collected (MTD)",
                  amount: s.paidRevenue,
                  icon: TrendingUp,
                  color: "#34d399",
                },
                {
                  label: "Pending",
                  amount: s.pendingRevenue,
                  icon: CreditCard,
                  color: "#fbbf24",
                },
                {
                  label: "Overdue",
                  amount: s.overdueRevenue,
                  icon: AlertCircle,
                  color: "#f87171",
                },
              ].map((r) => (
                <div key={r.label} className="flex flex-col items-center py-5 px-4 gap-1">
                  <div
                    className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: `${r.color}1a` }}
                  >
                    <r.icon className="h-4 w-4" style={{ color: r.color }} />
                  </div>
                  <p
                    className="text-lg font-bold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {formatCurrency(r.amount, "KWD")}
                  </p>
                  <p
                    className="text-[11px] font-medium text-center"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {r.label}
                  </p>
                </div>
              ))}
            </div>
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
                Attendance — This Month
              </p>
            </div>
            <div className="p-4">
              {s.totalAttendance === 0 ? (
                <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">
                  No attendance data for this month yet.
                </p>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-end gap-2">
                      <span
                        className="text-3xl font-extrabold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {s.attendanceRate ?? "—"}
                        {s.attendanceRate != null ? "%" : ""}
                      </span>
                      <span className="mb-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        overall attendance rate
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {s.presentAttendance} / {s.totalAttendance} present
                    </span>
                  </div>
                  <div
                    className="h-2.5 w-full overflow-hidden rounded-full"
                    style={{ background: "var(--muted)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(s.attendanceRate ?? 0, 100)}%`,
                        background:
                          (s.attendanceRate ?? 0) >= 80
                            ? "#34d399"
                            : (s.attendanceRate ?? 0) >= 60
                              ? "#fbbf24"
                              : "#f87171",
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Coach workload table */}
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
                Coach Workload — This Month
              </p>
            </div>
            {s.coachesWithSessions.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                No coaches found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th
                        className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Coach
                      </th>
                      <th
                        className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Role
                      </th>
                      <th
                        className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wide"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Sessions MTD
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.coachesWithSessions.map((coach) => (
                      <tr
                        key={coach.id}
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex h-7 w-7 items-center justify-center rounded text-[10px] font-bold text-white"
                              style={{ background: "var(--primary)" }}
                            >
                              {(coach.user.name ?? coach.user.email ?? "?")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <span style={{ color: "var(--foreground)" }}>
                              {coach.user.name ?? coach.user.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase"
                            style={{
                              background: "rgba(26,58,143,0.12)",
                              color: "#cccccc",
                            }}
                          >
                            {coach.coachRole.replace("_", " ")}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 text-right font-semibold"
                          style={{ color: "var(--foreground)" }}
                        >
                          {coach._count.sessions}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
