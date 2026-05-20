"use client";

import { motion } from "framer-motion";
import {
  Users, UserCheck, CalendarDays, CreditCard,
  TrendingUp, TrendingDown, AlertCircle, Clock,
  Sparkles, ArrowRight, ArrowLeft, Activity, ChevronRight, ChevronLeft,
} from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

/* ── Types ─────────────────────────────────────────────────────────────── */
interface DashboardStats {
  totalPlayers: number; activePlayers: number; totalCoaches: number;
  upcomingSessions: number; overduePayments: number;
  monthRevenue: number; revenueGrowth: number;
  pendingPayments: { _sum: { amount: number | null }; _count: number };
  recentPlayers: { id: string; name: string; ageGroup: string; status: string; parentName: string; enrollmentDate: string }[];
  attendanceChart: { name: string; value: number; color: string }[];
  revenueChart: { month: string; revenue: number }[];
  upcomingSessionsList: { id: string; title: string; group: string; coach: string; pitch: string; startTime: string }[];
}

/* ── Animated Counter ──────────────────────────────────────────────────── */
function Counter({ value, prefix = "", decimals = 0 }: { value: number; prefix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) return;
    const duration = 1000;
    const step = (ts: number, start: number) => {
      const p = Math.min((ts - start) / duration, 1);
      setDisplay((1 - Math.pow(1 - p, 3)) * value);
      if (p < 1) requestAnimationFrame((t) => step(t, start));
    };
    requestAnimationFrame((t) => step(t, t));
  }, [value]);
  return <>{prefix}{display.toFixed(decimals)}</>;
}

/* ── Stat Card ─────────────────────────────────────────────────────────── */
function StatCard({
  label, value, sub, icon: Icon, trend, trendLabel, delay, prefix = "", decimals = 0,
}: {
  label: string; value: number; sub?: string; icon: React.ElementType;
  trend?: "up" | "down"; trendLabel?: string; delay: number;
  prefix?: string; decimals?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.4,0,0.2,1] }}
      whileHover={{ y: -1, transition: { duration: 0.15 } }}
      className="card-brand relative overflow-hidden rounded-lg border p-5"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "var(--muted-foreground)" }}
          >
            {label}
          </p>
          <p className="mt-2 text-2xl font-black tabular-nums tracking-tight" style={{ color: "var(--foreground)" }}>
            <Counter value={value} prefix={prefix} decimals={decimals} />
          </p>
          {sub && (
            <p className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{sub}</p>
          )}
        </div>
        <div
          className="rounded-lg p-2"
          style={{ background: "rgba(26,58,143,0.12)" }}
        >
          <Icon className="h-4 w-4" style={{ color: "var(--foreground)" }} />
        </div>
      </div>
      {trendLabel && (
        <div className="mt-3 flex items-center gap-1">
          {trend === "up"
            ? <TrendingUp   className="h-3 w-3 text-[#7799ee]" />
            : <TrendingDown className="h-3 w-3 text-red-400" />
          }
          <span className={`text-[11px] font-medium ${trend === "up" ? "text-[#7799ee]" : "text-red-400"}`}>
            {trendLabel}
          </span>
        </div>
      )}
    </motion.div>
  );
}

/* ── Tooltip ───────────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border px-3 py-2 text-xs"
      style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
      <p className="mb-1 font-semibold">{label}</p>
      <p style={{ color: "#cccccc" }}>KWD {payload[0].value.toFixed(3)}</p>
    </div>
  );
}

/* ── Status Badge ──────────────────────────────────────────────────────── */
const statusClass: Record<string, string> = {
  ACTIVE:    "badge-active",
  INACTIVE:  "badge-inactive",
  WAITLIST:  "badge-waitlist",
  SUSPENDED: "badge-suspended",
};

/* ── Main ──────────────────────────────────────────────────────────────── */
export function DashboardClient({ stats }: { stats: DashboardStats }) {
  const { t, locale, dir } = useTranslation();
  const isRTL = dir === "rtl";
  const pendingAmt = stats.pendingPayments?._sum?.amount ?? 0;
  const pendingCnt = stats.pendingPayments?._count ?? 0;

  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const Chevron = isRTL ? ChevronLeft : ChevronRight;

  // Demo data when DB is empty
  const revenueData = stats.revenueChart.every(r => r.revenue === 0)
    ? stats.revenueChart.map((r, i) => ({ ...r, revenue: [85, 140, 110, 195, 160, 220][i] ?? 0 }))
    : stats.revenueChart;

  const attendanceData = stats.attendanceChart.every(a => a.value === 0)
    ? [
        { name: t("present"), value: 68, color: "#ffffff" },
        { name: t("absent"),  value: 14, color: "#ef4444" },
        { name: t("late"),    value: 12, color: "#ca8a04" },
        { name: t("excused"), value: 6,  color: "#888888" },
      ]
    : stats.attendanceChart;

  const statusLabels: Record<string, string> = {
    ACTIVE: t("active"),
    INACTIVE: t("inactive"),
    WAITLIST: t("waitlist"),
    SUSPENDED: t("suspended"),
  };

  return (
    <div className="flex-1 overflow-y-auto p-5" style={{ background: "var(--background)" }}>
      <div className="mx-auto max-w-7xl space-y-5">

        {/* ── Stat cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label={t("total_players")}     value={stats.totalPlayers}     sub={t("active_players", { n: stats.activePlayers })}    icon={Users}       delay={0}    />
          <StatCard label={t("coaching_staff")}    value={stats.totalCoaches}     sub={t("on_staff")}                           icon={UserCheck}    delay={0.05} />
          <StatCard label={t("upcoming_sessions")} value={stats.upcomingSessions} sub={t("scheduled")}                          icon={CalendarDays} delay={0.1}  />
          <StatCard label={t("month_revenue")}     value={stats.monthRevenue}     prefix="KWD " decimals={3}
            sub={`${stats.revenueGrowth >= 0 ? "+" : ""}${t("vs_last_month", { n: stats.revenueGrowth })}`}
            icon={CreditCard} delay={0.15}
            trend={stats.revenueGrowth >= 0 ? "up" : "down"}
            trendLabel={`${stats.revenueGrowth >= 0 ? "+" : ""}${t("this_month", { n: stats.revenueGrowth })}`}
          />
        </div>

        {/* ── Charts row ─────────────────────────────────────── */}
        <div className="grid gap-3 lg:grid-cols-3">
          {/* Revenue area chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            className="card-brand col-span-2 rounded-lg border p-5"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
                  {t("revenue_overview")}
                </p>
                <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{t("last_6_months")}</p>
              </div>
              <span
                className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold"
                style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff" }}
              >
                <Activity className="h-2.5 w-2.5" /> {t("live_badge")}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ffffff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} reversed={isRTL} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} orientation={isRTL ? "right" : "left"} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#ffffff" strokeWidth={2}
                  fill="url(#revGrad)" dot={{ fill: "#ffffff", r: 3, strokeWidth: 0 }} activeDot={{ r: 4, fill: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Attendance donut */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            className="card-brand rounded-lg border p-5"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <p className="mb-0.5 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
              {t("attendance_split")}
            </p>
            <p className="mb-3 text-[11px]" style={{ color: "var(--muted-foreground)" }}>{t("all_sessions")}</p>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={attendanceData} cx="50%" cy="50%"
                  innerRadius={36} outerRadius={55}
                  paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {attendanceData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`${v} ${t("records")}`]}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11, color: "var(--foreground)" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {attendanceData.map((a) => (
                <div key={a.name} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: a.color }} />
                  <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                    {a.name}{" "}
                    <span className="font-semibold" style={{ color: "var(--foreground)" }}>{a.value}</span>
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Bottom row ─────────────────────────────────────── */}
        <div className="grid gap-3 lg:grid-cols-3">
          {/* Recent enrollments */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            className="card-brand col-span-2 rounded-lg border overflow-hidden"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div
              className="flex items-center justify-between border-b px-5 py-3.5"
              style={{ borderColor: "var(--border)" }}
            >
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
                {t("recent_enrollments")}
              </p>
              <Link
                href="/dashboard/players"
                className="flex items-center gap-1 text-[11px] font-medium transition-colors"
                style={{ color: "var(--foreground)" }}
              >
                {t("view_all")} <Arrow className="h-3 w-3" />
              </Link>
            </div>
            {stats.recentPlayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="mb-3 h-8 w-8 opacity-10" />
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {t("no_players_enrolled")}
                </p>
                <Link
                  href="/dashboard/players/new"
                  className="mt-3 text-[11px] font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  {t("add_first_player")}
                </Link>
              </div>
            ) : (
              <div>
                {stats.recentPlayers.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: isRTL ? 8 : -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.04 }}
                    className="flex items-center justify-between border-b px-5 py-3 last:border-0"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded text-[10px] font-black text-white"
                        style={{ background: "var(--primary)" }}
                      >
                        {p.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{p.name}</p>
                        <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                          {p.ageGroup} · {p.parentName}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusClass[p.status] ?? "badge-inactive"}`}>
                      {statusLabels[p.status] ?? p.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.35 }}
            className="flex flex-col gap-3"
          >
            {/* Alerts */}
            <div
              className="card-brand rounded-lg border p-4"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
                {t("alerts")}
              </p>
              <div className="space-y-2">
                {stats.overduePayments > 0 && (
                  <div className="flex items-start gap-2.5 rounded-md p-2.5"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                    <div>
                      <p className="text-[11px] font-semibold text-red-400">{t("overdue_count", { n: stats.overduePayments })}</p>
                      <p className="text-[10px] text-red-400/60">{t("action_required")}</p>
                    </div>
                  </div>
                )}
                {pendingCnt > 0 && (
                  <div className="flex items-start gap-2.5 rounded-md p-2.5"
                    style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.15)" }}>
                    <CreditCard className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-500" />
                    <div>
                      <p className="text-[11px] font-semibold text-yellow-500">{t("pending_invoices", { n: pendingCnt })}</p>
                      <p className="text-[10px] text-yellow-500/60">KWD {(pendingAmt ?? 0).toFixed(3)}</p>
                    </div>
                  </div>
                )}
                {stats.overduePayments === 0 && pendingCnt === 0 && (
                  <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                    {t("no_active_alerts")}
                  </p>
                )}
              </div>
            </div>

            {/* AI Assistant CTA */}
            <Link href="/dashboard/ai">
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="group relative overflow-hidden rounded-lg border p-4 transition-all cursor-pointer"
                style={{
                  background: "rgba(26,58,143,0.12)",
                  borderColor: "rgba(26,58,143,0.3)",
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(26,58,143,0.08)" }} />
                <div className="relative">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--foreground)" }} />
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
                      {t("ai_assistant")}
                    </p>
                    <span
                      className={`${isRTL ? "mr-auto" : "ml-auto"} rounded px-1.5 py-0.5 text-[9px] font-bold`}
                      style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                    >
                      {t("new_badge")}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    {t("ai_cta_desc")}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-medium"
                    style={{ color: "var(--foreground)" }}>
                    {t("open_assistant")} <Chevron className="h-3 w-3" />
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Upcoming sessions */}
            {stats.upcomingSessionsList.length > 0 && (
              <div
                className="card-brand rounded-lg border p-4"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
                  {t("next_sessions")}
                </p>
                <div className="space-y-2">
                  {stats.upcomingSessionsList.slice(0, 3).map((s) => (
                    <div key={s.id} className="flex items-start gap-2">
                      <Clock className="mt-0.5 h-3 w-3 shrink-0" style={{ color: "var(--foreground)" }} />
                      <div>
                        <p className="text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>{s.title}</p>
                        <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                          {new Date(s.startTime).toLocaleDateString(locale === "ar" ? "ar-KW" : "en-KW", { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
