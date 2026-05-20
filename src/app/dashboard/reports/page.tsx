import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { AgeGroup, Role } from "@prisma/client";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportsContent } from "@/components/reports/reports-content";

const FALLBACK_REPORTS_DATA = {
  enrollmentByAgeGroup: [] as { ageGroup: AgeGroup; _count: { id: number } }[],
  revenuePaid: { _sum: { amount: null }, _count: 0 },
  revenuePending: { _sum: { amount: null }, _count: 0 },
  revenueOverdue: { _sum: { amount: null }, _count: 0 },
  totalAttendance: 0,
  presentAttendance: 0,
  attendanceRate: 0,
  monthlyRevenue: [] as { label: string; total: number; count: number }[],
};

async function getReportsData() {
  const now = new Date();

  // Build last 6 months date ranges
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, 5 - i);
    return {
      label: format(date, "MMM yyyy"),
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  });

  try {
    const [
      enrollmentByAgeGroup,
      revenuePaid,
      revenuePending,
      revenueOverdue,
      totalAttendance,
      presentAttendance,
    ] = await Promise.all([
      // Enrollment by age group
      db.player.groupBy({
        by: ["ageGroup"],
        _count: { id: true },
        orderBy: { ageGroup: "asc" },
      }),
      // Revenue paid
      db.payment.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
        _count: true,
      }),
      // Revenue pending
      db.payment.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
        _count: true,
      }),
      // Revenue overdue
      db.payment.aggregate({
        where: { status: "OVERDUE" },
        _sum: { amount: true },
        _count: true,
      }),
      // Total attendance records
      db.attendance.count(),
      // Present attendance records
      db.attendance.count({ where: { status: "PRESENT" } }),
    ]);

    // Monthly revenue trend (last 6 months) — run sequentially to keep query count manageable
    const monthlyRevenue = await Promise.all(
      months.map(async (m) => {
        const agg = await db.payment.aggregate({
          where: {
            status: "PAID",
            paidAt: { gte: m.start, lte: m.end },
          },
          _sum: { amount: true },
          _count: true,
        });
        return {
          label: m.label,
          total: agg._sum.amount ?? 0,
          count: agg._count,
        };
      })
    );

    const attendanceRate =
      totalAttendance > 0
        ? Math.round((presentAttendance / totalAttendance) * 100)
        : 0;

    return {
      enrollmentByAgeGroup,
      revenuePaid,
      revenuePending,
      revenueOverdue,
      totalAttendance,
      presentAttendance,
      attendanceRate,
      monthlyRevenue,
    };
  } catch {
    return {
      ...FALLBACK_REPORTS_DATA,
      monthlyRevenue: months.map((m) => ({ label: m.label, total: 0, count: 0 })),
    };
  }
}

export default async function ReportsPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const data = await getReportsData();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Reports & Analytics" subtitle="Academy-wide performance and financial summary" />

      <ReportsContent
        data={{
          enrollmentByAgeGroup: data.enrollmentByAgeGroup as { ageGroup: "U5" | "U7" | "U9" | "U11" | "U13" | "U15"; _count: { id: number } }[],
          revenuePaid: { _sum: { amount: data.revenuePaid._sum.amount ?? null }, _count: data.revenuePaid._count },
          revenuePending: { _sum: { amount: data.revenuePending._sum.amount ?? null }, _count: data.revenuePending._count },
          revenueOverdue: { _sum: { amount: data.revenueOverdue._sum.amount ?? null }, _count: data.revenueOverdue._count },
          totalAttendance: data.totalAttendance,
          presentAttendance: data.presentAttendance,
          attendanceRate: data.attendanceRate,
          monthlyRevenue: data.monthlyRevenue,
        }}
      />
    </div>
  );
}
