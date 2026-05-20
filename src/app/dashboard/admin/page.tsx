import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { DashboardClient } from "@/app/dashboard/dashboard-client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

async function getAdminStats() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    const [
      totalPlayers, activePlayers, totalCoaches,
      upcomingSessions, pendingPayments, overduePayments,
      monthRevenue, lastMonthRevenue, recentPlayers,
      attendanceData, revenueByMonth, sessionsByDay,
    ] = await Promise.all([
      db.player.count(),
      db.player.count({ where: { status: "ACTIVE" } }),
      db.coach.count(),
      db.trainingSession.count({ where: { status: "SCHEDULED", startTime: { gte: now } } }),
      db.payment.aggregate({ where: { status: "PENDING" }, _sum: { amount: true }, _count: true }),
      db.payment.count({ where: { status: "OVERDUE" } }),
      db.payment.aggregate({ where: { status: "PAID", paidAt: { gte: monthStart } }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { status: "PAID", paidAt: { gte: lastMonthStart, lt: monthStart } }, _sum: { amount: true } }),
      db.player.findMany({ orderBy: { enrollmentDate: "desc" }, take: 6, include: { parent: { include: { user: true } } } }),
      db.attendance.groupBy({ by: ["status"], _count: { status: true } }),
      db.payment.findMany({ where: { status: "PAID", paidAt: { not: null } }, select: { amount: true, paidAt: true }, orderBy: { paidAt: "asc" }, take: 100 }),
      db.trainingSession.findMany({ where: { startTime: { gte: now } }, orderBy: { startTime: "asc" }, take: 5, include: { group: true, coach: { include: { user: true } } } }),
    ]);

    const revenueChart = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const month = monthNames[d.getMonth()];
      const total = revenueByMonth
        .filter(p => { if (!p.paidAt) return false; const pd = new Date(p.paidAt); return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth(); })
        .reduce((s, p) => s + p.amount, 0);
      return { month, revenue: total };
    });

    const presentCount  = attendanceData.find(a => a.status === "PRESENT")?._count.status ?? 0;
    const absentCount   = attendanceData.find(a => a.status === "ABSENT")?._count.status ?? 0;
    const lateCount     = attendanceData.find(a => a.status === "LATE")?._count.status ?? 0;
    const excusedCount  = attendanceData.find(a => a.status === "EXCUSED")?._count.status ?? 0;
    const curr = monthRevenue._sum.amount ?? 0;
    const prev = lastMonthRevenue._sum.amount ?? 0;
    const revenueGrowth = prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

    return {
      totalPlayers, activePlayers, totalCoaches, upcomingSessions,
      pendingPayments, overduePayments,
      monthRevenue: curr, revenueGrowth,
      recentPlayers: recentPlayers.map(p => ({
        id: p.id, name: `${p.firstName} ${p.lastName}`,
        ageGroup: p.ageGroup, status: p.status,
        parentName: p.parent?.user?.name ?? "—",
        enrollmentDate: p.enrollmentDate.toISOString(),
      })),
      attendanceChart: [
        { name: "Present",  value: presentCount,  color: "#3b82f6" },
        { name: "Absent",   value: absentCount,   color: "#ef4444" },
        { name: "Late",     value: lateCount,     color: "#f59e0b" },
        { name: "Excused",  value: excusedCount,  color: "#8b5cf6" },
      ],
      revenueChart,
      upcomingSessionsList: sessionsByDay.map(s => ({
        id: s.id, title: s.title,
        group: s.group.name, coach: s.coach?.user?.name ?? "—",
        pitch: s.pitch, startTime: s.startTime.toISOString(),
      })),
    };
  } catch {
    return {
      totalPlayers: 0, activePlayers: 0, totalCoaches: 0, upcomingSessions: 0,
      pendingPayments: { _sum: { amount: null }, _count: 0 },
      overduePayments: 0, monthRevenue: 0, revenueGrowth: 0,
      recentPlayers: [], attendanceChart: [], revenueChart: [], upcomingSessionsList: [],
    };
  }
}

export default async function AdminDashboardPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (role !== Role.ADMIN) redirect("/dashboard/access-denied");

  const stats = await getAdminStats();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="Admin Dashboard" subtitle="Full academy overview — all systems" />
      <DashboardClient stats={stats} />
    </div>
  );
}
