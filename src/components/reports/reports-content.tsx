"use client";

import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  CalendarCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
} from "lucide-react";

type AgeGroup = "U5" | "U7" | "U9" | "U11" | "U13" | "U15";
const AGE_GROUP_ORDER: AgeGroup[] = ["U5", "U7", "U9", "U11", "U13", "U15"];

interface ReportsData {
  enrollmentByAgeGroup: { ageGroup: AgeGroup; _count: { id: number } }[];
  revenuePaid: { _sum: { amount: number | null }; _count: number };
  revenuePending: { _sum: { amount: number | null }; _count: number };
  revenueOverdue: { _sum: { amount: number | null }; _count: number };
  totalAttendance: number;
  presentAttendance: number;
  attendanceRate: number;
  monthlyRevenue: { label: string; total: number; count: number }[];
}

export function ReportsContent({ data }: { data: ReportsData }) {
  const { t } = useTranslation();

  const enrollmentMap: Partial<Record<AgeGroup, number>> = {};
  for (const row of data.enrollmentByAgeGroup) {
    enrollmentMap[row.ageGroup] = row._count.id;
  }
  const totalPlayers = data.enrollmentByAgeGroup.reduce(
    (sum, r) => sum + r._count.id,
    0
  );

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Export buttons */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {t("export_data")}
        </h2>
        <div className="flex flex-wrap gap-3">
          {[
            { type: "players", labelKey: "players_csv" as const },
            { type: "payments", labelKey: "payments_csv" as const },
            { type: "attendance", labelKey: "attendance_csv" as const },
            { type: "subscriptions", labelKey: "subscriptions_csv" as const },
          ].map(({ type, labelKey }) => (
            <a
              key={type}
              href={`/api/reports/export?type=${type}`}
              download
              className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--muted)]"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              <Download className="h-3.5 w-3.5" />
              {t(labelKey)}
            </a>
          ))}
        </div>
      </section>

      {/* Revenue Summary */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {t("revenue_summary")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">{t("total_collected")}</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">
                    {formatCurrency(data.revenuePaid._sum.amount ?? 0)}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    {data.revenuePaid._count} {t("payments").toLowerCase()}
                  </p>
                </div>
                <div className="rounded-xl bg-[rgba(26,58,143,0.08)] p-3">
                  <CheckCircle2 className="h-5 w-5 text-[#cccccc]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">{t("pending")}</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">
                    {formatCurrency(data.revenuePending._sum.amount ?? 0)}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    {data.revenuePending._count} {t("invoices")}
                  </p>
                </div>
                <div className="rounded-xl bg-[rgba(245,158,11,0.12)] p-3">
                  <Clock className="h-5 w-5 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">{t("overdue")}</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">
                    {formatCurrency(data.revenueOverdue._sum.amount ?? 0)}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    {data.revenueOverdue._count} {t("invoices")}
                  </p>
                </div>
                <div className="rounded-xl bg-[rgba(239,68,68,0.12)] p-3">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Enrollment & Attendance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Enrollment by age group */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-[#cccccc]" />
              {t("enrollment_by_age")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalPlayers === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">{t("no_players_enrolled")}</p>
            ) : (
              <div className="space-y-3">
                {AGE_GROUP_ORDER.map((ag) => {
                  const count = enrollmentMap[ag] ?? 0;
                  const pct = totalPlayers > 0 ? Math.round((count / totalPlayers) * 100) : 0;
                  return (
                    <div key={ag} className="flex items-center gap-3">
                      <span className="w-16 text-sm font-medium text-[var(--muted-foreground)]">
                        {ag.replace("U", "U")}
                      </span>
                      <div className="flex-1 rounded-full bg-[var(--track-bg)] h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-[var(--primary)] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm font-semibold text-[var(--foreground)]">
                        {count}
                      </span>
                    </div>
                  );
                })}
                <p className="pt-1 text-xs text-[var(--muted-foreground)] text-right">
                  {totalPlayers} {t("total_players").toLowerCase()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="h-4 w-4 text-[#cccccc]" />
              {t("attendance_rate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.totalAttendance === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">{t("no_data")}</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-bold text-[var(--foreground)]">
                    {data.attendanceRate}%
                  </span>
                  <span className="mb-1 text-sm text-[var(--muted-foreground)]">{t("overall_present")}</span>
                </div>

                <div className="rounded-full bg-[var(--track-bg)] h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full bg-[var(--primary)] transition-all"
                    style={{ width: `${data.attendanceRate}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl bg-[rgba(26,58,143,0.08)] p-3">
                    <p className="text-xs text-[var(--muted-foreground)]">{t("present")}</p>
                    <p className="mt-0.5 text-xl font-bold text-[#4466cc]">
                      {data.presentAttendance}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[var(--muted)] p-3">
                    <p className="text-xs text-[var(--muted-foreground)]">{t("total_records")}</p>
                    <p className="mt-0.5 text-xl font-bold text-[var(--foreground)]">
                      {data.totalAttendance}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Trend */}
      <section>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-[#cccccc]" />
              {t("monthly_revenue_trend")}
              <Badge variant="secondary" className="ml-auto text-xs font-normal">
                {t("last_6_months")}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    <th className="pb-2 pr-6">{t("month")}</th>
                    <th className="pb-2 pr-6">{t("payments")}</th>
                    <th className="pb-2 pr-6">{t("revenue")}</th>
                    <th className="pb-2 w-40">{t("bar")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data.monthlyRevenue.map((row) => {
                    const maxRevenue = Math.max(
                      ...data.monthlyRevenue.map((r) => r.total),
                      1
                    );
                    const pct = Math.round((row.total / maxRevenue) * 100);
                    return (
                      <tr key={row.label}>
                        <td className="py-2 pr-6 font-medium text-[var(--foreground)]">{row.label}</td>
                        <td className="py-2 pr-6 text-[var(--muted-foreground)]">{row.count}</td>
                        <td className="py-2 pr-6 font-semibold text-[#4466cc]">
                          {formatCurrency(row.total)}
                        </td>
                        <td className="py-2">
                          <div className="rounded-full bg-[var(--track-bg)] h-2 overflow-hidden">
                            <div
                              className="h-2 rounded-full bg-[var(--primary)] transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t">
                    <td className="pt-3 font-semibold text-[var(--foreground)]">{t("total")}</td>
                    <td className="pt-3 text-[var(--muted-foreground)]">
                      {data.monthlyRevenue.reduce((s, r) => s + r.count, 0)}
                    </td>
                    <td className="pt-3 font-bold text-[#4466cc]">
                      {formatCurrency(
                        data.monthlyRevenue.reduce((s, r) => s + r.total, 0)
                      )}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Stats Row */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {t("enrollment_overview")}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {AGE_GROUP_ORDER.map((ag) => (
            <Card key={ag}>
              <CardContent className="p-4 text-center">
                <p className="text-xs font-medium text-[var(--muted-foreground)]">
                  {ag.replace("U", `${t("under")} `)}
                </p>
                <p className="mt-1 text-3xl font-bold text-[var(--foreground)]">
                  {enrollmentMap[ag] ?? 0}
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{t("players").toLowerCase()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
